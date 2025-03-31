//@ts-nocheck
//chat/route.ts

import {
    type Message,
    StreamData,
    convertToCoreMessages,
    streamObject,
    streamText,
    generateText,
  } from 'ai';
  import { z } from 'zod';
  import { auth } from '@/app/(auth)/auth';
  import { customModel } from '@/lib/ai';
  import { models } from '@/lib/ai/models';
  import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
  import { CAttachment, CChat } from '@/lib/db/models';
  import { systemPrompt, toolUsePrompt } from '@/lib/ai/prompts';
  import {
    deleteChatById,
    getChatById,
    getDocumentById,
    saveChat,
    saveDocument,
    saveMessages,
    saveSuggestions,
  } from '@/lib/db/queries';
  import { BlobServiceClient } from '@azure/storage-blob';
  import {
    generateUUID,
    getMostRecentUserMessage,
    sanitizeResponseMessages,
  } from '@/lib/utils';
  import { generateTitleFromUserMessage } from '@/app/(chat)/actions';
  
  export const maxDuration = 60;
  
  type AllowedTools =
    | 'retrieveRegulations'
    | 'createDocument'
    | 'updateDocument'
    | 'requestSuggestions'
    | 'getWeather';
  
  const blocksTools: AllowedTools[] = [
    'createDocument',
    'updateDocument',
    'requestSuggestions',
  ];
  
  type BaseSuggestion = {
    id: string;
    documentId: string;
    originalText: string;
    suggestedText: string;
    description: string;
    isResolved: boolean;
  };
  
  const weatherTools: AllowedTools[] = ['getWeather'];
  
  const allTools: AllowedTools[] = [...blocksTools, ...weatherTools];
  
  async function deleteChatAndAttachments(chatId: string, userId: string) {
    // First verify the chat belongs to the user
    const chat = await CChat.findOne({ _id: chatId, userId });
    
    if (!chat) {
      throw new Error('Chat not found or unauthorized');
    }
  
    try {
      // Get all attachments for this chat
      const attachments = await CAttachment.find({ chatId });
  
      if (attachments.length > 0) {
        // Initialize Azure blob client
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING!
        );
        const containerClient = blobServiceClient.getContainerClient(
          process.env.AZURE_STORAGE_CONTAINER_NAME!
        );
  
        // Delete all blobs
        for (const attachment of attachments) {
          const blobName = attachment.url.split('/').pop();
          if (blobName) {
            const blobClient = containerClient.getBlockBlobClient(blobName);
            await blobClient.delete();
          }
        }
  
        // Delete all attachments from MongoDB
        await CAttachment.deleteMany({ chatId });
      }
  
      // Finally delete the chat
      await CChat.findByIdAndDelete(chatId);
  
    } catch (error) {
      console.error('Error during deletion process:', error);
      throw error;
    }
  }

  async function loadRegulationsFromBlob() {
    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING!
      );
      const containerClient = blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER_NAME!
      );
      const blobClient = containerClient.getBlobClient('regulations.jsonl');
      
      const downloadResponse = await blobClient.download();
      const regulations = await streamToString(downloadResponse.readableStreamBody!);
      
      // Parse the regulations into a map for quick lookup
      return regulations
        .split('\n')
        .filter(line => line.trim())
        .reduce((acc, line) => {
          const parsed = JSON.parse(line);
          const [key, value] = Object.entries(parsed)[0];
          acc[key] = value; // Map the key (e.g., "21 CFR 1.1") to the regulation text
          return acc;
        }, {} as Record<string, string>);
    } catch (error) {
      console.error('Error loading regulations:', error);
      throw error;
    }
  }

  function extractCodes(llmResponse: string): { cfrCodes: string[], fdcCodes: string[] } {
    const cfrPattern = /<BEGIN_CFR_LIST>\n(.*?)\n<END_CFR_LIST>/s;
    
    const cfrMatch = cfrPattern.exec(llmResponse);
    
    return {
        cfrCodes: cfrMatch ? cfrMatch[1].trim().split(', ').filter(code => code.length > 0) : [],
    };
  }

  async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        readableStream.on('data', (data) => {
            chunks.push(data.toString());
        });
        readableStream.on('end', () => {
            resolve(chunks.join(''));
        });
        readableStream.on('error', reject);
    });
}
  
  export async function POST(request: Request) {
    const {
      id,
      messages,
      modelId,
      experimental_attachments,
    }: { id: string; messages: Array<Message>; modelId: string; 
         experimental_attachments?: Array<{ url: string; name: string; contentType: string; }>; 
       } = await request.json();
  
    const session = await auth();
  
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }
  
    const model = models.find((model) => model.id === modelId);
  
    if (!model) {
      console.log("lol");
      return new Response('Model not found', { status: 404 });
    }
  
    const coreMessages = convertToCoreMessages(
      messages.map(message => {
        // If attachments exist and it's a user message, include them
        if (message.role === 'user' && experimental_attachments?.length) {
          return {
            ...message,
            attachments: experimental_attachments.map(attachment => ({
              url: attachment.url,
              name: attachment.name,
              contentType: attachment.contentType || 'application/octet-stream',
            }))
          };
        }
        return message;
      })
    );
  
    const userMessage = getMostRecentUserMessage(coreMessages);
  
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }
  
    const chat = await getChatById({ id });
  
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    }
  
    await saveMessages({
      messages: [
        { ...userMessage, id: generateUUID(), createdAt: new Date(), chatId: id },
      ],
    });
  
    const streamingData = new StreamData();
    
    const { text: llmresp } = await generateText({
        model: customModel(DEFAULT_MODEL_NAME),
        messages: [
          ...coreMessages.slice(0, -1), 
          {
            role: 'user',
            content: `You are a specialized FDA regulatory analyst. Your task is to extract EVERY CFR (Code of Federal Regulations) 
            violation code for the following user message, also consider to mention other codes that will be needed based
            on conversation history. Follow these exact rules:

            For CFR codes:

            List all codes in a single line inside the markers, separated by commas and spaces
            Format each code exactly as: 21 CFR x.y (not 21 CFR x(y) or CFR 21.x)
            Do not include subsections like (a), (b), (1), (2) - only use the main section numbers
            When "Parts" are mentioned, list each part number separately
            Do not include codes in the form: 21 CFR 211, 21 CFR 223 etc. They MUST be for example: 21 CFR 211.22, 21 CFR 223.10 etc.

            Format must be exactly:
            <BEGIN_CFR_LIST>
            21 CFR 211.22, 21 CFR 211.25, 21 CFR 211.42
            <END_CFR_LIST>

            CFR Examples:

            Convert "21 CFR 211.84(d)(1)" to "21 CFR 211.84"
            Convert "21 CFR Parts 210 and 211" to "21 CFR 210, 21 CFR 211"
            Convert "21 CFR 820.30(a)" to "21 CFR 820.30"

            If no codes are found in either category, output:
            <BEGIN_CFR_LIST>
            NO_CFR_CODES_FOUND
            <END_CFR_LIST>

            Do not add any additional text or commentary. Only output the markers and codes.
            Only include codes relevant to the current user message, considering conversation history too, 
            if they are referencing other previously mentioned codes.
            Current User message:\n${userMessage.content}`
        }],
        tools: {
          getWeather: {
            description: 'Get the current weather at a location',
            parameters: z.object({
              latitude: z.number(),
              longitude: z.number(),
            }),
            execute: async ({ latitude, longitude }) => {
              const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
              );
    
              const weatherData = await response.json();
              return weatherData;
            },
          },
          createDocument: {
            description: 'Create a document for a writing activity',
            parameters: z.object({
              title: z.string(),
            }),
            execute: async ({ title }) => {
              const id = generateUUID();
              let draftText = '';
    
              streamingData.append({
                type: 'id',
                content: id,
              });
    
              streamingData.append({
                type: 'title',
                content: title,
              });
    
              streamingData.append({
                type: 'clear',
                content: '',
              });
    
              const { fullStream } = await streamText({
                model: customModel(model.apiIdentifier),
                system:
                  'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
                prompt: title,
              });
    
              for await (const delta of fullStream) {
                const { type } = delta;
    
                if (type === 'text-delta') {
                  const { textDelta } = delta;
    
                  draftText += textDelta;
                  streamingData.append({
                    type: 'text-delta',
                    content: textDelta,
                  });
                }
              }
    
              streamingData.append({ type: 'finish', content: '' });
    
              if (session.user?.id) {
                await saveDocument({
                  id,
                  title,
                  content: draftText,
                  userId: session.user.id,
                });
              }
    
              return {
                id,
                title,
                content: 'A document was created and is now visible to the user.',
              };
            },
          },
          updateDocument: {
            description: 'Update a document with the given description',
            parameters: z.object({
              id: z.string().describe('The ID of the document to update'),
              description: z
                .string()
                .describe('The description of changes that need to be made'),
            }),
            execute: async ({ id, description }) => {
              const document = await getDocumentById({ id });
    
              if (!document) {
                return {
                  error: 'Document not found',
                };
              }
    
              const { content: currentContent } = document;
              let draftText = '';
    
              streamingData.append({
                type: 'clear',
                content: document.title,
              });
    
              const { fullStream } = await streamText({
                model: customModel(model.apiIdentifier),
                system:
                  'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
                /*experimental_providerMetadata: {
                  openai: {
                    prediction: {
                      type: 'content',
                      content: currentContent,
                    },
                  },
                },*/
                messages: [
                  {
                    role: 'user',
                    content: description,
                  },
                  { role: 'user', content: currentContent },
                ],
              });
    
              for await (const delta of fullStream) {
                const { type } = delta;
    
                if (type === 'text-delta') {
                  const { textDelta } = delta;
    
                  draftText += textDelta;
                  streamingData.append({
                    type: 'text-delta',
                    content: textDelta,
                  });
                }
              }
    
              streamingData.append({ type: 'finish', content: '' });
    
              if (session.user?.id) {
                await saveDocument({
                  id,
                  title: document.title,
                  content: draftText,
                  userId: session.user.id,
                });
              }
    
              return {
                id,
                title: document.title,
                content: 'The document has been updated successfully.',
              };
            },
          },
          requestSuggestions: {
            description: 'Request suggestions for a document',
            parameters: z.object({
              documentId: z
                .string()
                .describe('The ID of the document to request edits'),
            }),
            execute: async ({ documentId }) => {
              const document = await getDocumentById({ id: documentId });
    
              if (!document || !document.content) {
                return {
                  error: 'Document not found',
                };
              }
    
              const suggestions: BaseSuggestion[] = [];
    
              const { elementStream } = await streamObject({
                model: customModel(model.apiIdentifier),
                system:
                  'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
                prompt: document.content,
                output: 'array',
                schema: z.object({
                  originalSentence: z.string().describe('The original sentence'),
                  suggestedSentence: z.string().describe('The suggested sentence'),
                  description: z
                    .string()
                    .describe('The description of the suggestion'),
                }),
              });
    
              for await (const element of elementStream) {
                const suggestion = {
                  originalText: element.originalSentence,
                  suggestedText: element.suggestedSentence,
                  description: element.description,
                  id: generateUUID(),
                  documentId: documentId,
                  isResolved: false,
                };
    
                streamingData.append({
                  type: 'suggestion',
                  content: suggestion,
                });
    
                suggestions.push(suggestion);
              }
    
              if (session.user?.id) {
                const userId = session.user.id;
    
                await saveSuggestions({
                  suggestions: suggestions.map((suggestion) => ({
                    ...suggestion,
                    userId,
                    createdAt: new Date(),
                    documentCreatedAt: document.createdAt,
                  })),
                });
              }
    
              return {
                id: documentId,
                title: document.title,
                message: 'Suggestions have been added to the document',
              };
            },
          },
        },
        onFinish: async ({ responseMessages }) => {
          if (session.user?.id) {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages(responseMessages);
    
              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();
    
                    if (message.role === 'assistant') {
                      streamingData.appendMessageAnnotation({
                        messageIdFromServer: messageId,
                      });
                    }
    
                    return {
                      id: messageId,
                      chatId: id,
                      role: message.role,
                      content: message.content,
                      createdAt: new Date(),
                    };
                  },
                ),
              });
            } catch (error) {
              console.error('Failed to save chat');
            }
          }
    
          streamingData.close();
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
        },
    });

    const { cfrCodes } = extractCodes(llmresp); 
    // Load regulations 
    const regulations = await loadRegulationsFromBlob();
    // Construct regulation references based on extracted codes
    const regulationReferences = cfrCodes.length > 0 && cfrCodes[0] !== 'NO_CFR_CODES_FOUND'
    ? cfrCodes
        .map(code => `${code}: ${regulations[code] || 'No detailed regulation text found'}`)
        .join('\n')
    : '';

    // Prepare messages for streamText
    const messagesWithRegulations = [
      ...coreMessages.slice(0, -1), // All messages except the last
      {
        role: "system",
        content: "The following are instructions and policies from Grimoire.Corp for you:\n" + systemPrompt + '\n' + toolUsePrompt + 
        (regulationReferences 
          ? `\n\n---RELEVANT REGULATIONS FOR YOUR REFERENCE PROVIDED BY GRIMOIRE.CORP RELEVANT TO USER MESSAGE---\n${regulationReferences}` 
          : '\n\n---NO REGULATIONS FOR REFERENCE WERE PROVIDED FOR THE CURRENT USER MESSAGE---\n') + 
        '\nYour generated reponse will be sent to the compliance officer, they are your direct audience in the conversation.'
      },
      {
        role: "user", // Last message
        content: coreMessages[coreMessages.length - 1].content
      }
    ];

    const result = await streamText({
      model: customModel(model.apiIdentifier),
      messages: messagesWithRegulations,
      maxSteps: 5,
      experimental_activeTools: allTools,
      tools: {
        getWeather: {
          description: 'Get the current weather at a location',
          parameters: z.object({
            latitude: z.number(),
            longitude: z.number(),
          }),
          execute: async ({ latitude, longitude }) => {
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
            );
  
            const weatherData = await response.json();
            return weatherData;
          },
        },
        createDocument: {
          description: 'Create a document for a writing activity',
          parameters: z.object({
            title: z.string(),
          }),
          execute: async ({ title }) => {
            const id = generateUUID();
            let draftText = '';
  
            streamingData.append({
              type: 'id',
              content: id,
            });
  
            streamingData.append({
              type: 'title',
              content: title,
            });
  
            streamingData.append({
              type: 'clear',
              content: '',
            });
  
            const { fullStream } = await streamText({
              model: customModel(model.apiIdentifier),
              system:
                'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
              prompt: title,
            });
  
            for await (const delta of fullStream) {
              const { type } = delta;
  
              if (type === 'text-delta') {
                const { textDelta } = delta;
  
                draftText += textDelta;
                streamingData.append({
                  type: 'text-delta',
                  content: textDelta,
                });
              }
            }
  
            streamingData.append({ type: 'finish', content: '' });
  
            if (session.user?.id) {
              await saveDocument({
                id,
                title,
                content: draftText,
                userId: session.user.id,
              });
            }
  
            return {
              id,
              title,
              content: 'A document was created and is now visible to the user.',
            };
          },
        },
        updateDocument: {
          description: 'Update a document with the given description',
          parameters: z.object({
            id: z.string().describe('The ID of the document to update'),
            description: z
              .string()
              .describe('The description of changes that need to be made'),
          }),
          execute: async ({ id, description }) => {
            const document = await getDocumentById({ id });
  
            if (!document) {
              return {
                error: 'Document not found',
              };
            }
  
            const { content: currentContent } = document;
            let draftText = '';
  
            streamingData.append({
              type: 'clear',
              content: document.title,
            });
  
            const { fullStream } = await streamText({
              model: customModel(model.apiIdentifier),
              system:
                'You are a helpful writing assistant. Based on the description, please update the piece of writing.',
              /*experimental_providerMetadata: {
                openai: {
                  prediction: {
                    type: 'content',
                    content: currentContent,
                  },
                },
              },*/
              messages: [
                {
                  role: 'user',
                  content: description,
                },
                { role: 'user', content: currentContent },
              ],
            });
  
            for await (const delta of fullStream) {
              const { type } = delta;
  
              if (type === 'text-delta') {
                const { textDelta } = delta;
  
                draftText += textDelta;
                streamingData.append({
                  type: 'text-delta',
                  content: textDelta,
                });
              }
            }
  
            streamingData.append({ type: 'finish', content: '' });
  
            if (session.user?.id) {
              await saveDocument({
                id,
                title: document.title,
                content: draftText,
                userId: session.user.id,
              });
            }
  
            return {
              id,
              title: document.title,
              content: 'The document has been updated successfully.',
            };
          },
        },
        requestSuggestions: {
          description: 'Request suggestions for a document',
          parameters: z.object({
            documentId: z
              .string()
              .describe('The ID of the document to request edits'),
          }),
          execute: async ({ documentId }) => {
            const document = await getDocumentById({ id: documentId });
  
            if (!document || !document.content) {
              return {
                error: 'Document not found',
              };
            }
  
            const suggestions: BaseSuggestion[] = [];
  
            const { elementStream } = await streamObject({
              model: customModel(model.apiIdentifier),
              system:
                'You are a help writing assistant. Given a piece of writing, please offer suggestions to improve the piece of writing and describe the change. It is very important for the edits to contain full sentences instead of just words. Max 5 suggestions.',
              prompt: document.content,
              output: 'array',
              schema: z.object({
                originalSentence: z.string().describe('The original sentence'),
                suggestedSentence: z.string().describe('The suggested sentence'),
                description: z
                  .string()
                  .describe('The description of the suggestion'),
              }),
            });
  
            for await (const element of elementStream) {
              const suggestion = {
                originalText: element.originalSentence,
                suggestedText: element.suggestedSentence,
                description: element.description,
                id: generateUUID(),
                documentId: documentId,
                isResolved: false,
              };
  
              streamingData.append({
                type: 'suggestion',
                content: suggestion,
              });
  
              suggestions.push(suggestion);
            }
  
            if (session.user?.id) {
              const userId = session.user.id;
  
              await saveSuggestions({
                suggestions: suggestions.map((suggestion) => ({
                  ...suggestion,
                  userId,
                  createdAt: new Date(),
                  documentCreatedAt: document.createdAt,
                })),
              });
            }
  
            return {
              id: documentId,
              title: document.title,
              message: 'Suggestions have been added to the document',
            };
          },
        },
      },
      onFinish: async ({ responseMessages }) => {
        if (session.user?.id) {
          try {
            const responseMessagesWithoutIncompleteToolCalls =
              sanitizeResponseMessages(responseMessages);
  
            await saveMessages({
              messages: responseMessagesWithoutIncompleteToolCalls.map(
                (message) => {
                  const messageId = generateUUID();
  
                  if (message.role === 'assistant') {
                    streamingData.appendMessageAnnotation({
                      messageIdFromServer: messageId,
                    });
                  }
  
                  return {
                    id: messageId,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  };
                },
              ),
            });
          } catch (error) {
            console.error('Failed to save chat');
          }
        }
  
        streamingData.close();
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'stream-text',
      },
    });
  
    return result.toDataStreamResponse({
    data: streamingData,
    });
  }
  
  interface ErrorWithMessage {
    message: string;
  }
  
  function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as Record<string, unknown>).message === 'string'
    );
  }
  
  function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) return maybeError;
  
    try {
      return new Error(JSON.stringify(maybeError));
    } catch {
      // fallback in case there's an error stringifying the maybeError
      // like with circular references for example
      return new Error(String(maybeError));
    }
  }
  
  function getErrorMessage(error: unknown) {
    return toErrorWithMessage(error).message;
  }
  
  export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
  
    if (!id) {
      return new Response('Not Found', { status: 404 });
    }
  
    const session = await auth();
  
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }
  
    try {
      await deleteChatAndAttachments(id, session.user.id || "");
      return new Response('Chat and associated attachments deleted', { status: 200 });
    } catch (error : unknown) {
      console.error('Error during deletion:', error);
      
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage === 'Chat not found or unauthorized') {
        return new Response(errorMessage, { status: 404 });
      }
      
      return new Response(
        `Failed to delete chat and attachments: ${errorMessage}`, 
        { status: 500 }
      );
    }
  }
  
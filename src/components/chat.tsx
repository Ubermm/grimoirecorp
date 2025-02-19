//@ts-nocheck
//chat.tsx
'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';
import { customModel } from '@/lib/ai';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { generateText } from 'ai';
import { systemPrompt } from '@/lib/ai/prompts';
import { generateUUID } from '@/lib/utils';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { SparklesIcon } from './icons';
import { Block, type UIBlock } from './block';
import { BlockStreamHandler } from './block-stream-handler';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { set } from 'mongoose';

export function Chat({
  id,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [attachmentPositions, setAttachmentPositions] = useState<Map<string, number>>(new Map());
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
  
  const fetchAttachmentsForMessages = async () => {
    setIsLoadingAttachments(true);
    try {
      const response = await fetch(`/api/attachments?chatId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attachments');
      }
      
      const fetchedAttachments: Array<Attachment & { messagePosition?: number }> = await response.json();
      
      const positionMap = new Map<string, number>();
      const attachmentsByPosition: Record<number, Attachment[]> = {};
      
      fetchedAttachments.forEach(attachment => {
        if (attachment.messagePosition !== undefined) {
          positionMap.set(attachment.url, attachment.messagePosition);
          if (!attachmentsByPosition[attachment.messagePosition]) {
            attachmentsByPosition[attachment.messagePosition] = [];
          }
          attachmentsByPosition[attachment.messagePosition].push(attachment);
        }
      });
      
      setAttachmentPositions(positionMap);
      return attachmentsByPosition;
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      return {};
    }finally{
      setIsLoadingAttachments(false);
    }
  };
  
  // Fetch attachments on mount
  useEffect(() => {
    setIsLoadingAttachments(true);
    const fetchInitialAttachments = async () => {
      const attachmentMap = await fetchAttachmentsForMessages();
      
      const updatedMessages = messages.map((message, index) => ({
        ...message,
        experimental_attachments: attachmentMap[index] || []
      }));

      setMessages(updatedMessages);
    };

    if (id && initialMessages.length > 0) {
      fetchInitialAttachments();
      setIsLoadingAttachments(false);
    } else {
      // For new chats with no messages, immediately set loading to false
      setIsLoadingAttachments(false);
    }
  }, []);

  // Fetch attachments on mount
  useEffect(() => {
    setIsLoadingAttachments(true);
    const fetchInitialAttachments = async () => {
      const attachmentMap = await fetchAttachmentsForMessages();
      
      const updatedMessages = messages.map((message, index) => ({
        ...message,
        experimental_attachments: attachmentMap[index] || []
      }));

      setMessages(updatedMessages);
    };

    if (id && initialMessages.length > 0) {
      fetchInitialAttachments();
      setIsLoadingAttachments(false);
    } else {
      // For new chats with no messages, immediately set loading to false
      setIsLoadingAttachments(false);
    }
  }, [id]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    data: streamingData,
  } = useChat({
    id,
    body: { id, modelId: selectedModelId },
    initialMessages,
    onFinish: () => {
      mutate('/api/history');
    },
  });
  
  /*useEffect(() => {
    
    if (initialMessages.length === 0 ) {
      (async () => {
        try {
          setIsLoadingAttachments(true);
          const Cresponse = await fetch(`/api/context?id=${encodeURIComponent(id)}`);
          if (!Cresponse.ok) {
            const errorText = await Cresponse.text();
            throw new Error(`Failed to get context: ${errorText}`);
          }
          const contextObj = await Cresponse.json();
          const context:string =  "\nBasic QA:\n" + contextObj.qaContext + "Adjacent violations report:\n"+ contextObj.report;
          const prologResponse = await fetch(`/api/retrieve?id=${id}`);
          const modulesObj = await prologResponse.json();
          const modules = modulesObj.modules;
          const PrologMod: string = modules.join('\n');
          if (!prologResponse.ok) {
            const errorText = await prologResponse.text();
            throw new Error(`Failed to get context: ${errorText}`);
          }
          
          const combinedPrompt = `${systemPrompt} Current Prolog Modules we will use for validation: ${PrologMod}\n Generate the required questions Here's the firm's context: ${context}`;

          const genResponse = await fetch(`/api/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: combinedPrompt,
            }),
          });

          const { text } = await genResponse.json();

          const newMessage: Message = {
            role: "assistant",
            content: text,
            id: generateUUID(),
          };
          const initResponse = await fetch('/api/saveinit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                role: "assistant",
                content: text,
                chatId: id,
                id: generateUUID(),
                createdAt: new Date(),
              },
            }),
          });
          
          if (!initResponse.ok) {
            const errorText = await initResponse.text();
          }
          await setMessages((prevMessages) => [...prevMessages, newMessage]);
        } catch (error) {
          console.error('Error in IIFE:', error);
        } finally {
          setIsLoadingAttachments(false);
        }
      })();
    }
  }, []);*/
  
  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize();

  const [block, setBlock] = useState<UIBlock>({
    documentId: 'init',
    content: '',
    title: '',
    status: 'idle',
    isVisible: false,
    boundingBox: {
      top: windowHeight / 4,
      left: windowWidth / 4,
      width: 250,
      height: 50,
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />

        {isLoadingAttachments? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center justify-center space-y-2">
              <SparklesIcon />
              <p className="text-muted-foreground">Loading attachments...</p>
            </div>
          </div>
        ) : (
          <Messages
            chatId={id}
            block={block}
            setBlock={setBlock}
            isLoading={isLoading}
            votes={votes}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            isReadonly={isReadonly}
          />
        )}

        <form className="sticky bottom-0 flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              attachmentPositions={attachmentPositions}
              setAttachmentPositions={setAttachmentPositions}
              messages={messages}
              setMessages={setMessages}
              append={append}
              initialMessages={initialMessages}
            />
          )}
        </form>
      </div>

      <AnimatePresence>
        {block?.isVisible && (
          <Block
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            attachments={attachments}
            setAttachments={setAttachments}
            append={append}
            block={block}
            setBlock={setBlock}
            messages={messages}
            setMessages={setMessages}
            reload={reload}
            votes={votes}
            isReadonly={isReadonly}
          />
        )}
      </AnimatePresence>

      <BlockStreamHandler streamingData={streamingData} setBlock={setBlock} />
    </>
  );
}
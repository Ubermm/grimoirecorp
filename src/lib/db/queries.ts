//@ts-nocheck
import 'server-only';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import mongoose, { Schema, model, Types} from 'mongoose';
import { BlobServiceClient } from '@azure/storage-blob';
import { CUser, CContext, CChat, CDocument, CMessage, CVote, CSuggestion, CAttachment, CModule, CWarningLetter } from './models';
import { Suggestion } from './schema';
import { ObjectId } from 'mongodb';
import {v4 as uuidv4} from 'uuid';
import dbConnect from './connection';
// MongoDB Connection
await dbConnect();
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const CONTAINER_NAME = 'chat-attachments';

export interface SearchQuery {
  queryText: string;
  limit?: number;
  id?: string;
}

export interface SearchResult {
  customId: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  matches: SearchResult[];
  totalFound: number;
}

const NUM_LETTERS = 482;

// User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Chat Schema
const ChatSchema = new Schema({
  _id: { type: String, required: true },
  userId: { type: String, required: true },
  title: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  visibility: { 
    type: String, 
    enum: ['private', 'public'], 
    default: 'private' 
  }
});

// Message Schema
const MessageSchema = new Schema({
  chatId: { type: String, required: true },
  content: { type: String, required: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Vote Schema
const VoteSchema = new Schema({
  chatId: { type: String, required: true },
  messageId: { type: String, required: true },
  isUpvoted: { type: Boolean, required: true }
});

// Document Schema
const DocumentSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Suggestion Schema
const SuggestionSchema = new Schema({
  documentId: { type: String, required: true },
  documentCreatedAt: { type: Date, required: true },
  suggestion: { type: String, required: true }
});

export async function getMessageById({ id }: { id: string }) {
  try {
    return await CMessage.find({ _id: id });
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await CMessage.deleteMany({
      chatId: chatId,
      createdAt: { $gte: timestamp }
    });
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function getModulesByChatId(chatId: string): Promise<string[]> {
  try {
    const result = await CModule.findOne({ chatId });
    return result?.modules || [];
  } catch (error) {
    console.error('Failed to get modules:', error);
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    // You might need to add a 'visibility' field to your ChatSchema first
    return await CChat.updateOne(
      { _id: chatId }, 
      { $set: { visibility } }
    );
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function uploadAttachment(file: File, messageId: string, userId: string) {
  try {
    // Create BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    
    // Generate a unique blob name
    const blobName = `${userId}/${messageId}/${uuidv4()}-${file.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file to Azure Blob Storage
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { 
        blobContentType: file.type 
      }
    });

    // Get blob URL
    const attachmentUrl = blockBlobClient.url;

    // Create attachment in database
    const attachment = await CAttachment.create({
      id: uuidv4(),
      messageId,
      name: file.name,
      url: attachmentUrl,
      contentType: file.type,
      size: file.size,
      userId
    });

    return attachment;
  } catch (error) {
    console.error('Failed to upload attachment:', error);
    throw error;
  }
}

export async function getMessageAttachments({ messageId }: { messageId: string }) {
  try {
    return await CAttachment.find({ messageId });
  } catch (error) {
    console.error('Failed to get message attachments:', error);
    throw error;
  }
}

export async function getAttachmentsByMessageIds({ messageIds }: { messageIds: string[] }) {
  try {
    return await CAttachment.find({ 
      messageId: { $in: messageIds } 
    });
  } catch (error) {
    console.error('Failed to get attachments by message IDs:', error);
    throw error;
  }
}

export async function deleteAttachmentsByMessageId({ messageId }: { messageId: string }) {
  try {
    return await CAttachment.deleteMany({ messageId });
  } catch (error) {
    console.error('Failed to delete attachments by message ID:', error);
    throw error;
  }
}

export async function getUser(email: string) {
  try {
    return await CUser.find({ email });
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function getContext(id:string) {
  const contextObj = await CContext.findOne({chatId: id});
  const context:string = "Warning Letter:\n"+ contextObj.context.warningLetter + "\nFollow-up QA:\n" + contextObj.context.qaContext + "\nAdjacent violations report:\n"+ contextObj.context.report;
  return context;
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await CUser.create({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await CChat.create({
      _id: id,
      userId,
      title,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error(`Failed to save chat in database: ${error}`);
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await CVote.deleteMany({ chatId: id });
    await CMessage.deleteMany({ chatId: id });
    return await CChat.findOneAndDelete({_id: id});
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await CChat.find({ userId: id }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await CChat.findById(id);
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<any> }) {
  try {
    return await CMessage.insertMany(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await CMessage.find({ chatId: id }).sort({ createdAt: 1 });
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const existingVote = await CVote.findOne({ messageId });

    if (existingVote) {
      return await CVote.updateOne(
        { messageId, chatId },
        { isUpvoted: type === 'up' }
      );
    }
    return await CVote.create({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await CVote.find({ chatId: id });
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  try {
    const doc = await CDocument.find({_id:id});
    if(doc){
      await CDocument.deleteOne({_id:id});
    }
    return await CDocument.create({
      _id: id,
      title,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database', error);
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await CDocument.find({ _id: id }).sort({ createdAt: 1 });
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    return await CDocument.findById(id);
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await CSuggestion.deleteMany({
      documentId: id,
      documentCreatedAt: { $gt: timestamp }
    });

    return await CDocument.deleteMany({
      _id: id,
      createdAt: { $gt: timestamp }
    });
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<any>;
}) {
  try {
    return await CSuggestion.insertMany(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<Suggestion[]> {
  try {
    return await CSuggestion.find({ documentId });
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export default mongoose;
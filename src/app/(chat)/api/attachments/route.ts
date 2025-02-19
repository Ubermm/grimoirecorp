//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import { CAttachment } from '@/lib/db/models';

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { url, name, contentType, chatId, messagePosition } = await request.json();
    
    // Check if an attachment with same details already exists
    const existingAttachment = await CAttachment.findOne({ 
      chatId: chatId, 
      messageId: messagePosition, 
      url: url 
    });

    if (existingAttachment) {
      return Response.json(existingAttachment, { status: 200 });
    }

    // Create a new attachment only if it doesn't exist
    const newAttachment = new CAttachment({
      chatId: chatId,
      messagePosition: messagePosition,
      url: url,
      name: name,
      contentType: contentType,
      userId: session.user.id
    });

    await newAttachment.save();
    console.log('New Attachment Created:', newAttachment);
    // Convert Mongoose document to plain object and include _id as id
    const attachmentResponse = {
      ...newAttachment.toObject(),
      id: newAttachment._id.toString()
    };

    return Response.json(attachmentResponse, { status: 201 });
  } catch (error) {
    console.error('Attachment save error:', error);
    return new Response('Failed to save attachment', { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');
  const session = await auth();
  
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!chatId) {
    return new Response('Missing chatId', { status: 400 });
  }

  try {
    const attachments = await CAttachment.find({ 
      chatId
    });
    console.log('Fetched Attachments:', attachments);
    // Map attachments to match frontend expectations.
    const formattedAttachments = attachments.map(attachment => ({
      url: attachment.url,
      name: attachment.name,
      contentType: attachment.contentType,
      messagePosition: attachment.messagePosition
    }));
    console.log('Formatted Attachments:', formattedAttachments);
    return Response.json(formattedAttachments, { status: 200 });
  } catch (error) {
    console.error('Fetching attachments error: ', error);
    return new Response('Failed to fetch attachments', { status: 500 });
  }
}

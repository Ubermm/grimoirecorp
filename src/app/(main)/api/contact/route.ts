//@ts-nocheck
// app/api/contact/route.ts
import { auth } from '@/app/(auth)/auth';
import { CContact } from '@/lib/db/models';
import { NextResponse } from 'next/server';
import { EmailClient } from "@azure/communication-email";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create contact in database
    const contact = await CContact.create({
      name,
      email,
      subject,
      message: message || '',
    });

    // Send notification emails
    try {
      const emailClient = new EmailClient(process.env.AZURE_EMAIL_CONNECTION_STRING);

      const emailContent = {
        subject: `New Contact Form Submission: ${subject}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <p>${message || 'No message provided'}</p>
        `,
      };

      // Send to both email addresses
      const recipients = ['halagalisupreet@gmail.com', 'support@grimoire.tools'];
      
      await Promise.all(
        recipients.map(recipient => 
          emailClient.beginSend({
            senderAddress: 'DoNotReply@grimoire.tools',
            content: emailContent,
            recipients: {
              to: [{ address: recipient }],
            },
          })
        )
      );
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send notification emails:', emailError);
    }

    return NextResponse.json({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      createdAt: contact.createdAt,
    });
  } catch (error) {
    console.error('Contact creation error:', error);
    return NextResponse.json({ error: 'Failed to save contact' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contacts = await CContact.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    const formattedContacts = contacts.map(contact => ({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      createdAt: contact.createdAt,
    }));

    return NextResponse.json(formattedContacts);
  } catch (error) {
    console.error('Contact fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
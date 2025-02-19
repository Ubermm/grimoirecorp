//@ts-nocheck
'use server';

import { z } from 'zod';
import { createUser, getUser } from '@/lib/db/queries';
import { signIn } from './auth';
import { EmailClient } from '@azure/communication-email';
import fs from 'fs';
import path from 'path';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  callbackUrl: z.string().default('/audit'),
});

export interface AuthActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data' | 'user_exists';
  error?: string;
  redirectTo?: string;
}

const initialState: AuthActionState = {
  status: 'idle',
  error: undefined,
  redirectTo: undefined,
};

async function sendRegisterEmail(userEmail: string) {
  try {
    const emailClient = new EmailClient(process.env.AZURE_EMAIL_CONNECTION_STRING);

    const emailContent = {
      subject: 'Welcome to Grimoire - Account Created Successfully',
      html: `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Grimoire</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
        }
        .content {
            padding: 0 20px;
            color: #333333;
        }
        h1 {
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #000000;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 500;
            margin: 20px 0;
            text-align: center;
        }
        .button:hover {
            background-color: #ffffff;
            color: #000000 !important;
            border: 1px solid #000000;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            text-align: center;
            color: #666666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <h1>Welcome to Grimoire!</h1>
            
            <p>Your account has been successfully created. We're excited to have you join our community!</p>
            
            <p>You can now access all the features and tools available on our platform.</p>
            
            <p>Click the button below to access your dashboard:</p>
            
            <div style="text-align: center;">
                <a href="https://grimoire.tools/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p>If you have any questions or need assistance, don't hesitate to contact our support team: <a href="mailto:support@grimoire.tools" style="color: #4A90E2;">support@grimoire.tools</a></p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Grimoire.Corp. All rights reserved.</p>
            <p style="color: #999999; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
      `,
    };
    const poller = await emailClient.beginSend({
      senderAddress: 'DoNotReply@grimoire.tools',
      content: emailContent,
      recipients: {
        to: [{ address: userEmail }],
      }
    });
    const result = await poller.pollUntilDone();

    console.log('Welcome email sent successfully');
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export const login = async (
  state: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> => {
  try {
    const rawCallbackUrl = formData.get('callbackUrl');
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      callbackUrl: rawCallbackUrl || '/audit',
    });

    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
      callbackUrl: validatedData.callbackUrl,
    });

    if (!result) {
      return { 
        status: 'failed',
        error: 'Authentication failed'
      };
    }

    if (result.error) {
      return { 
        status: 'failed',
        error: result.error
      };
    }

    const safeRedirectUrl = validatedData.callbackUrl.startsWith('/') 
      ? validatedData.callbackUrl 
      : '/';

    return {
      status: 'success',
      redirectTo: safeRedirectUrl
    };

  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return { 
        status: 'invalid_data',
        error: 'Invalid email or password format'
      };
    }
    
    return { 
      status: 'failed',
      error: 'An unexpected error occurred'
    };
  }
};

export const register = async (
  state: AuthActionState = initialState,
  formData: FormData,
): Promise<AuthActionState> => {
  try {
    const rawCallbackUrl = formData.get('callbackUrl');
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      callbackUrl: rawCallbackUrl || '/',
    });

    // Check if user exists
    const [existingUser] = await getUser(validatedData.email);
    if (existingUser) {
      return { 
        status: 'user_exists',
        error: 'An account with this email already exists'
      };
    }
    await sendRegisterEmail(validatedData.email);
    // Create new user
    await createUser(validatedData.email, validatedData.password);
    // Sign in the newly created user
    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
      callbackUrl: "/",
    });

    if (!result) {
      return { 
        status: 'failed',
        error: 'Failed to sign in after registration'
      };
    }

    const safeRedirectUrl = validatedData.callbackUrl.startsWith('/') 
      ? validatedData.callbackUrl 
      : '/';

    return {
      status: 'success',
      redirectTo: safeRedirectUrl
    };

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        status: 'invalid_data',
        error: 'Invalid email or password format'
      };
    }
    
    return { 
      status: 'failed',
      error: 'Failed to create account'
    };
  }
};
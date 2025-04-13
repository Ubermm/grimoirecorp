//@ts-nocheck
import { User } from '@/lib/db/models'; // Assuming you have a User model
import { EmailClient } from "@azure/communication-email";

export class SendEmailService {
  private emailClient;

  constructor() {
    this.emailClient = new EmailClient(process.env.AZURE_EMAIL_CONNECTION_STRING);
  }

  async sendPredictionComplete(userId: string, predictionId: string, predictionName: string): Promise<void> {
    try {
      // Get user email from User model
      const user = await User.findById(userId);
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Create download URL
      const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/models/alphafold3?download=${predictionId}`;

      // Email content
      const emailContent = {
        subject: 'Your AlphaFold 3 Prediction is Complete',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Prediction is Ready</h2>
            <p>Good news! Your AlphaFold 3 prediction "${predictionName}" has completed successfully.</p>
            <p>You can download your results by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${downloadUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Download Results
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">${downloadUrl}</p>
            <p>Thank you for using our platform!</p>
          </div>
        `,
      };

      // Send email using Azure Communication Services
      await this.emailClient.beginSend({
        senderAddress: 'DoNotReply@grimoire.tools',
        content: emailContent,
        recipients: {
          to: [{ address: user.email }],
        },
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}

//@ts-nocheck
import { generateText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { DEFAULT_MODEL_NAME} from '@/lib/ai/models';
import { customModel } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Fix the request parsing
    const { text } = await request.json();
    
    const { text:summary } = await generateText({
      model: customModel(DEFAULT_MODEL_NAME),
      messages: [
        {
          role: 'user',
          content: `You are an expert FDA compliance analyst Your task is to:
                  1. Extract all CGMP violations and edge cases from FDA warning letters 
                  2. Provide a concise but exhaustive summary of:
                      - All specific reasons for rejection
                      - Key arguments presented in the letter
                      - Critical compliance issues identified
                  3. Directly output the summary, do not output anything else than the summary in your response.
                  Warning Letter: ${text}`
        }
      ]
    });
    
    return Response.json({summary}, { status: 200 });

  } catch (error) {
    console.error('Context search error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
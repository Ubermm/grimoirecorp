//@ts-nocheck
import { generateText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { customModel } from '@/lib/ai';
import { CReport } from '@/lib/db/models';

interface ProcessRequest {
  originalLetter: string;
  similarLetters: Array<{
    customId: string;
    content: string;
    summary: string;
    score: number;
  }>;
  context: string[];
  chatId: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { originalLetter, similarLetters, context, chatId }: ProcessRequest = await request.json();

    const comparisonPrompt = `You are an expert FDA compliance analyst. Your task is to:
1. Analyze the following FDA warning letters and their summaries
2. Identify violations found in the similar warning letters that are NOT mentioned in the original letter
3. Consider the company's context to determine which of these additional violations might be relevant
4. Generate a detailed report for compliance officers highlighting:
   - Potential adjacent violations to investigate
   - Why these violations are relevant based on the company's context
   - Specific areas to focus preventive measures
5. Format the report professionally but concisely

Main Firm Warning Letter:
${originalLetter}

Similar Warning Letters Summaries for reference and prediction:
${similarLetters.map(letter => `
Letter ${letter.customId}:
${letter.summary}
Score: ${letter.score}
`).join('\n')}

Company Context:
${context.join('\n')}
Try to predict the most likely violations that the company might have committed based on the similar letters and the company's context.
Generate a professional report focusing ONLY on identifying and explaining relevant adjacent violations not mentioned in the original letter.
Generate your report as Markdown text.`;

    const { text:report } = await generateText({
      model: customModel(DEFAULT_MODEL_NAME),
      messages: [
        {
          role: 'user',
          content: comparisonPrompt
        }
      ]
    });

    // Save report to database
    const reportDoc = new CReport({
      chatId,
      report
    });
    await reportDoc.save();

    return Response.json({ report, id: reportDoc._id }, { status: 200 });
    
  } catch (error) {
    console.error('Process error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get id from search params
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Missing report ID', { status: 400 });
    }

    // Fetch report from database
    const reportDoc = await CReport.findOne({chatId: id});

    if (!reportDoc) {
      return new Response('Report not found', { status: 404 });
    }

    return Response.json({ report: reportDoc.report }, { status: 200 });

  } catch (error) {
    console.error('Get report error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
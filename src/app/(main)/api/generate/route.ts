//@ts-nocheck
import { generateText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { customModel } from '@/lib/ai';
import { BlobServiceClient } from '@azure/storage-blob';

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
    
    return regulations
      .split('\n')
      .filter(line => line.trim())
      .reduce((acc, line) => {
        const parsed = JSON.parse(line);
        const [key, value] = Object.entries(parsed)[0];
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error loading regulations:', error);
    throw error;
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    readableStream.on('error', reject);
  });
}

async function generateValidationQuestions(regulationText: string, cfrSubsection: string, warningLetter: string) {
  const { text } = await generateText({
    model: customModel(DEFAULT_MODEL_NAME),
    messages: [
      {
        role: 'user',
        content: `Generate validation questions for CFR 21 subsection for the regulatory compliance officer to answer
                  trying to assess the compliance of a firm: CFR SubSection ${cfrSubsection}: ${regulationText}.
                  Background to be extracted from this warning letter received by the firm: ${warningLetter}
                  
                 Focus on:
                 1. Quantifiable compliance criteria
                 2. Required documentation
                 3. Specific thresholds
                 4. Procedural requirements

                 Your audience is a representative compliance consutlant for a firm
                 
                 Format:
                 ###QUESTION###
                 [question1]
                 ###/QUESTION###
                 ###QUESTION###
                 [question2]
                 ###/QUESTION###`
      }
    ]
  });

  const questions = text.match(/###QUESTION###\n(.*?)\n###\/QUESTION###/gs)?.map(match => {
    const question = match
      .replace('###QUESTION###\n', '')
      .replace('\n###/QUESTION###', '')
      .trim();
    return question;
  }) || [];
  
  return questions;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const { cfrSubsection, warningLetter } = await request.json();
    const regulations = await loadRegulationsFromBlob();
    const regulationText = regulations[cfrSubsection];
    
    if (!regulationText) {
      console.log(cfrSubsection);
      return new Response('Regulation not found', { status: 404 });
    }

    const questions = await generateValidationQuestions(regulationText, cfrSubsection, warningLetter);
    
    return Response.json({ questions }, { status: 200 });
  } catch (error) {
    console.error('Context search error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
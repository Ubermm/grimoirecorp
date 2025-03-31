//@ts-nocheck
import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { BlobServiceClient } from '@azure/storage-blob';
import { executePrologQueries, test } from '@/lib/ai/inference';

// Helper function to convert string responses to Prolog-compatible values
function convertToPrologValue(value: string, type: string): string {
  switch (type) {
    case 'BOOLEAN':
      return value.toLowerCase() === 'true' ? 'true' : 'false';
    case 'NUMERIC':
      return value;
    case 'SELECT':
    case 'TEXT':
      return `'${value.replace(/'/g, "\\'")}'`;
    case 'CHECKBOX':
      return `[${value.split(',').map(v => `'${v.trim().replace(/'/g, "\\'")}'`).join(', ')}]`;
    default:
      return `'${value.replace(/'/g, "\\'")}'`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { code, responses, form } = await request.json();
    console.log(form, responses);
    if (!code || !responses || !form) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Load regulations for context
    /*const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME!
    );
    const regulationsBlob = containerClient.getBlobClient('regulations.jsonl');
    
    const downloadResponse = await regulationsBlob.download();
    const regulationsContent = await streamToString(downloadResponse.readableStreamBody!);
    const regulations = regulationsContent
      .split('\n')
      .filter(line => line.trim())
      .reduce((acc, line) => {
        const parsed = JSON.parse(line);
        const [key, value] = Object.entries(parsed)[0];
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);*/
    
    // Generate Prolog program
    let prologProgram = ':- use_module(library(lists)).\n:- use_module(library(format)).\n';

    // Add facts based on responses
    form.facts.forEach(fact => {
      const question = form.questions.find(q => q.id === fact.question_id);
      if (!question || !responses[fact.question_id]) return;
    
      // Skip if response is "Does not apply"
      if (responses[fact.question_id] === "Does not apply") return;
    
      let factTemplate = fact.template.replaceAll("REPLACE_FOR_BACKSLASH", "\\").replaceAll("\"", "\'");
    
      // Replace `{i}` placeholders properly
      factTemplate = factTemplate.replace(/\{(\d+)\}/g, (_, match) => {
        const qIndex = parseInt(match, 10) - 1;
        if (qIndex >= 0 && qIndex < form.questions.length) {
          const q = form.questions[qIndex];
          if (responses[q.id]) {
            return convertToPrologValue(responses[q.id], q.type);
          }
        }
        return `{${match}}`; // Leave as-is if not found
      });
    
      prologProgram += factTemplate + '\n';
    });
    

    // Add validation rules
    form.validations.forEach(validation => {
      prologProgram += validation.rule.replaceAll("REPLACE_FOR_BACKSLASH","\\").replaceAll("\"", "\'") + '\n';
    });

    // Initialize validation response arrays with the correct size
    const validationResponse = {
      passed: new Array(form.queries.length).fill(false),
      description: new Array(form.queries.length).fill('')
    };

    // Process each query and prepare for execution
    const queriesToExecute: { text: string; index: number }[] = [];
    
    form.queries.forEach((queryDef, index) => {
      // Find all question IDs referenced in the query
      const questionMatches = queryDef.query.match(/\{(\d+)\}/g) || [];
      const questionIds = questionMatches.map(match => 
        `q${match.replace(/[{}]/g, '')}`
      );
      
      // Store description at the correct index
      validationResponse.description[index] = queryDef.description;

      // Check if any referenced question has "Does not apply" as response
      const hasDoesNotApply = questionIds.some(qId => responses[qId] === "Does not apply");
      
      if (hasDoesNotApply) {
        // Mark as passed if it contains "Does not apply"
        validationResponse.passed[index] = true;
      } else {
        // Prepare query for execution
        let queryText = queryDef.query
          .replaceAll("REPLACE_FOR_BACKSLASH", "\\")
          .replaceAll("\"", "\'")
          .replace("?-", "")
          .trim();

        queryText = queryText.replace(/\{(\d+)\}/g, (_, match) => {
          const qIndex = parseInt(match, 10) - 1;
          if (qIndex >= 0 && qIndex < form.questions.length) {
            const question = form.questions[qIndex];
            if (responses[question.id]) {
              return convertToPrologValue(responses[question.id], question.type);
            }
          }
          return `{${match}}`;
        });

        queriesToExecute.push({
          text: queryText,
          index: index
        });
      }
    });

    // Execute queries that need to be processed
    if (queriesToExecute.length > 0) {
      const queryResults = await executePrologQueries(
        prologProgram, 
        queriesToExecute.map(q => q.text)
      );

      // Process results and store at correct indices
      queryResults.forEach((result, execIndex) => {
        const originalIndex = queriesToExecute[execIndex].index;
        const queryPassed = result.answers.length > 0 && (result.answers[0] === 'true.' || result.answers[0] === 'true');
        validationResponse.passed[originalIndex] = queryPassed;
      });
    }
    console.log(validationResponse);
    return Response.json(validationResponse);
  } catch (error) {
    console.error('Error in POST /api/validate:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Helper function to convert stream to string
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
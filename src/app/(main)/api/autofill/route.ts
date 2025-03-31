//@ts-nocheck
import { generateText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { customModel } from '@/lib/ai';

const SYSTEM_MESSAGE = `You are a form autofill assistant. Your task is to analyze the provided input (text and/or file content) and extract relevant information to fill out form fields.

Required Response Format:
{
  "fieldId1": "extracted_value1",
  "fieldId2": "extracted_value2",
  ...
}

Instructions:
1. Only return valid JSON in the format above
2. If you cannot determine a value for a field, use an empty string ""
3. Ensure the returned values match the expected type for each field
4. Do not include explanations or additional text outside the JSON
5. Make sure values are appropriate for the field types (e.g., dates in ISO format, numbers as strings)`;

interface FormField {
  id: string;
  type: string;
  question: string;
}

interface AutofillRequest {
  message: {
    content: string;
    experimental_attachments?: Array<{
      url: string;
      name: string;
      contentType: string;
    }>;
  };
  fields: FormField[];
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const { message, fields }: AutofillRequest = await request.json();

    // Create field type information for the model
    // In the autofill API route, update the field info:
    const fieldInfo = fields.map(field =>
      `${field.id} ${field.question} (Type: ${field.type}, Current Value: ${field.currentValue})`
    ).join('\n');

    const { text } = await generateText({
      model: customModel(DEFAULT_MODEL_NAME),
      messages: [
        {
          role: 'system',
          content: SYSTEM_MESSAGE + "Here are the provided fields that need an answer to be deduced if possible from the user's message:\t"+ fieldInfo
        },
        message
      ]
    });

    // Extract JSON from the response
    try {
      // Find JSON object in the response - looking for content between curly braces
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const extractedValues = JSON.parse(jsonMatch[0]);

      // Validate that all fields have values (even if empty strings)
      const validatedValues = fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: extractedValues[field.id] || ""
      }), {});

      return Response.json(validatedValues, { status: 200 });
    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // Return empty strings for all fields if parsing fails
      const emptyValues = fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: ""
      }), {});
      return Response.json(emptyValues, { status: 200 });
    }
  } catch (error) {
    console.error('Autofill error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
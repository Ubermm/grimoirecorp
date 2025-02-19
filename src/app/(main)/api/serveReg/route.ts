//@ts-nocheck
import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to parse JSONL content into a Record
async function parseJSONLToRecord(content: string): Promise<Record<string, string>> {
  return content
    .split('\n')
    .filter(line => line.trim())
    .reduce((acc, line) => {
      const parsed = JSON.parse(line);
      const [key, value] = Object.entries(parsed)[0];
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
}

// Helper function to get file content
async function getFileContent(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), 'src', 'data', fileName);
  return await fs.readFile(filePath, 'utf8');
}

// Route to get regulations.jsonl
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const content = await getFileContent('regulations.jsonl');
    const regulations = await parseJSONLToRecord(content);

    return Response.json(regulations);
  } catch (error) {
    console.error('Error fetching regulations:', error);
    if (error.code === 'ENOENT') {
      return new Response('File not found', { status: 404 });
    }
    return new Response('Internal Server Error', { status: 500 });
  }
}
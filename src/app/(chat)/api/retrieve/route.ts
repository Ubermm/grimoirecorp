//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import { CModule, CWarningLetter } from '@/lib/db/models';
import { Module } from '@/lib/db/schema';
import { EmbeddingGenerator } from '@/lib/ai/embeddings';

export interface SearchQuery {
    queryText: string;
    limit?: number;
    id?: string;
}
  
export interface SearchResult {
    customId: string;
    summary: string;
    score: number;
}
  
export interface SearchResponse {
    matches: SearchResult[];
    totalFound: number;
}

const NUM_LETTERS = 482; 

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { queryText, limit = 10, id }: SearchQuery = await request.json();

    if (!queryText) {
      return new Response('Missing query text', { status: 400 });
    }

    const embeddingGen = new EmbeddingGenerator();
    const queryEmbedding = (await embeddingGen.getEmbeddings(queryText))[0];

    // Perform vector search using MongoDB Atlas Vector Search
    const results = await CWarningLetter.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: NUM_LETTERS,
          limit: limit
        }
      },
      {
        $project: {
          customId: 1,
          content: 1,
          summary: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]);

    // Store the modules if id is provided
    if(id){
      const modules = results.map(result => result.content);
      const doc = new CModule({ chatId: id, modules });
      await doc.save();
    }

    // Return only summaries in the response
    const response: SearchResponse = {
      matches: results.map(result => ({
        customId: result.customId,
        summary: result.summary,
        score: result.score
      })),
      totalFound: results.length
    };
    console.log(`matches summaries: ${response.matches.map(match => match.summary).join('\n')}\n`);
    return Response.json(response, { status: 200 });
  } catch (error) {
    console.error('Search error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('id');

    if (!chatId) {
      return new Response('Missing chat ID', { status: 400 });
    }

    // Fetch modules for the given chatId
    const result = await CModule.findOne({ chatId });

    if (!result) {
      return Response.json({ modules: [] }, { status: 200 });
    }

    return Response.json({ modules: result.modules }, { status: 200 });
  } catch (error) {
    console.error('Module retrieval error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
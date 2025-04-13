//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookService } from '@/services/notebookService';

const notebookService = new NotebookService();

// GET /api/notebook-runs
// Used by the NotebookRunsClient to fetch and poll runs
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    
    const runs = await notebookService.getUserRuns(session.user.id, filter);
    
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching notebook runs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
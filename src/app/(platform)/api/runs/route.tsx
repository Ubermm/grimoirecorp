//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookService } from '@/services/notebookService';

const notebookService = new NotebookService();

// GET /api/runs
// Retrieve all runs for the authenticated user or for a specific organization
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    const filter = searchParams.get('filter') || 'all';
    
    let runs;
    
    if (organizationId) {
      // Fetch organization runs
      runs = await notebookService.getOrganizationRuns(organizationId, session.user.id, filter);
    } else {
      // Fetch user's personal runs
      runs = await notebookService.getUserRuns(session.user.id, filter);
    }
    
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
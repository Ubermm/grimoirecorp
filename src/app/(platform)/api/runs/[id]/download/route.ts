//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookRun } from '@/lib/db/models';
import { NotebookService } from '@/services/notebookService';
import { BlobStorageService } from '@/services/blobStorage';

const notebookService = new NotebookService();
const blobStorage = new BlobStorageService();

// GET /api/runs/[id]/download
// Generate download links for run outputs
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the run
    const run = await NotebookRun.findById(params.id).lean();
    
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }
    
    // Check if user has access to this run
    if (run.userId !== session.user.id) {
      // If it's an organization run, check if user is a member
      if (run.organizationId) {
        // Check organization membership
        try {
          await notebookService.getOrganizationRuns(run.organizationId, session.user.id);
        } catch (error) {
          return NextResponse.json({ error: 'Not authorized to access this run' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Not authorized to access this run' }, { status: 403 });
      }
    }
    
    // Check if the run is completed
    if (run.status !== 'completed') {
      return NextResponse.json({ error: 'Run has not completed yet' }, { status: 400 });
    }
    
    // Get the download type from the query parameters
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    
    // Initialize response object
    const downloadLinks: Record<string, string> = {};
    
    // For custom notebooks
    if (run.podType === 'custom' || !run.podType) {
      // Get notebook download link if available
      if (run.executedNotebookUrl && (type === 'all' || type === 'notebook')) {
        downloadLinks.notebook = run.executedNotebookUrl;
      }
      
      // Get output container link if available
      if (run.outputContainerUrl && (type === 'all' || type === 'outputs')) {
        downloadLinks.outputs = run.outputContainerUrl;
      }
    } 
    // For AlphaFold3 or other models
    else if (run.podType === 'alphafold3') {
      // Get result URL if available
      if (run.result && (type === 'all' || type === 'result')) {
        downloadLinks.result = run.result;
      }
    }
    
    // If no download links are available
    if (Object.keys(downloadLinks).length === 0) {
      return NextResponse.json({ error: 'No downloadable results available' }, { status: 404 });
    }
    
    // Return download links
    return NextResponse.json({ downloadLinks });
  } catch (error) {
    console.error('Error generating download links:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
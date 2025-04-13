//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookRun } from '@/lib/db/models';
import { NotebookService } from '@/services/notebookService';
import { BlobStorageService } from '@/services/blobStorage';

const notebookService = new NotebookService();
const blobStorage = new BlobStorageService();

// GET /api/runs/[id]
// Retrieve a specific run or download resources from a run
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const Params = await Params;
    // Find the run
    const run = await NotebookRun.findById(Params.id).lean();
    
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
    
    // Get the request type from query params
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    // If a download type is specified, handle the download
    if (type) {
      // Handle different download types
      if (type === 'notebook') {
        // Return the executed notebook URL
        if (!run.executedNotebookUrl) {
          return NextResponse.json({ error: 'Executed notebook not available' }, { status: 404 });
        }
        
        // Generate a SAS URL with a 1-hour expiry time
        return NextResponse.json({ url: run.executedNotebookUrl });
      } else if (type === 'output') {
        // Return the output container URL
        if (!run.outputContainerUrl) {
          return NextResponse.json({ error: 'Output files not available' }, { status: 404 });
        }
        
        // Return the SAS URL for the output container
        return NextResponse.json({ url: run.outputContainerUrl });
      } else if (type === 'result' && run.result) {
        // For AlphaFold3 and other model results
        return NextResponse.json({ url: run.result });
      } else {
        return NextResponse.json({ error: 'Invalid download type' }, { status: 400 });
      }
    }
    
    // Otherwise, return the run details
    return NextResponse.json(run);
  } catch (error) {
    console.error('Error fetching run:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}


// POST /api/runs/[id]
// Run a notebook
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const Params = await Params;

    const userId = session.user.id;
    const notebookId = params.id;
    
    // Extract optional GPU configuration from request body
    const body = await req.json().catch(() => ({}));
    const options: {
      gpuTypeId?: string;
      gpuCount?: number;
      volumeInGb?: number;
    } = {};
    
    // Validate and extract GPU configuration if provided
    if (body.gpuTypeId && typeof body.gpuTypeId === 'string') {
      options.gpuTypeId = body.gpuTypeId;
    }
    
    if (body.gpuCount && typeof body.gpuCount === 'number') {
      options.gpuCount = body.gpuCount;
    }
    
    if (body.volumeInGb && typeof body.volumeInGb === 'number') {
      options.volumeInGb = body.volumeInGb;
    }
    
    // Run the notebook using the notebook service
    try {
      const run = await notebookService.runNotebook(notebookId, userId);
      
      // Return the created run
      return NextResponse.json(run);
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('not found') || error.message.includes('does not have access')) {
          return NextResponse.json({ error: error.message }, { status: 404 });
        } else if (error.message.includes('does not have permission')) {
          return NextResponse.json({ error: error.message }, { status: 403 });
        } else if (error.message.includes('enough credits')) {
          return NextResponse.json({ error: error.message }, { status: 402 }); // Payment Required
        }
        
        // Generic server error
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error running notebook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
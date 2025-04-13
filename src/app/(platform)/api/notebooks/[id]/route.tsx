//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookService } from '@/services/notebookService';

const notebookService = new NotebookService();

// GET /api/notebooks/[id]
// Retrieve a specific notebook
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const Params = await params;
    const notebook = await notebookService.getNotebook(Params.id, session.user.id);
    
    if (!notebook) {
      return NextResponse.json({ error: 'Notebook not found or you do not have access' }, { status: 404 });
    }
    
    return NextResponse.json(notebook);
  } catch (error) {
    console.error('Error fetching notebook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/notebooks/[id]
// Update a specific notebook
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await req.json();
    
    // Only allow updating certain fields
    const allowedUpdates = ['name', 'content', 'isPublic'];
    const updates = Object.entries(data)
      .filter(([key]) => allowedUpdates.includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    // Update the notebook
    const notebook = await notebookService.updateNotebook(
      Params.id,
      updates,
      session.user.id
    );
    
    if (!notebook) {
      return NextResponse.json({ error: 'Notebook not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json(notebook);
  } catch (error) {
    console.error('Error updating notebook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const Params = await params;
    const options = await req.json().catch(() => ({})); // Handle optional run options gracefully
    const notebookRun = await notebookService.runNotebook(Params.id, session.user.id, options);

    if (!notebookRun) {
      return NextResponse.json({ error: 'Failed to run notebook' }, { status: 500 });
    }

    return NextResponse.json(notebookRun);
  } catch (error) {
    console.error('Error running notebook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/[id]
// Delete a specific notebook
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const Params = await params;
    const result = await notebookService.deleteNotebook(
      Params.id,
      session.user.id
    );
    
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Error deleting notebook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
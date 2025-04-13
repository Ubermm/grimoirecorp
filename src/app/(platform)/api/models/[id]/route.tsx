//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ModelService } from '@/services/modelService';

const modelService = new ModelService();

// GET /api/models/[id]
// Retrieve a specific model
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const model = await modelService.getModel(params.id);
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    
    return NextResponse.json(model);
  } catch (error) {
    console.error('Error fetching model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// PATCH /api/models/[id]
// Update a specific model (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real app, you'd check if the user is an admin
    // For now, we'll just allow this in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authorized to modify models' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Update the model
    const model = await modelService.updateModel(params.id, data);
    
    if (!model) {
      return NextResponse.json({ error: 'Model not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json(model);
  } catch (error) {
    console.error('Error updating model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// DELETE /api/models/[id]
// Delete a specific model (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real app, you'd check if the user is an admin
    // For now, we'll just allow this in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authorized to delete models' }, { status: 403 });
    }
    
    await modelService.deleteModel(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ModelService } from '@/services/modelService';

const modelService = new ModelService();

// Initialize models with sample data (only in development)
if (process.env.NODE_ENV === 'development') {
  modelService.seedModels().catch(console.error);
}

// GET /api/models
// Retrieve all available models
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    const models = await modelService.getModels(category);
    
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/models
// Create a new model (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real app, you'd check if the user is an admin
    // For now, we'll just allow this in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not authorized to add models' }, { status: 403 });
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.description || !data.category || !data.apiEndpoint) {
      return NextResponse.json({ 
        error: 'Required fields missing. Name, description, category, and apiEndpoint are required.' 
      }, { status: 400 });
    }
    
    const model = await modelService.addModel(data);
    
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error('Error creating model:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
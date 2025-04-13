//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { PredictionService } from '@/services/predictionService';

const predictionService = new PredictionService();

// GET /api/predictions
// Retrieve all predictions for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const predictions = await predictionService.getUserPredictions(session.user.id);
    
    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

// POST /api/predictions
// Create a new prediction
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      return NextResponse.json({ error: 'File must be JSON format' }, { status: 400 });
    }
    
    // Get file name
    const name = (formData.get('name') as string) || file.name.replace('.json', '');
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create the prediction
    const prediction = await predictionService.createPrediction(
      session.user.id,
      buffer,
      file.name,
      name
    );
    
    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

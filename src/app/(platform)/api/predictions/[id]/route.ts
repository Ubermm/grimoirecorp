//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { PredictionService } from '@/services/predictionService';

const predictionService = new PredictionService();

// GET /api/predictions/[id]
// Get a single prediction
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const prediction = await predictionService.getPrediction(params.id, session.user.id);
    
    if (!prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }
    
    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

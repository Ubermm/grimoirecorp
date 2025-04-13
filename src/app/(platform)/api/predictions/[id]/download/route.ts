//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { PredictionService } from '@/services/predictionService';

const predictionService = new PredictionService();

// GET /api/predictions/[id]/download
// Get a download URL for a prediction result
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const downloadUrl = await predictionService.getDownloadUrl(params.id, session.user.id);
    
    // Redirect to the signed URL for download
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('Error generating download URL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
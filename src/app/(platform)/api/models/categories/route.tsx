//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { ModelService } from '@/services/modelService';

const modelService = new ModelService();

// GET /api/models/categories
// Retrieve all model categories
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const categories = await modelService.getCategories();
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching model categories:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
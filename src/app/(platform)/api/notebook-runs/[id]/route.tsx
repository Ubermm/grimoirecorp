//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookRun } from '@/lib/db/models';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    console.log("Route handler triggered with params:", params);
    try {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const Params = await params;
      const notebook = await NotebookRun.find({notebookId:Params.id})
      .sort({ startedAt: -1 })
      .lean();
      
      return NextResponse.json(notebook);
    } catch (error) {
      console.error('Error fetching notebook:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
  
// app/api/runpod/pods/[podId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@/app/(auth)/auth';

// GET endpoint to check pod status
export async function GET(
  request: NextRequest,
  { params }: { params: { podId: string } }
) {
  const session = await auth();
  const Params = await params;
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const podId = Params.podID;
  
  if (!podId) {
    return new NextResponse(JSON.stringify({ error: 'Pod ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await axios.get(
      `https://rest.runpod.io/v1/pods/${podId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return new NextResponse(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    
    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE endpoint to abort a pod
export async function DELETE(
  request: NextRequest,
  { params }: { params: { podID: string } }
) {
  const session = await auth();
  const Params = await params;
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const podId = Params.podID;
  
  if (!podId) {
    return new NextResponse(JSON.stringify({ error: 'Pod ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await axios.delete(
      `https://rest.runpod.io/v1/pods/${podId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return new NextResponse(JSON.stringify({ message: 'Pod successfully deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
    
    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
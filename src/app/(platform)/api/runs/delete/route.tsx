//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { RunpodService } from '@/services/runpod';
import { NotebookRun } from '@/lib/db/models';
import { notebookLogger } from '@/lib/monitoring';
import axios from 'axios';

// Initialize RunpodService
const runpodService = new RunpodService();

/**
 * GET /api/pods/delete
 * Stops and deletes a pod associated with an inputContainerUrl
 * Required query parameter: inputContainerUrl
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get inputContainerUrl from query parameters
    const { searchParams } = new URL(req.url);
    const inputContainerUrl = searchParams.get('inputContainerUrl');

    if (!inputContainerUrl) {
      return NextResponse.json(
        { error: 'inputContainerUrl is required' }, 
        { status: 400 }
      );
    }

    // Find associated notebook run by inputContainerUrl
    const run = await NotebookRun.findOne({ 
      inputContainerUrl,
      userId: session.user.id 
    }).lean();

    if (!run) {
      return NextResponse.json(
        { error: 'No pod found for the provided inputContainerUrl or you do not have permission to delete it' }, 
        { status: 404 }
      );
    }

    // Check if the run has a RunPod job ID
    if (!run.runpodJobId) {
      return NextResponse.json(
        { error: 'No pod ID associated with this container' },
        { status: 404 }
      );
    }

    // Log the pod deletion attempt
    notebookLogger.info(`Attempting to delete pod ${run.runpodJobId}`, {
      userId: session.user.id,
      notebookId: run.notebookId,
      runId: run._id.toString()
    });

    // Get API key for RunPod
    const apiKey = process.env.RUNPOD_API_KEY;
    if (!apiKey) {
      throw new Error('RunPod API key not configured');
    }

    // Delete the pod using the RunPod API
    const podId = run.runpodJobId;
    const response = await axios.delete(
      `https://rest.runpod.io/v1/pods/${podId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    // Update the run status to reflect the pod was deleted
    await NotebookRun.findByIdAndUpdate(run._id, {
      status: 'terminated',
      completedAt: new Date(),
      error: 'Pod was manually deleted by the user'
    });

    return NextResponse.json({
      success: true,
      message: `Pod ${run.runpodJobId} has been deleted successfully`
    });
  } catch (error) {
    // Log the error
    notebookLogger.error('Error deleting pod:', error);
    
    // Check for specific RunPod API errors
    if (error.response) {
      const status = error.response.status;
      if (status === 400) {
        return NextResponse.json({ error: 'Invalid pod ID', success: false }, { status: 400 });
      } else if (status === 401) {
        return NextResponse.json({ error: 'Unauthorized access to RunPod API', success: false }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred while deleting the pod',
        success: false
      },
      { status: 500 }
    );
  }
}
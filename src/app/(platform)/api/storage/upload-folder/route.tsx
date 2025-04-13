//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { BlobStorageService } from '@/services/blobStorage';

const blobStorage = new BlobStorageService();

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle multipart form data
    const formData = await req.formData();
    const folderName = formData.get('folderName');
    
    if (!folderName) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Get all files and their paths
    const files = formData.getAll('files');
    const paths = formData.getAll('paths');
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length !== paths.length) {
      return NextResponse.json({ error: 'Files and paths count mismatch' }, { status: 400 });
    }

    // Create a new container for this folder upload
    const { containerName, containerUrl } = await blobStorage.createContainer(`folder-${folderName.toString().toLowerCase().replace(/[^a-z0-9]/g, '-')}`);

    // Upload each file to the container, preserving directory structure
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const path = paths[i].toString();
      console.log('Uploading file:', file.name, 'to path:', path);
      // Convert File object to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Use the relative path as the blob name to preserve directory structure
      // Remove the root folder name from the path to avoid redundancy
      const blobName = path;
      
      // Upload the file
      await blobStorage.uploadFile(buffer, blobName, containerName);
    }

    // Generate a SAS URL for the container
    const containerSasUrl = await blobStorage.getContainerSasUrl(containerName, 100000); // 1 week access

    return NextResponse.json({
      success: true,
      containerName,
      containerUrl: containerSasUrl,
      fileCount: files.length
    });
  } catch (error) {
    console.error('Error uploading folder:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
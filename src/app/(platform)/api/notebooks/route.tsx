//@ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { NotebookService } from '@/services/notebookService';
import { Organization } from '@/lib/db/models';

const notebookService = new NotebookService();

type ParsedFormData = {
  fields: Record<string, FormDataEntryValue>;
  files: Record<string, File>;
};

export async function parseFormData(formData: FormData): Promise<ParsedFormData> {
  const fields: Record<string, FormDataEntryValue> = {};
  const files: Record<string, File> = {};

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      fields[key] = value;
    } else if (value instanceof File) {
      files[key] = value;
    }
  }

  return { fields, files };
}

// GET /api/notebooks
// Retrieve all notebooks for the authenticated user or for a specific organization
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    
    let notebooks;
    
    if (organizationId) {
      // Fetch organization notebooks
      notebooks = await notebookService.getOrganizationNotebooks(organizationId, session.user.id);
    } else {
      // Fetch user's personal notebooks
      notebooks = await notebookService.getUserNotebooks(session.user.id);
    }
    
    return NextResponse.json(notebooks);
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const { fields, files } = await parseFormData(formData);
    
    const notebookService = new NotebookService();
    
    // Extract form fields
    const name = fields.name as string;
    const content = fields.content as string;
    const organizationId = fields.organizationId as string;
    const datasetInputMethod = fields.datasetInputMethod as string;
    const folderContainerName = fields.folderContainerName as string;
    const folderContainerUrl = fields.folderContainerUrl as string;
    const mainFilePath = fields.mainFilePath as string;
    
    // Handle uploaded notebook file if present
    let notebookFileBuffer: Buffer | undefined;
    let notebookFileName: string | undefined;
    
    if (files.notebookFile) {
      const notebookFile = files.notebookFile as File;
      notebookFileBuffer = Buffer.from(await notebookFile.arrayBuffer());
      notebookFileName = notebookFile.name;
    }
    
    const OrganizationId = await (Organization.findOne({ where: { name: organizationId } }))?._id || "";
    // Create the notebook
    const notebook = await notebookService.createNotebook(
      name,
      session.user.id,
      OrganizationId || undefined,
      content,
      notebookFileBuffer,
      notebookFileName,
      {
        datasetInputMethod,
        folderContainerName,
        folderContainerUrl,
        mainFilePath: mainFilePath
      }
    );
    
    return NextResponse.json(notebook);
  } catch (error) {
    console.error('Error creating notebook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create notebook' },
      { status: 500 }
    );
  }
}
//@ts-nocheck
import { Notebook, INotebook, Organization, NotebookRun, INotebookRun } from '@/lib/db/models';
import { RunpodService, PodConfig } from './runpod';
import { BlobStorageService } from './blobStorage';
import { notebookLogger, performanceMonitor, monitoredMethod } from '@/lib/monitoring';
import { NotFoundError, UnauthorizedError, retry, ExternalServiceError } from '@/lib/error-handling';
import { jobQueue } from '@/lib/job-queue';
import { note } from 'mermaid/dist/rendering-util/rendering-elements/shapes/note.js';

interface NotebookRunOptions {
  datasetFiles?: Buffer[];
  datasetFilenames?: string[];
  gpuTypeId?: string;
  gpuCount?: number;
  volumeInGb?: number;
}

export class NotebookService {
  private runpod: RunpodService;
  private blobStorage: BlobStorageService;
  
  constructor() {
    this.runpod = new RunpodService();
    this.blobStorage = new BlobStorageService();
    
    // Log service initialization
    notebookLogger.info('NotebookService initialized');
  }
  
  // Get all notebooks for a user
  async getUserNotebooks(userId: string): Promise<INotebook[]> {
    return await Notebook.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();
  }
  
  // Get all notebooks for an organization
  async getOrganizationNotebooks(organizationId: string, userId: string): Promise<INotebook[]> {
    // First verify the user is a member of the organization
    const organization = await Organization.findOne({
      _id: organizationId,
      'members.userId': userId
    }).lean();
    
    if (!organization) {
      throw new Error('User is not a member of this organization');
    }
    
    // Get all notebooks for this organization
    return await Notebook.find({ organizationId })
      .sort({ updatedAt: -1 })
      .lean();
  }
  
  // Get a single notebook
  async getNotebook(notebookId: string, userId: string): Promise<INotebook | null> {
    const notebook = await Notebook.findById(notebookId).lean();
    
    if (!notebook) {
      return null;
    }
    
    // If the notebook belongs to the user, they can access it
    if (notebook.userId === userId) {
      return notebook;
    }
    
    // If the notebook belongs to an organization, check if the user is a member
    if (notebook.organizationId) {
      const organization = await Organization.findOne({
        _id: notebook.organizationId,
        'members.userId': userId
      }).lean();
      
      if (organization) {
        return notebook;
      }
    }
    
    // If the notebook is public, anyone can access it
    if (notebook.isPublic) {
      return notebook;
    }
    
    // Otherwise, the user doesn't have access
    return null;
  }
  
  // Create a new notebook
  async createNotebook(
    name: string,
    userId: string,
    organizationId?: string,
    content?: string,
    notebookFile?: Buffer, // Add notebookFile parameter
    notebookFileName?: string, // Add filename parameter
    options?: {
      datasetFiles?: Buffer[];
      datasetFilenames?: string[];
      datasetInputMethod?: string;
      folderContainerName?: string;
      folderContainerUrl?: string;
      mainFilePath?: string;
    }
  ): Promise<INotebook> {
    // If organizationId is provided, verify the user is a member
    if (organizationId) {
      const organization = await Organization.findOne({
        _id: organizationId,
        'members.userId': userId
      }).lean();
      
      if (!organization) {
        throw new Error('User is not a member of this organization');
      }
    }
    
    // Handle different input methods
    let inputContainerName: string | undefined;
    let inputContainerUrl: string | undefined;
    let mainFilePath: string | undefined;
    
    // Handle uploaded notebook file if provided
    if (notebookFile && notebookFileName) {
      notebookLogger.info(`Processing uploaded notebook file: ${notebookFileName}`);
      
      // Create input container for the notebook file
      const { containerName, containerUrl } = await this.blobStorage.createContainer('notebook-input');
      inputContainerName = containerName;
      
      // Upload the notebook file to the container
      await this.blobStorage.uploadFile(
        notebookFile,
        notebookFileName,
        containerName
      );
      
      // Set the main file path to the uploaded notebook
      mainFilePath = `/${notebookFileName}`;
      
      // Generate a SAS URL for the container with read-only access
      inputContainerUrl = await this.blobStorage.getContainerSasUrl(containerName, 100000, true); // 24 hour access
      
      // Set the datasetInputMethod to 'folder' so we treat this as a folder upload
      options = {
        ...options,
        datasetInputMethod: 'folder'
      };
    }
    // Handle existing folder upload or dataset files
    else if (options?.datasetInputMethod === 'folder') {
      if (options.folderContainerName && options.mainFilePath) {
        inputContainerName = options.folderContainerName;
        inputContainerUrl = options.folderContainerUrl;
        mainFilePath = options.mainFilePath;
        
      }
    } 
    else if (options?.datasetFiles && options?.datasetFilenames &&
        options.datasetFiles.length > 0 &&
        options.datasetFiles.length === options.datasetFilenames.length) {
      
      // Create input container for dataset files
      const { containerName, containerUrl } = await this.blobStorage.createContainer('input');
      inputContainerName = containerName;
      
      // Upload each dataset file to the input container
      for (let i = 0; i < options.datasetFiles.length; i++) {
        await this.blobStorage.uploadFile(
          options.datasetFiles[i],
          options.datasetFilenames[i],
          containerName
        );
      }
      
      // Generate a SAS URL for the container with read-only access
      inputContainerUrl = await this.blobStorage.getContainerSasUrl(containerName, 100000, true); // 24 hour access
    }
    
    // Determine content to store in notebook
    let notebookContent = content;
    
    // If we have an uploaded notebook file but no direct content, we'll use the main file path
    if (!notebookContent && mainFilePath) {
      notebookContent = `# This notebook will execute the file at: ${mainFilePath}`;
    }
    
    // Create the notebook
    const notebook = await Notebook.create({
      name,
      userId,
      organizationId,
      content: notebookContent,
      status: 'pending',
      isPublic: false,
      inputContainerName,
      inputContainerUrl,
      mainFilePath,
      datasetInputMethod: options?.datasetInputMethod
    });
    
    return notebook;
  }
  
  // Update a notebook
  async updateNotebook(
    notebookId: string,
    updates: Partial<Pick<INotebook, 'name' | 'content' | 'isPublic'>>,
    userId: string
  ): Promise<INotebook | null> {
    // First check if the user has permission to update this notebook
    const notebook = await this.getNotebook(notebookId, userId);
    
    if (!notebook) {
      throw new Error('Notebook not found or user does not have access');
    }
    
    // If this is an organization notebook, verify the user has permission to edit
    if (notebook.organizationId) {
      const organization = await Organization.findOne({
        _id: notebook.organizationId,
        'members.userId': userId
      }).lean();
      
      if (!organization) {
        throw new Error('User does not have permission to update this notebook');
      }
      
      // Only allow notebook editing by admins or the creator
      const userMember = organization.members.find(m => m.userId === userId);
      if (userMember.role !== 'Admin' && notebook.userId !== userId) {
        throw new Error('Only notebook creators or organization admins can update notebooks');
      }
    } else if (notebook.userId !== userId) {
      // For personal notebooks, only the creator can edit
      throw new Error('Only notebook creators can update notebooks');
    }
    
    // Update the notebook
    const updatedNotebook = await Notebook.findByIdAndUpdate(
      notebookId,
      { $set: updates },
      { new: true }
    ).lean();
    
    return updatedNotebook;
  }
  
  // Delete a notebook
  async deleteNotebook(notebookId: string, userId: string): Promise<boolean> {
    // First check if the user has permission to delete this notebook
    const notebook = await this.getNotebook(notebookId, userId);
    
    if (!notebook) {
      throw new Error('Notebook not found or user does not have access');
    }
    
    // If this is an organization notebook, verify the user has permission to delete
    if (notebook.organizationId) {
      const organization = await Organization.findOne({
        _id: notebook.organizationId,
        'members.userId': userId
      }).lean();
      
      if (!organization) {
        throw new Error('User does not have permission to delete this notebook');
      }
      
      // Only allow notebook deletion by admins or the creator
      const userMember = organization.members.find(m => m.userId === userId);
      if (userMember.role !== 'Admin' && notebook.userId !== userId) {
        throw new Error('Only notebook creators or organization admins can delete notebooks');
      }
    } else if (notebook.userId !== userId) {
      // For personal notebooks, only the creator can delete
      throw new Error('Only notebook creators can delete notebooks');
    }
    
    // Delete the notebook and all associated runs
    await Notebook.findByIdAndDelete(notebookId);
    await NotebookRun.deleteMany({ notebookId });
    
    return true;
  }
  
  // Run a notebook
  // Only modifying the runNotebook method since createNotebook should not create a pod

// Run a notebook
async runNotebook(
  notebookId: string,
  userId: string,
): Promise<INotebookRun> {
  return await monitoredMethod('runNotebook', notebookLogger, async () => {
    // First check if the user has permission to run this notebook
    const notebook = await this.getNotebook(notebookId, userId);
    
    if (!notebook) {
      throw new NotFoundError('Notebook not found or user does not have access');
    }
    
    let organizationId = notebook.organizationId;
    const options = {
      inputContainerName: notebook.inputContainerName,
      inputContainerUrl: notebook.inputContainerUrl,
      mainFilePath: notebook.mainFilePath,
      datasetInputMethod: notebook.datasetInputMethod
    }
    // Default GPU type if not specified
    const gpuType = options.gpuTypeId || 'T4';
    
    // If this is an organization notebook, verify the user has permission to run it
    // and check credit availability
    if (organizationId) {
      const organization = await Organization.findOne({
        _id: organizationId,
        'members.userId': userId
      }).lean();
      
      if (!organization) {
        throw new UnauthorizedError('User does not have permission to run this notebook');
      }
      
      // Check if the organization has enough credits
      const creditsNeeded = this.estimateCreditCost(gpuType);
      if (organization.creditsAvailable < creditsNeeded) {
        throw new Error('Organization does not have enough credits available');
      }
    }
    
    // Create the run record with queued status initially
    const run = await NotebookRun.create({
      notebookId,
      userId,
      organizationId,
      status: 'queued',
      startedAt: new Date(),
      gpuType,
      inputContainerName: options.inputContainerName,
      inputContainerUrl: options.inputContainerUrl,
      mainFilePath: options.mainFilePath,
      datasetInputMethod: options.datasetInputMethod,
      creditsUsed: 0,
      podConfig: {
        gpuTypeId: options.gpuTypeId || 'T4',
        gpuCount: options.gpuCount || 1,
        volumeInGb: options.volumeInGb || 100
      }
    });
    
    notebookLogger.info(`Created notebook run ${run._id}`, { 
      notebookId, 
      gpuType,
      organizationId
    });
    
    // Update the notebook status
    await Notebook.findByIdAndUpdate(notebookId, {
      status: 'running',
      lastRunAt: new Date()
    });
    
    try {
      // Immediately process the run instead of queueing it
      await this.processRun(run._id.toString());
      
      // Return the updated run
      const updatedRun = await NotebookRun.findById(run._id).lean();
      return JSON.parse(JSON.stringify(updatedRun));
    } catch (error) {
      notebookLogger.error(`Error processing run ${run._id}`, error);
      
      // Update the run and notebook status on error
      await NotebookRun.findByIdAndUpdate(run._id, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to process notebook run'
      });
      
      await Notebook.findByIdAndUpdate(notebookId, {
        status: 'failed'
      });
      
      // Rethrow the error
      throw error;
    }
  })();
}

// Process a notebook run - Now this is called directly from runNotebook
private async processRun(runId: string): Promise<void> {
  return await monitoredMethod(`processRun:${runId}`, notebookLogger, async () => {
    try {
      // Get the run record
      const run = await NotebookRun.findById(runId);
      if (!run) {
        throw new NotFoundError('Run not found');
      }
      
      // Get the notebook
      const notebook = await Notebook.findById(run.notebookId);
      if (!notebook) {
        throw new NotFoundError('Notebook not found');
      }
      
      notebookLogger.info(`Processing notebook run ${runId}`, {
        notebookId: run.notebookId,
        userId: run.userId,
        gpuType: run.gpuType
      });
      
      // Update run status to running
      run.status = 'running';
      await run.save();
      
      // Upload notebook content to blob storage
      let notebookUrl: string;
      if (notebook.inputDatasetMethod === 'file' && notebook.content) {
        // Upload notebook content as a file with retry logic
        await retry(
          async () => {
            const notebookBuffer = Buffer.from(notebook.content);
            const notebookFilename = `${notebook.name.replace(/\s+/g, '_')}.ipynb`;
            
            const { url } = await this.blobStorage.uploadFile(
              notebookBuffer,
              notebookFilename
            );
            
            notebookUrl = url;
          },
          {
            retries: 3,
            name: 'Upload notebook content',
            shouldRetry: (error) => true // Retry all errors for this operation
          }
        );
      }
      
      notebookLogger.info(`Uploaded notebook content`, { runId, notebookUrl });
      
      // Create output container
      const { containerName: outputContainerName, containerUrl: outputContainerUrl } = 
        await this.blobStorage.createContainer('output');
      
      // Generate a SAS URL for the output container with read/write access
      const outputContainerSasUrl = 
        await this.blobStorage.getContainerSasUrl(outputContainerName, 100000, false);
      
      // Store container names and URLs in the run record
      run.outputContainerName = outputContainerName;
      run.outputContainerUrl = outputContainerSasUrl;
      await run.save();
      
      // Extract pod configuration
      const podConfig: PodConfig = run.podConfig || {
        gpuTypeId: run.gpuType || 'T4',
        gpuCount: 1,
        volumeInGb: 100
      };
      console.log(run.inputContainerUrl);
      // Create a RunPod instance with retry logic
      const { podId } = await retry(
        async () => {
          return await this.runpod.createPod(
            `Notebook Run: ${notebook.name}`,
            'custom',
            run.mainFilePath || "",
            {
              notebookUrl,
              inputContainerUrl: run.inputContainerUrl,
              MAIN_FILE_PATH: notebook.mainFilePath,
              podConfig: {
                ...podConfig,
                env: {
                  OUTPUT_CONTAINER_URL: run.outputContainerUrl
                }
              }
            }
          );
        },
        {
          retries: 3,
          initialDelay: 2000,
          name: 'Create RunPod instance',
          shouldRetry: (error) => error instanceof ExternalServiceError
        }
      );
      
      notebookLogger.info(`Created RunPod instance ${podId}`, { runId });
      
      // Update the run with the pod ID
      run.runpodJobId = podId;
      await run.save();
      
      // Start polling for status updates
      this.pollRunStatus(runId, podId);
    } catch (error) {
      notebookLogger.error(`Error processing run ${runId}`, error);
      
      // Update the run status to failed
      const errorMessage = error instanceof Error ? error.message : 'Failed to process notebook run';
      await NotebookRun.findByIdAndUpdate(runId, {
        status: 'failed',
        error: errorMessage
      });
      
      // Update the notebook status
      const run = await NotebookRun.findById(runId);
      if (run) {
        await Notebook.findByIdAndUpdate(run.notebookId, {
          status: 'failed'
        });
      }
      
      // Re-throw the error to be handled by the job queue or runNotebook
      throw error;
    }
  })();
}
  
  // Poll run status until completion or failure
  private async pollRunStatus(runId: string, podId: string): Promise<void> {
    try {
      const run = await NotebookRun.findById(runId);
      if (!run) {
        throw new Error('Run not found');
      }
      
      // Determine the pod type based on the run configuration
      const podType = run.podType || 'custom';
      
      const { status, progress, resultUrl, notebookUrl, outputContainerUrl, error } = 
        await this.runpod.checkPodStatus(podId, podType);
      
      // Update run status
      run.status = status === 'processing' ? 'running' : status;
      run.progress = progress;
      if (error) run.error = error;
      
      // If completed, record the result and update credits
      if (status === 'completed') {
        // Record completion time and calculate duration
        run.completedAt = new Date();
        const durationMs = run.completedAt.getTime() - run.startedAt.getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));
        run.duration = `${durationMinutes}m`;
        
        // Record results based on pod type
        if (podType === 'custom') {
          // For custom notebooks, store notebook and output container URLs
          if (notebookUrl) run.executedNotebookUrl = notebookUrl;
          if (outputContainerUrl) run.outputContainerUrl = outputContainerUrl;
        } else {
          // For AlphaFold3 or other models, store result URL
          if (resultUrl) run.result = resultUrl;
        }
        
        // Calculate credits used based on duration and GPU type
        run.creditsUsed = this.calculateCreditsUsed(run.gpuType, durationMinutes);
        
        // Deduct credits from organization if applicable
        if (run.organizationId) {
          await Organization.findByIdAndUpdate(run.organizationId, {
            $inc: { creditsAvailable: -run.creditsUsed }
          });
        }
        
        // Update notebook status
        await Notebook.findByIdAndUpdate(run.notebookId, {
          status: 'completed'
        });
        
        // Stop the pod
        await this.runpod.stopPod(podId);
      } else if (status === 'failed') {
        // Update notebook status
        await Notebook.findByIdAndUpdate(run.notebookId, {
          status: 'failed'
        });
      }
      
      await run.save();
      
      // Continue polling if still in progress
      if (status === 'processing' || status === 'pending') {
        setTimeout(() => {
          this.pollRunStatus(runId, podId).catch(console.error);
        }, 30000); // Poll every 30 seconds
      }
    } catch (error) {
      console.error('Error polling run status:', error);
      
      await NotebookRun.findByIdAndUpdate(runId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to check run status'
      });
      
      // Update notebook status
      const run = await NotebookRun.findById(runId);
      if (run) {
        await Notebook.findByIdAndUpdate(run.notebookId, {
          status: 'failed'
        });
      }
    }
  }
  
  // Get runs for a specific notebook
  async getNotebookRuns(notebookId: string, userId: string): Promise<INotebookRun[]> {
    // First check if the user has permission to access this notebook
    const notebook = await this.getNotebook(notebookId, userId);
    
    if (!notebook) {
      throw new Error('Notebook not found or user does not have access');
    }
    
    // Get all runs for this notebook
    const c =  await NotebookRun.find({ notebookId })
      .sort({ startedAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(c));
  }
  
  // Get all runs for a user
  async getUserRuns(userId: string, filter: string = 'all'): Promise<INotebookRun[]> {
    let query: any = { userId };
    
    // Apply status filter
    if (filter !== 'all') {
      query.status = filter;
    }
    
  const runs = await NotebookRun.find(query)
  .sort({ startedAt: -1 })
  .lean();

    // Serialize MongoDB objects to make them safe for client components
    const serializedRuns = runs.map(run => ({
      ...run,
      _id: run._id.toString(),
      notebookId: run.notebookId?.toString(),
      userId: run.userId?.toString(),
      startedAt: run.startedAt instanceof Date ? run.startedAt.toISOString() : run.startedAt,
      createdAt: run.createdAt instanceof Date ? run.createdAt.toISOString() : run.createdAt,
      updatedAt: run.updatedAt instanceof Date ? run.updatedAt.toISOString() : run.updatedAt,
    }));

    return serializedRuns;
  }
  
  // Get all runs for an organization
  async getOrganizationRuns(organizationId: string, userId: string, filter: string = 'all'): Promise<INotebookRun[]> {
    // First verify the user is a member of the organization
    const organization = await Organization.findOne({
      _id: organizationId,
      'members.userId': userId
    }).lean();
    
    if (!organization) {
      throw new Error('User is not a member of this organization');
    }
    
    // Build query
    let query: any = { organizationId };
    
    // Apply status filter
    if (filter !== 'all') {
      query.status = filter;
    }
    
    // Get all runs for this organization
    return await NotebookRun.find(query)
      .sort({ startedAt: -1 })
      .lean();
  }
  
  // Helper methods for credit calculation
  
  // Estimate credit cost for a run based on GPU type
  private estimateCreditCost(gpuType: string): number {
    // This is a simplified model - in a real system, this would be more sophisticated
    const creditRates: Record<string, number> = {
      'T4': 100,     // Lower tier GPU
      'A4000': 200,  // Mid tier GPU
      'A100': 500    // High tier GPU
    };
    
    return creditRates[gpuType] || 100; // Default to T4 rate
  }
  
  // Calculate actual credits used based on duration
  private calculateCreditsUsed(gpuType: string, durationMinutes: number): number {
    // Credit per minute rates
    const ratePerMinute: Record<string, number> = {
      'T4': 10,      // e.g., 10 credits per minute
      'A4000': 20,   // e.g., 20 credits per minute
      'A100': 50     // e.g., 50 credits per minute
    };
    
    const rate = ratePerMinute[gpuType] || ratePerMinute['T4'];
    return Math.max(rate, rate * durationMinutes); // Minimum charge of 1 minute
  }
}
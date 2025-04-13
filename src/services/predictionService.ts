//@ts-nocheck
import { Prediction, IPrediction } from '@/lib/db/models';
import { BlobStorageService } from './blobStorage';
import { RunpodService } from './runpod';
import { SendEmailService } from './email';

export class PredictionService {
  private blobStorage: BlobStorageService;
  private runpod: RunpodService;
  private emailService: SendEmailService;
  
  constructor() {
    this.blobStorage = new BlobStorageService();
    this.runpod = new RunpodService();
    this.emailService = new SendEmailService();
  }
  
  // Get predictions for a user
  async getUserPredictions(userId: string): Promise<IPrediction[]> {
    return await Prediction.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
  }
  
  // Get a single prediction
  async getPrediction(predictionId: string, userId: string): Promise<IPrediction | null> {
    return await Prediction.findOne({ _id: predictionId, userId }).lean();
  }
  
  // Create a new prediction job
  async createPrediction(
    userId: string,
    file: Buffer,
    filename: string,
    name: string
  ): Promise<IPrediction> {
    // 1. Upload file to Azure Blob Storage
    const { url: blobUrl, name: blobName } = await this.blobStorage.uploadFile(file, filename);
    
    // 2. Create prediction record in database
    const prediction = await Prediction.create({
      userId,
      name: name || filename.replace('.json', ''),
      status: 'pending',
      originalFilename: filename,
      blobUrl,
      fileSize: file.length,
    });
    
    // 3. Start processing on RunPod asynchronously
    this.startProcessing(prediction._id.toString(), blobUrl).catch(error => {
      console.error('Error starting processing job:', error);
    });
    
    return prediction;
  }
  
  // Start the processing job
  private async startProcessing(predictionId: string, inputFileUrl: string): Promise<void> {
    try {
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }
      
      // Create a RunPod instance
      const { podId } = await this.runpod.createPod(inputFileUrl, prediction.name);
      
      // Update the prediction with the pod ID
      prediction.runpodJobId = podId;
      prediction.status = 'processing';
      await prediction.save();
      
      // Start polling for status updates
      this.pollJobStatus(predictionId, podId);
    } catch (error) {
      console.error('Error starting processing:', error);
      await Prediction.findByIdAndUpdate(predictionId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to start processing',
      });
    }
  }
  
  // Poll job status until completion or failure
  private async pollJobStatus(predictionId: string, podId: string): Promise<void> {
    try {
      const { status, progress, resultUrl, error } = await this.runpod.checkPodStatus(podId);
      
      const prediction = await Prediction.findById(predictionId);
      if (!prediction) {
        throw new Error('Prediction not found');
      }
      
      // Update prediction status
      prediction.status = status;
      if (progress !== undefined) prediction.progress = progress;
      if (error) prediction.error = error;
      
      // If completed, download and store the result
      if (status === 'completed' && resultUrl) {
        // Download result from RunPod
        const resultResponse = await fetch(resultUrl);
        const resultBuffer = Buffer.from(await resultResponse.arrayBuffer());
        
        // Upload result to Azure Blob Storage
        const { url: resultBlobUrl, name: resultBlobName } = await this.blobStorage.uploadFile(
          resultBuffer,
          `result-${prediction.originalFilename}`
        );
        
        // Update prediction with result information
        prediction.resultBlobUrl = resultBlobUrl;
        prediction.resultFileSize = resultBuffer.length;
        
        // Notify user by email
        await this.emailService.sendPredictionComplete(
          prediction.userId,
          prediction._id.toString(),
          prediction.name
        );
        
        // Stop the pod since we're done with it
        await this.runpod.stopPod(podId);
      }
      
      await prediction.save();
      
      // Continue polling if still in progress
      if (status === 'processing' || status === 'pending') {
        setTimeout(() => {
          this.pollJobStatus(predictionId, podId).catch(console.error);
        }, 30000); // Poll every 30 seconds
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      await Prediction.findByIdAndUpdate(predictionId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to check processing status',
      });
    }
  }
  
  // Generate a download URL for a completed prediction
  async getDownloadUrl(predictionId: string, userId: string): Promise<string> {
    const prediction = await Prediction.findOne({ _id: predictionId, userId });
    if (!prediction) {
      throw new Error('Prediction not found');
    }
    
    if (prediction.status !== 'completed' || !prediction.resultBlobUrl) {
      throw new Error('Prediction result not available');
    }
    
    // Extract blob name from the URL
    const blobName = prediction.resultBlobUrl.split('/').pop()!;
    
    // Generate a temporary signed URL for download
    return await this.blobStorage.getSignedUrl(blobName, 60); // URL valid for 60 minutes
  }
}

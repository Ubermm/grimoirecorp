//@ts-nocheck
import axios from 'axios';
import { ExternalServiceError } from '@/lib/error-handling';

export interface PodConfig {
  gpuTypeIds?: string[];
  gpuCount?: number;
  containerDiskInGb?: number;
  dockerImage?: string;
  ports?: string[];
  env?: Record<string, string>;
}

export class RunpodService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = process.env.RUNPOD_API_KEY as string;
    this.baseUrl = 'https://rest.runpod.io/v1';
    
    if (!this.apiKey) {
      console.warn('RunpodService initialized without API key. API calls will fail.');
    }
  }
  
  // Create a pod for custom notebook execution or model processing
  async createPod(
    name: string, 
    podType: 'custom' | 'alphafold3' = 'custom',
    MAIN_FILE_PATH: string,
    config: {
      notebookUrl?: string;
      inputContainerUrl?: string;
      MAIN_FILE_PATH?: string;
      podConfig?: PodConfig;
    }
  ): Promise<{ podId: string }> {
    try {
      // Set default configuration based on pod type
      const defaultConfig = podType === 'custom' 
        ? {
            allowedCudaVersions: ["12.7"],
            cloudType: "SECURE",
            computeType: "GPU",
            containerDiskInGb: 50,
            gpuCount: 1,
            gpuTypeIds: ["NVIDIA GeForce RTX 3090"],
            gpuTypePriority: "availability",
            imageName: "grimoirecorp.azurecr.io/runner:latest",
            interruptible: false,
            name: name,
            ports: ["80/http"],
            supportPublicIp: true,
            volumeInGb: 20,
            volumeMountPath: "/workspace",
            env: {
              INPUT_CONTAINER_URL: config.inputContainerUrl,
              OUTPUT_CONTAINER_URL: config.podConfig?.env?.OUTPUT_CONTAINER_URL,
              MAIN_FILE_PATH: config.MAIN_FILE_PATH,
            }
          }
        : {
            // Default config for alphafold3 type
            allowedCudaVersions: ["12.7"],
            cloudType: "SECURE",
            computeType: "GPU",
            containerDiskInGb: 50,
            gpuCount: 1,
            gpuTypeIds: ["NVIDIA GeForce RTX 4090"],
            gpuTypePriority: "availability",
            imageName: "runpod/alphafold:latest",
            interruptible: false,
            name: name,
            ports: ["80/http"],
            supportPublicIp: true,
            volumeInGb: 20,
            volumeMountPath: "/workspace",
          };
      
      // Create a deep copy of the default config to avoid mutation
      const mergedConfig = JSON.parse(JSON.stringify(defaultConfig));
      
      // Merge the provided config with the default config
      if (config.podConfig) {
        Object.keys(config.podConfig).forEach(key => {
          if (key === 'env' && config.podConfig?.env) {
            // Special handling for env to merge rather than replace
            mergedConfig.env = { 
              ...mergedConfig.env, 
              ...config.podConfig.env 
            };
          } else {
            // @ts-ignore - dynamic key access
            mergedConfig[key] = config.podConfig[key];
          }
        });
      }
      
      // Set base environment variables based on pod type, preserving any existing env vars
      if (podType === 'custom') {
        mergedConfig.env = {
          ...mergedConfig.env,
          NOTEBOOK_URL: config.notebookUrl,
          INPUT_CONTAINER_URL: config.inputContainerUrl,
          MAIN_FILE_PATH: config.MAIN_FILE_PATH,
          OUTPUT_CONTAINER_URL: config.podConfig.env.OUTPUT_CONTAINER_URL,
          JOB_NAME: name
        };
      } else {
        mergedConfig.env = {
          ...mergedConfig.env,
          INPUT_FILE_URL: config.inputFileUrl,
          OUTPUT_CONTAINER_URL: config.podConfig.env.OUTPUT_CONTAINER_URL,
          JOB_NAME: name
        };
      }
      
      // Filter out undefined environment variables
      const filteredEnv: Record<string, string> = {};
      Object.entries(mergedConfig.env || {}).forEach(([key, value]) => {
        if (value !== undefined) {
          filteredEnv[key] = value;
        }
      });
      
      // Get registry authentication ID if available
      const registryAuthId = process.env.REGISTRY_AUTH_ID;
      const envArgs = Object.entries(filteredEnv)
                            .map(([k, v]) => `'${k}=${v.replace(/'/g, `'\\''`)}'`) // escape inner single quotes safely
                            .join(" ");

      // Prepare the API request payload
      const requestPayload = {
        containerRegistryAuthId: registryAuthId,
        containerDiskInGb: mergedConfig.containerDiskInGb,
        env: filteredEnv,
        gpuCount: mergedConfig.gpuCount,
        gpuTypeIds: mergedConfig.gpuTypeIds,
        imageName:  mergedConfig.imageName,
        interruptible: mergedConfig.interruptible || false,
        dockerStartCmd: ["bash", "-c", `/app/entrypoint.sh ${envArgs}`],
        ports: mergedConfig.ports,
      };
  
      // Add registry auth ID if available
      if (registryAuthId) {
        requestPayload.containerRegistryAuthId = registryAuthId;
      }
      
      const response = await axios.post(
        `${this.baseUrl}/pods`,
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.data || !response.data.id) {
        throw new Error('RunPod API did not return a valid pod ID');
      }
      
      return { podId: response.data.id };
    } catch (error: any) {
      console.error('Error creating RunPod pod:', error.response?.data || error.message);
      throw new ExternalServiceError(
        `Failed to create GPU pod: ${error.response?.data?.error || error.message}`,
        { source: 'RunPod', operation: 'createPod' }
      );
    }
  }
  
  // Check the status of a pod
  async checkPodStatus(podId: string, podType: 'custom' | 'alphafold3' = 'custom'): Promise<{
    status: string;
    progress?: number;
    resultUrl?: string;
    notebookUrl?: string;
    outputContainerUrl?: string;
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pods/${podId}`,
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }
      );
      
      const data = response.data;
      
      // Map RunPod status to our status format
      let status: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
      let progress: number | undefined;
      let resultUrl: string | undefined;
      let notebookUrl: string | undefined;
      let outputContainerUrl: string | undefined;
      let error: string | undefined;
      
      if (data.desiredStatus === 'EXITED') {
        if (data.lastStatusChange?.includes('completed')) {
          status = 'completed';
          
          // Extract results based on pod type
          if (podType === 'custom') {
            // For custom notebooks, look for notebook and output container URLs
            notebookUrl = data.env?.EXECUTED_NOTEBOOK_URL;
            outputContainerUrl = data.env?.OUTPUT_CONTAINER_URL;
          } else {
            // For AlphaFold3, look for result URL
            resultUrl = data.env?.RESULT_URL;
          }
        } else {
          status = 'failed';
          error = data.lastStatusChange || 'Processing failed';
        }
      } else if (data.desiredStatus === 'RUNNING') {
        status = 'processing';
        progress = undefined;
      }
      
      return { status, progress, resultUrl, notebookUrl, outputContainerUrl, error };
    } catch (error: any) {
      console.error('Error checking pod status:', error.response?.data || error.message);
      throw new ExternalServiceError(
        `Failed to check pod status: ${error.response?.data?.error || error.message}`,
        { source: 'RunPod', operation: 'checkPodStatus', podId }
      );
    }
  }
  
  // Stop a pod when it's no longer needed
  async stopPod(podId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/pods/${podId}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${this.apiKey}` }
        }
      );
    } catch (error: any) {
      console.error('Error stopping pod:', error.response?.data || error.message);
      // Log error but don't throw to avoid blocking other cleanup operations
    }
  }
}
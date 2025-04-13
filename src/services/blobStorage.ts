//@ts-nocheck
import { BlobServiceClient, ContainerClient, ContainerSASPermissions } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

export class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private defaultContainerClient: ContainerClient;
  
  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING as string;
    const defaultContainerName = process.env.AZURE_STORAGE_CONTAINER_NAME as string;
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.defaultContainerClient = this.blobServiceClient.getContainerClient(defaultContainerName);
  }
  
  // Get or create a container client
  async getContainerClient(containerName?: string): Promise<ContainerClient> {
    if (!containerName) {
      return this.defaultContainerClient;
    }
    
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    
    // Create container if it doesn't exist
    const exists = await containerClient.exists();
    if (!exists) {
      await containerClient.create();
    }
    
    return containerClient;
  }
  
  // Create a new container with a unique name based on prefix
  async createContainer(prefix: string): Promise<{ containerName: string, containerUrl: string }> {
    // Ensure the prefix is valid for container names (lowercase, alphanumeric, dash)
    const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);
    const containerName = `${safePrefix}-${uuidv4().substring(0, 8)}`;
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    
    await containerClient.create();
    
    return {
      containerName,
      containerUrl: containerClient.url
    };
  }
  
  // Upload file to a specific container, preserving directory path in blob name
  async uploadFile(
    file: Buffer, 
    filename: string, 
    containerName?: string,
    preservePath: boolean = true
  ): Promise<{ url: string, name: string }> {
    // Get container client (default or specified)
    const containerClient = await this.getContainerClient(containerName);
    
    // Determine the appropriate blob name
    let blobName: string;
    
    if (preservePath) {
      // Use the filename as-is, which might include path information
      blobName = filename;
    } else {
      // Create a unique blob name to prevent collisions
      blobName = `${uuidv4()}-${filename.split('/').pop()}`;
    }
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload the file
    await blockBlobClient.upload(file, file.length);
    
    // Return the URL and blob name
    return {
      url: blockBlobClient.url,
      name: blobName
    };
  }
  
  // Upload a folder structure - maintains directory hierarchy
  async uploadFolder(
    files: { buffer: Buffer, path: string }[], 
    containerName?: string
  ): Promise<{ containerName: string, containerUrl: string, fileCount: number }> {
    // Create container if not provided
    let container: { containerName: string, containerUrl: string };
    
    if (!containerName) {
      container = await this.createContainer('folder');
      containerName = container.containerName;
    } else {
      const containerClient = await this.getContainerClient(containerName);
      container = {
        containerName,
        containerUrl: containerClient.url
      };
    }
    
    // Upload each file, preserving paths
    for (const file of files) {
      await this.uploadFile(file.buffer, file.path, containerName, true);
    }
    
    return {
      ...container,
      fileCount: files.length
    };
  }
  
  // List all blobs in a container with optional prefix/path
  async listBlobs(containerName: string, prefix?: string): Promise<Array<{ name: string, url: string, size: number, lastModified: Date }>> {
    const containerClient = await this.getContainerClient(containerName);
    const results = [];
    
    // List all blobs in the container
    const iterator = containerClient.listBlobsFlat({ prefix });
    
    // Iterate through the blobs
    for await (const blob of iterator) {
      const blobClient = containerClient.getBlobClient(blob.name);
      
      results.push({
        name: blob.name,
        url: blobClient.url,
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified
      });
    }
    
    return results;
  }
  
  // List virtual directories in a container (common prefixes)
  async listDirectories(containerName: string, prefix?: string): Promise<Array<{ name: string }>> {
    const containerClient = await this.getContainerClient(containerName);
    const directories = new Set<string>();
    
    // List all blobs in the container with the given prefix
    const iterator = containerClient.listBlobsFlat({ prefix });
    
    // Iterate through the blobs
    for await (const blob of iterator) {
      // Extract the directory path
      const name = blob.name;
      const lastSlashIndex = name.lastIndexOf('/');
      
      if (lastSlashIndex > 0) {
        const dirPath = name.substring(0, lastSlashIndex);
        
        // If prefix is provided, only include subdirectories
        if (!prefix || dirPath !== prefix) {
          // Find the first directory level after the prefix
          let relativePath = dirPath;
          if (prefix) {
            relativePath = dirPath.startsWith(prefix) ? dirPath.substring(prefix.length) : dirPath;
            if (relativePath.startsWith('/')) {
              relativePath = relativePath.substring(1);
            }
          }
          
          // Get just the first directory level
          const firstDir = relativePath.split('/')[0];
          if (firstDir) {
            directories.add(firstDir);
          }
        }
      }
    }
    
    return Array.from(directories).map(name => ({ name }));
  }
  
  async downloadFile(blobName: string, containerName?: string): Promise<Buffer> {
    const containerClient = await this.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Download the file
    const downloadResponse = await blockBlobClient.download(0);
    const downloaded = await this.streamToBuffer(downloadResponse.readableStreamBody!);
    
    return downloaded;
  }
  
  async deleteFile(blobName: string, containerName?: string): Promise<void> {
    const containerClient = await this.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }
  
  async deleteContainer(containerName: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    await containerClient.delete();
  }
  
  // Delete all blobs with a given prefix (useful for removing folders)
  async deleteFolder(containerName: string, folderPrefix: string): Promise<number> {
    const containerClient = await this.getContainerClient(containerName);
    let deleteCount = 0;
    
    // Ensure folder prefix ends with a slash
    if (!folderPrefix.endsWith('/')) {
      folderPrefix += '/';
    }
    
    // List all blobs with the given prefix
    const iterator = containerClient.listBlobsFlat({ prefix: folderPrefix });
    
    // Delete each blob
    for await (const blob of iterator) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      await blockBlobClient.delete();
      deleteCount++;
    }
    
    return deleteCount;
  }
  
  // Utility to convert stream to buffer
  private async streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
  
  // Get SAS URL for direct client access with expiry
  async getSignedUrl(blobName: string, expiryMinutes: number = 100000, containerName?: string): Promise<string> {
    const containerClient = await this.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Generate SAS token with read permissions that expires in specified minutes
    const sasUrl = await blockBlobClient.generateSasUrl({
      permissions: ContainerSASPermissions.parse('rwdlac'),
      expiresOn: new Date(new Date().valueOf() + expiryMinutes * 60 * 1000)
    });
    
    return sasUrl;
  }
  
  // Generate a SAS token for a container with read/write access
  async getContainerSasUrl(containerName: string, expiryMinutes: number = 100000, readOnly: boolean = false): Promise<string> {
    const containerClient = await this.getContainerClient(containerName);
    
    // Generate permissions based on readOnly flag
    const permissions = ContainerSASPermissions.parse('rwdlac');
    
    // Generate SAS token for the container
    const sasUrl = await containerClient.generateSasUrl({
      permissions,
      expiresOn: new Date(new Date().valueOf() + expiryMinutes * 60 * 1000)
    });
    
    return sasUrl;
  }
}
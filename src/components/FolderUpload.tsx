//@ts-nocheck
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Folder, FolderUp, Upload, File, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

interface FolderUploadProps {
  onUploadComplete: (containerName: string, containerUrl: string, fileCount: number) => void;
  onError?: (error: string) => void;
}

export default function FolderUpload({ onUploadComplete, onError }: FolderUploadProps) {
  const [selectedFolder, setSelectedFolder] = useState<{ name: string, files: File[] } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Automatically trigger upload when a folder is selected
  useEffect(() => {
    if (selectedFolder && !uploading) {
      handleUpload();
    }
  }, [selectedFolder]);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Get the first folder path to extract folder name
      const firstFile = e.target.files[0];
      const pathParts = firstFile.webkitRelativePath.split('/');
      const folderName = pathParts[0];
      
      // Convert FileList to array
      const files = Array.from(e.target.files);
      
      setSelectedFolder({
        name: folderName,
        files: files
      });
      
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-blue-500');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-500');
    
    // Check if items are being dragged (not just files)
    if (e.dataTransfer.items) {
      setError(null);
      
      // Use DataTransferItemList interface to access the file(s)
      const items = Array.from(e.dataTransfer.items);
      
      // Find the first directory in the dropped items
      const folderEntry = items.find(item => {
        // Try to get as webkitGetAsEntry - this works in Chrome/Edge/Safari
        const entry = item.webkitGetAsEntry();
        return entry && entry.isDirectory;
      });
      
      if (!folderEntry) {
        setError("Please drop a folder, not individual files");
        return;
      }
      
      const entry = folderEntry.webkitGetAsEntry();
      if (!entry || !entry.isDirectory) {
        setError("Failed to process the dropped folder");
        return;
      }
      
      const folderName = entry.name;
      const files: File[] = [];
      const paths: string[] = [];
      
      // Recursively read directory contents
      const readEntries = (entry: any, path: string) => {
        return new Promise<void>((resolve) => {
          if (entry.isFile) {
            // If it's a file, get the File object
            entry.file((file: File) => {
              // Add a custom property to store relative path
              Object.defineProperty(file, 'relativePath', {
                value: path,
                writable: false
              });
              files.push(file);
              paths.push(path);
              resolve();
            });
          } else if (entry.isDirectory) {
            // If it's a directory, read its contents
            const dirReader = entry.createReader();
            const readBatch = () => {
              dirReader.readEntries(async (entries: any[]) => {
                if (entries.length > 0) {
                  // Process each entry
                  await Promise.all(entries.map(childEntry => {
                    const newPath = path ? `${path}/${childEntry.name}` : childEntry.name;
                    return readEntries(childEntry, newPath);
                  }));
                  // Read next batch of entries
                  readBatch();
                } else {
                  // No more entries, resolve
                  resolve();
                }
              });
            };
            readBatch();
          }
        });
      };
      
      try {
        await readEntries(entry, "");
        
        setSelectedFolder({
          name: folderName,
          files: files
        });
      } catch (err) {
        setError("Error reading dropped folder");
        console.error(err);
      }
    } else {
      setError("Your browser doesn't support folder drag and drop");
    }
  };

  const handleUpload = async () => {
    if (!selectedFolder || selectedFolder.files.length === 0) {
      setError("No folder selected");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Create a new FormData instance
      const formData = new FormData();
      
      // Add folder name
      formData.append('folderName', selectedFolder.name);
      
      // Add each file with its relative path
      selectedFolder.files.forEach(file => {
        formData.append('files', file);
        
        // Get the relative path - either from our custom property or from webkitRelativePath
        let relativePath;
        if ('relativePath' in file) {
          // Use our custom property for drag-dropped files
          relativePath = (file as any).relativePath;
        } else if (file.webkitRelativePath) {
          // Use webkitRelativePath for files selected via input
          relativePath = file.webkitRelativePath.replace(`${selectedFolder.name}/`, '');
        } else {
          // Fallback to filename only
          relativePath = file.name;
        }
        
        formData.append('paths', relativePath);
      });

      // Upload the files
      const response = await axios.post('/api/storage/upload-folder', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      const result = response.data;

      // Optional: throw manually on failure (since Axios only throws on 4xx/5xx by default)
      if (!result.containerName || !result.containerUrl) {
        throw new Error(result.error || 'Upload failed');
      }

      // Notify parent component of successful upload
      onUploadComplete(
        result.containerName,
        result.containerUrl,
        selectedFolder.files.length
      );
      
      // Clear selected folder after successful upload
      setSelectedFolder(null);
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFolder(null);
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
    setError(null);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {!selectedFolder || uploading ? (
        <div 
          ref={dropZoneRef}
          className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8 transition-colors duration-200"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
              <p className="mb-2 text-sm font-medium">Uploading {selectedFolder?.name}</p>
              <div className="w-full max-w-xs mb-2">
                <Progress value={uploadProgress} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground">{uploadProgress}% uploaded</p>
            </div>
          ) : (
            <>
              <FolderUp className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="mb-2 text-sm font-medium">Upload a folder</p>
              <p className="mb-4 text-xs text-muted-foreground">Drop folder here or click to select</p>
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory="true"
                directory="true"
                multiple
                onChange={handleFolderSelect}
                className="hidden"
                id="folder-input"
              />
              <Button 
                variant="outline" 
                onClick={() => folderInputRef.current?.click()}
              >
                <Folder className="mr-2 h-4 w-4" />
                Select Folder
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
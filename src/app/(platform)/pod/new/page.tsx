"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Upload, Loader2, Info, File, Folder, X, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FolderUpload from '@/components/FolderUpload';



export default function NewNotebookPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [inputMethod, setInputMethod] = useState('file'); // 'code', 'file', or 'folder'
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderUpload, setFolderUpload] = useState<{
    containerName: string;
    containerUrl: string;
    fileCount: number;
    folderName?: string;
  } | null>(null);
  const [code, setCode] = useState('# Enter your Python code here\n\nimport pandas as pd\nimport numpy as np\n\n# Your analysis code here\n');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState('python-3.10');
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState('');
  const [mainFilePath, setMainFilePath] = useState('');
  const [pathError, setPathError] = useState('');

  const environments = [
    { id: 'python-3.10', name: 'Python 3.10' },
    { id: 'tensorflow', name: 'TensorFlow 2.10' },
    { id: 'pytorch', name: 'PyTorch 2.0' },
  ];

  // Fetch organizations when component mounts
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const data = await response.json();
        setOrganizations(data);
      } catch (err) {
        console.error('Error fetching organizations:', err);
      }
    }
    
    fetchOrganizations();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFolderUploadComplete = (containerName: string, containerUrl: string, fileCount: number, folderName?: string) => {
    setFolderUpload({
      containerName,
      containerUrl,
      fileCount,
      folderName
    });
  };

  const handleFolderUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const cancelFolderUpload = () => {
    setFolderUpload(null);
    setMainFilePath('');
    setPathError('');
  };

  // Validate the main file path format
  const validateMainFilePath = (path: string): boolean => {
    // Check if path starts with "/"
    if (!path.startsWith('/')) {
      setPathError('Path must begin with "/"');
      return false;
    }

    // Check if path ends with .py or .ipynb
    if (!path.endsWith('.py') && !path.endsWith('.ipynb')) {
      setPathError('Path must end with .py or .ipynb');
      return false;
    }

    // Check if path starts with the folder name
    if (folderUpload?.folderName && path.startsWith(`/${folderUpload.folderName}`)) {
      setPathError(`Path should not include the folder name. Don't start with "/${folderUpload.folderName}"`);
      return false;
    }

    // Valid path
    setPathError('');
    return true;
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setMainFilePath(path);
    validateMainFilePath(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if(!inputMethod) {
      return;
    }

    if(inputMethod === 'file' && !selectedFile) {
      return;
    }
    
    // Validation checks
    if (!name) {
      setError('Please enter a notebook name');
      return;
    }

    if (inputMethod === 'folder' && !folderUpload) {
      
      return;
    }

    if (inputMethod === 'folder' && !mainFilePath) {
      setError('Please specify the main file path');
      return;
    }
    
    // Validate main file path for folder uploads
    if (inputMethod === 'folder' && !validateMainFilePath(mainFilePath)) {
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('name', name);
      
      // Handle content based on input method
      if (inputMethod === 'code') {
        // Use the code from the textarea
        formData.append('content', code);
      } else if (inputMethod === 'file' && selectedFile) {
        // For single file upload
        formData.append('notebookFile', selectedFile);
        formData.append('content', `# This notebook will execute the uploaded file: ${selectedFile.name}`);
      } else if (inputMethod === 'folder' && folderUpload) {
        // For folder upload
        formData.append('content', `# This notebook will execute the file at: ${mainFilePath}`);
        formData.append('folderContainerName', folderUpload.containerName);
        formData.append('folderContainerUrl', folderUpload.containerUrl);
        formData.append('mainFilePath', mainFilePath);
        formData.append('datasetInputMethod', 'folder'); // Keep this for API compatibility
      } else {
        // Fallback
        formData.append('content', '# Empty notebook\n# Add your code here');
      }
      
      if (organizationId) {
        formData.append('organizationId', organizationId);
      }
      
      // Create the notebook via API
      const response = await fetch('/api/notebooks', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create notebook');
      }
      
      const notebook = await response.json();
      router.push(`/pod/${notebook.id}`);
    } catch (error) {
      console.error('Error creating notebook:', error);
      setError(error.message || 'An error occurred while creating the notebook');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/pod')}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Notebooks
        </Button>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Notebook</h1>
        <p className="text-muted-foreground">Set up a new computational notebook</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Notebook Details</CardTitle>
          <CardDescription>Configure your new computational notebook</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notebook-name">Notebook Name*</Label>
                <Input
                  id="notebook-name"
                  placeholder="Enter a name for your notebook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="environment">Execution Environment</Label>
                <Select
                  value={selectedEnvironment}
                  onValueChange={setSelectedEnvironment}
                >
                  <SelectTrigger id="environment">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env.id} value={env.id}>{env.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {organizations.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger id="organization">
                    <SelectValue placeholder="Select an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="personal" value="Personal Notebook">Personal Notebook</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org._id} value={org._id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigning to an organization allows team members to access it and uses the organization's credits
                </p>
              </div>
            )}
            
            <div>
              <Label>Notebook Content</Label>
              <Tabs 
                value={inputMethod} 
                onValueChange={setInputMethod}
                className="mt-2"
              >
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                  <TabsTrigger value="folder">Upload Folder</TabsTrigger>
                </TabsList>
                
                <TabsContent value="file" className="mt-4">
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-10">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="mb-2 text-sm font-medium">Upload a .ipynb or .py file</p>
                    <p className="mb-4 text-xs text-muted-foreground">Drag and drop or click to browse</p>
                    <Input
                      type="file"
                      accept=".ipynb,.py"
                      onChange={handleFileChange}
                      className="max-w-xs"
                    />
                    {selectedFile && (
                      <p className="mt-2 text-sm font-medium text-green-600">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="folder" className="mt-4">
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Upload a folder containing your project. You'll need to specify the main file to execute.
                    </AlertDescription>
                  </Alert>
                  
                  {folderUpload ? (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Folder className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <p className="font-medium">Folder uploaded successfully</p>
                            <p className="text-sm text-muted-foreground">
                              {folderUpload.folderName ? `"${folderUpload.folderName}" with ` : ''}
                              {folderUpload.fileCount} files
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={cancelFolderUpload}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <FolderUpload 
                      onUploadComplete={handleFolderUploadComplete}
                      onError={handleFolderUploadError}
                    />
                  )}

                  {folderUpload && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="main-file-path">Main File Path*</Label>
                      <Input
                        id="main-file-path"
                        placeholder="/path/to/your/file.py"
                        value={mainFilePath}
                        onChange={handlePathChange}
                        className={pathError ? "border-red-300" : ""}
                      />
                      
                      {pathError ? (
                        <div className="flex items-start mt-1.5 text-red-500 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{pathError}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-1.5">
                          <p>Enter the relative path to the main .py or .ipynb file to execute</p>
                          <p className="mt-1">
                            <strong>Example:</strong> If your folder is named "{folderUpload.folderName || 'myproject'}" and contains a file at 
                            "{folderUpload.folderName || 'myproject'}/src/main.py", 
                            enter <strong>/src/main.py</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.push('/pod')}
              className="mr-2"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || (inputMethod === 'folder' && (pathError !== '' || mainFilePath === ''))}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Notebook'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
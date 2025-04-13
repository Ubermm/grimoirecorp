//@ts-nocheck
'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Upload, 
  FileJson, 
  Download, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Dna,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

// Types for predictions
interface Prediction {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  originalFilename?: string;
  fileSize?: number;
  progress?: number;
  error?: string;
  resultFileSize?: number;
}

export default function AlphaFold3Client({ 
  initialPredictions = [],
}: { 
  initialPredictions: Prediction[];
}) {
  const [predictions, setPredictions] = useState<Prediction[]>(initialPredictions);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.fasta')) {
      setError('Please upload a JSON or FASTA file');
      return;
    }
    
    try {
      setIsUploading(true);
      setError('');
      
      // Upload file and get prediction
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.split('.')[0]);
      
      const response = await fetch('/api/predictions', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const newPrediction = await response.json();
      
      // Update predictions list
      setPredictions(prev => [newPrediction, ...prev]);
      
      // Alert user
      alert('File uploaded successfully. Your prediction is now in the queue.');
      
      // Switch to predictions tab
      setActiveTab('predictions');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.message || 'An error occurred during upload');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Function to refresh predictions
  const refreshPredictions = async () => {
    try {
      const response = await fetch('/api/predictions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }
      
      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      console.error('Error refreshing predictions:', err);
      setError('Failed to refresh predictions');
    }
  };
  
  // Handle download
  const handleDownload = async (predictionId: string) => {
    try {
      const response = await fetch(`/api/predictions/${predictionId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to generate download URL');
      }
      
      const { url } = await response.json();
      
      // Open download in a new tab
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error generating download link:', err);
      setError('Failed to download prediction results');
    }
  };
  
  // Status icon for predictions
  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/models" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Models
        </Link>
        
        <div className="flex items-center mb-2">
          <Dna className="mr-2 h-6 w-6 text-blue-500" />
          <h1 className="text-3xl font-bold tracking-tight">AlphaFold 3</h1>
        </div>
        <p className="text-muted-foreground">
          State-of-the-art protein structure prediction
        </p>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="run">Run Prediction</TabsTrigger>
          <TabsTrigger value="predictions">Your Predictions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>About AlphaFold 3</CardTitle>
                <CardDescription>
                  Understanding protein structure prediction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  AlphaFold 3 represents the latest breakthrough in protein structure prediction.
                  Building on the revolutionary success of AlphaFold 2, version 3 delivers
                  unprecedented accuracy in predicting protein structures from amino acid 
                  sequences.
                </p>
                <p>
                  This model supports complex protein structures, including multi-chain proteins,
                  protein-ligand interactions, and can generate predictions for proteins with
                  low sequence homology to known structures.
                </p>
                <h3 className="text-lg font-medium mt-4">Key Features:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Improved accuracy for complex protein structures</li>
                  <li>Support for multi-chain proteins and protein-ligand interactions</li>
                  <li>Faster prediction times compared to previous versions</li>
                  <li>Comprehensive confidence metrics</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center mr-2">1</div>
                  <p>Prepare your protein sequence in FASTA format</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center mr-2">2</div>
                  <p>Upload your file in the "Run Prediction" tab</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center mr-2">3</div>
                  <p>Receive an email when your prediction is ready</p>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center mr-2">4</div>
                  <p>Download and analyze your results</p>
                </div>
                
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Input Format</AlertTitle>
                  <AlertDescription>
                    Your file should contain a valid JSON input for AlphaFold 3.
                    Example format:
                    <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                      {`{
  "sequence": "MVLSPADKTNVKAAWGKVGAHAGEYGAEAL...",
  "max_recycles": 3,
  "use_templates": false
}`}
                    </pre>
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => setActiveTab('run')}>
                  Run Prediction
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="run">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Run AlphaFold 3 Prediction</CardTitle>
              <CardDescription>
                Upload your protein sequence to start the prediction process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.fasta"
                />
                <div className="flex flex-col items-center">
                  <FileJson className="h-12 w-12 text-blue-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isUploading ? 'Uploading...' : 'Upload your JSON file'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your file should contain a valid JSON input for AlphaFold 3
                  </p>
                  <Button disabled={isUploading}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Select File
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Processing Time</AlertTitle>
                <AlertDescription>
                  Prediction may take up to 30 minutes depending on queue load and complexity.
                  You will receive an email notification when your results are ready.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="predictions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Predictions</CardTitle>
                <CardDescription>
                  View and manage your AlphaFold 3 prediction jobs
                </CardDescription>
              </div>
              <Button variant="outline" onClick={refreshPredictions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-12">
                  <Dna className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No predictions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload a file to start your first prediction
                  </p>
                  <Button onClick={() => setActiveTab('run')}>
                    Run Prediction
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {predictions.map((prediction) => (
                    <div key={prediction.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <StatusIcon status={prediction.status} />
                        <div className="ml-4">
                          <h3 className="font-medium">{prediction.name}</h3>
                          <div className="text-sm text-muted-foreground">
                            Created {new Date(prediction.createdAt).toLocaleDateString()} at {new Date(prediction.createdAt).toLocaleTimeString()}
                          </div>
                          {prediction.status === 'failed' && (
                            <div className="text-sm text-red-500 mt-1">
                              Error: {prediction.error}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="mr-4 text-right">
                          <Badge variant={
                            prediction.status === 'completed' ? 'success' :
                            prediction.status === 'processing' ? 'default' :
                            prediction.status === 'failed' ? 'destructive' : 
                            'outline'
                          }>
                            {prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
                          </Badge>
                          {prediction.resultFileSize && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatFileSize(prediction.resultFileSize)}
                            </div>
                          )}
                        </div>
                        
                        {prediction.status === 'processing' && prediction.progress !== undefined && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="w-24">
                                  <Progress value={prediction.progress} className="h-2" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {prediction.progress}% complete
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {prediction.status === 'completed' && (
                          <Button variant="outline" size="sm" onClick={() => handleDownload(prediction.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
//@ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Download, Play, AlertCircle, X, Loader2 } from 'lucide-react';
import { formatRelative } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

interface NotebookRun {
  _id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: string;
  error?: string;
  runpodJobId?: string;
  outputContainerUrl?: string;
}

interface NotebookRunnerProps {
  notebookId: string;
  runs: NotebookRun[];
  notebookName: string;
}

function RunStatusBadge({ status }: { status: string }) {
  const statusMap = {
    'queued': { color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200', label: 'Queued' },
    'running': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', label: 'Running' },
    'completed': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', label: 'Completed' },
    'failed': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', label: 'Failed' },
  };

  const { color, label } = statusMap[status as keyof typeof statusMap] || { color: 'bg-slate-200 text-slate-800', label: status };

  return (
    <Badge variant="outline" className={`${color}`}>
      {label}
    </Badge>
  );
}

export default function PodPage() {
  const { id } = useParams();
  const [notebook, setNotebook] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch notebook details
        const notebookResponse = await fetch(`/api/notebooks/${id}`);
        const notebookData = await notebookResponse.json();
        
        // Fetch notebook runs
        const runsResponse = await fetch(`/api/notebook-runs/${id}`);
        const runsData = await runsResponse.json();
        
        setNotebook(notebookData);
        setRuns(runsData);
      } catch (error) {
        console.error('Error fetching notebook data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return <div>Loading notebook...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{notebook?.name || "Notebook"}</h1>
      
      {/* Other notebook components here */}
      
      {/* The NotebookRunner component with proper props */}
      <NotebookRunner 
        notebookId={id as string} 
        runs={runs} 
        notebookName={notebook?.name || "Untitled Notebook"} 
      />
    </div>
  );
}

function NotebookRunner({ notebookId, runs: initialRuns, notebookName }: NotebookRunnerProps) {
  const [runs, setRuns] = useState<NotebookRun[]>(initialRuns);
  const [isLoading, setIsLoading] = useState(false);
  const [runningPodStatus, setRunningPodStatus] = useState<Record<string, { isPodActive: boolean, isChecking: boolean }>>({});
  const { toast } = useToast();

  // Function to refresh runs
  const refreshRuns = async () => {
    try {
      const response = await fetch(`/api/notebook-runs/${notebookId}`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data);
      }
    } catch (error) {
      console.error('Failed to refresh runs:', error);
    }
  };

  // Function to run notebook
  const runNotebook = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/notebooks/${notebookId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to run notebook');
      }
      
      const newRun = await response.json();
      
      // Add the new run to our list
      setRuns(prev => [newRun, ...prev]);
      
      toast({
        title: 'Notebook run started',
        description: `The notebook "${notebookName}" is now running.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to run notebook',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check pod status - returns true if pod exists, false if 404
  const checkPodStatus = async (podId: string) => {
    try {
      await axios.get(`/api/runpod/pods/${podId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return true; // Pod exists
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return false; // Pod doesn't exist (completed and auto-deleted)
      }
      // For other errors, assume pod still exists
      return true;
    }
  };

  // Function to abort run (delete pod)
  const abortRun = async (run: NotebookRun) => {
    if (!run.runpodJobId) {
      toast({
        title: 'Cannot abort run',
        description: 'No RunPod job ID found for this run.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await axios.delete(`/api/runpod/pods/${run.runpodJobId}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      toast({
        title: 'Run aborted',
        description: 'The pod has been deleted. You may need to create a new pod to run this notebook again.',
      });

      // Update local state to show the run as failed
      setRuns(prev => prev.map(r => 
        r._id === run._id ? { ...r, status: 'failed', error: 'Run aborted by user' } : r
      ));

      // Refresh runs from server
      await refreshRuns();
    } catch (error) {
      toast({
        title: 'Failed to abort run',
        description: 'An error occurred while trying to delete the pod.',
        variant: 'destructive',
      });
    }
  };

  // Function to download output container
  const downloadOutputContainer = async (run: NotebookRun) => {
    if (!run.outputContainerUrl) {
      toast({
        title: 'Cannot download output',
        description: 'No output container URL found for this run.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRunningPodStatus(prev => ({
        ...prev,
        [run._id]: { ...prev[run._id], isChecking: true }
      }));

      // First check if the pod no longer exists (completed)
      const podExists = run.runpodJobId ? await checkPodStatus(run.runpodJobId) : false;
      
      if (podExists) {
        toast({
          title: 'Run still in progress',
          description: 'The output can only be downloaded after the run has completed.',
        });
        return;
      }

      // Initiate download through backend
      const response = await axios.post(
        `/api/notebooks/download-output`,
        { outputContainerUrl: run.outputContainerUrl, runId: run._id },
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${notebookName.replace(/\s+/g, '_')}_output.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Download started',
        description: 'Your output files are being downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Failed to download output',
        description: 'An error occurred while trying to download the output container.',
        variant: 'destructive',
      });
    } finally {
      setRunningPodStatus(prev => ({
        ...prev,
        [run._id]: { ...prev[run._id], isChecking: false }
      }));
    }
  };

  // Update pod status check on load and periodically for active runs
  useEffect(() => {
    // Initial check for all pods
    const checkAllPods = async () => {
      // Find runs that are in running or queued status and have a runpodJobId
      const activeRuns = runs.filter(
        run => (run.status === 'running' || run.status === 'queued') && run.runpodJobId
      );

      // Check each active run
      for (const run of activeRuns) {
        if (run.runpodJobId) {
          setRunningPodStatus(prev => ({
            ...prev,
            [run._id]: { isPodActive: true, isChecking: true }
          }));

          const podExists = await checkPodStatus(run.runpodJobId);
          
          setRunningPodStatus(prev => ({
            ...prev,
            [run._id]: { isPodActive: podExists, isChecking: false }
          }));

          // If pod doesn't exist anymore but status is still running, refresh runs
          if (!podExists && (run.status === 'running' || run.status === 'queued')) {
            await refreshRuns();
          }
        }
      }
    };

    checkAllPods();

    // Set up interval to check active pods every 30 seconds
    const intervalId = setInterval(checkAllPods, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [runs]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Notebook Runs</CardTitle>
          <CardDescription>History of executions for this notebook</CardDescription>
        </div>
        <Button onClick={runNotebook} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run Notebook
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {runs?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No runs yet. Click "Run Notebook" to start your first execution.
          </div>
        ) : (
          <div className="space-y-4">
            {runs?.map((run) => (
              <div 
                key={run._id} 
                className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <RunStatusBadge status={run.status} />
                    <span className="text-sm text-muted-foreground">
                      {formatRelative(new Date(run.startedAt), new Date())}
                    </span>
                    
                    {/* Show if pod is no longer active for running status */}
                    {run.status === 'running' && runningPodStatus[run._id]?.isPodActive === false && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        Pod Complete - Refreshing Status
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {run.completedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>
                          Duration: {run.duration || 'N/A'}
                        </span>
                      </div>
                    )}
                    
                    {run.error && (
                      <div className="flex items-center gap-1 text-red-600">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800">
                          Completed Execution!
                      </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 self-end md:self-center">
                  {/* Abort button - only show for running status */}
                  {(run.status === 'running' || run.status === 'queued') && run.runpodJobId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => abortRun(run)}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" /> Abort
                    </Button>
                  )}
                  
                  {/* Download button */}
                  {run.outputContainerUrl && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadOutputContainer(run)}
                      disabled={runningPodStatus[run._id]?.isChecking || 
                                (run.status === 'running' && runningPodStatus[run._id]?.isPodActive !== false)}
                    >
                      {runningPodStatus[run._id]?.isChecking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Checking...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" /> Download Output
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
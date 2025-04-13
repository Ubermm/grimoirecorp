//@ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Loader2, RefreshCw, Download, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

// Define types for our run data
export interface NotebookRun {
  id: string;
  notebookId: string;
  notebookName?: string; // We'll populate this client-side if needed
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: Date | null;
  completedAt: Date | null;
  duration: string | null;
  gpuType: string;
  organizationId?: string;
  creditsUsed: number;
  error?: string;
}

// Client component to display notebook runs
export default function NotebookRunner({ 
  notebookId,
  runs = [],
  notebookName
}: { 
  notebookId: string;
  runs?: any[];
  notebookName?: string;
}) {
  const [activeRuns, setActiveRuns] = useState<any[]>(runs);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Function to refresh runs from the API
  async function refreshRuns() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/notebooks/${notebookId}/runs`);
      if (!response.ok) {
        throw new Error('Failed to fetch runs');
      }
      const data = await response.json();
      setActiveRuns(data);
    } catch (error) {
      console.error('Error fetching runs:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Function to start a new run
  async function startRun() {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/notebooks/${notebookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start run');
      }
      
      const newRun = await response.json();
      // Add the new run to our list
      setActiveRuns(prev => [newRun, ...prev]);
      
      // Poll for updates
      setTimeout(() => refreshRuns(), 2000);
    } catch (error) {
      console.error('Error starting run:', error);
    } finally {
      setIsRunning(false);
    }
  }
  
  // Function to render the status badge
  function RunStatusBadge({ status }: { status: string }) {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case 'queued':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Info className="w-3 h-3 mr-1" /> Queued
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Unknown
          </Badge>
        );
    }
  }
  
  // Download run results
  async function downloadResults(runId: string) {
    try {
      window.open(`/api/runs/${runId}/download`, '_blank');
    } catch (error) {
      console.error('Error downloading results:', error);
    }
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Notebook Runs</CardTitle>
          <CardDescription>
            Execute your notebook and view run history
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshRuns}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={startRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Notebook
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeRuns.length === 0 ? (
          <div className="text-center py-8">
            <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No runs found for this notebook. Click "Run Notebook" to execute it.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>GPU Type</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeRuns.map((run) => (
                <TableRow key={run.id || run._id}>
                  <TableCell>
                    <RunStatusBadge status={run.status} />
                  </TableCell>
                  <TableCell>
                    {run.startedAt ? (
                      <span title={new Date(run.startedAt).toLocaleString()}>
                        {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {run.duration || (run.status === 'running' ? 'In progress' : 'N/A')}
                  </TableCell>
                  <TableCell>
                    {run.gpuType || 'T4'}
                  </TableCell>
                  <TableCell>
                    {run.creditsUsed || '0'}
                  </TableCell>
                  <TableCell className="text-right">
                    {run.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResults(run.id || run._id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    {run.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => alert(run.error || 'Unknown error')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        View Error
                      </Button>
                    )}
                    {(run.status === 'running') && run.progress !== undefined && (
                      <div className="w-24">
                        <Progress value={run.progress} className="h-2" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
//@ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ChevronRight,
  AlertCircle,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from '@/lib/utils';
import NotebookRunner from './notebook-runs-client';

// Status icon component
function StatusIcon({ status }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'running':
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'queued':
      return <Clock className="h-5 w-5 text-yellow-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-500" />;
  }
}

// Run list component
function RunsList({ initialRuns, userId, filter, onRefresh }) {
  const [runs, setRuns] = useState(initialRuns);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchRuns = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filterParam = filter !== 'all' ? `?filter=${filter}` : '';
      const response = await fetch(`/api/notebook-runs${filterParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch runs');
      }
      
      const data = await response.json();
      setRuns(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRuns();
  }, [userId, filter]);
  
  const handleRefresh = () => {
    fetchRuns();
    if (onRefresh) onRefresh();
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading runs: {error}</p>
        <Button onClick={handleRefresh} className="mt-2">Retry</Button>
      </div>
    );
  }

  if (loading && runs.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">No runs yet</h3>
        <p className="text-muted-foreground">Start a new notebook run to see it here</p>
        <Button className="mt-4" asChild>
          <Link href="/pod">
            <PlayCircle className="mr-2 h-4 w-4" />
            New Notebook
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {runs.map((run) => (
        <Link 
          key={run.id} 
          href={`/pod/${run.notebookId}?run=${run.id}`}
          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <StatusIcon status={run.status} />
            <div>
              <h3 className="font-medium">{run.notebookName}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>
                  {run.startedAt 
                    ? `Started ${formatDistanceToNow(new Date(run.startedAt))} ago` 
                    : 'Queued'}
                </span>
                {run.duration && (
                  <span className="ml-3 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {run.duration}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end mr-2">
              <Badge variant={
                run.status === 'completed' ? 'success' :
                run.status === 'running' ? 'default' :
                run.status === 'failed' ? 'destructive' : 
                'outline'
              }>
                {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">
                {run.gpuType} · {run.creditsUsed} credits
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function Runs({ 
  initialRuns = [], 
  userId = null, 
  filter = 'all',
  organizationId = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState(filter);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedNotebook, setSelectedNotebook] = useState(null);
  
  const handleFilterChange = (value) => {
    setCurrentFilter(value);
  };
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Function to handle selecting a run to view in NotebookRunner
  const handleSelectNotebook = (notebookId, notebookName) => {
    setSelectedNotebook({
      id: notebookId,
      name: notebookName,
      runs: initialRuns.filter(run => run.notebookId === notebookId)
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notebook Runs
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your notebook computation runs
          </p>
        </div>
        <Button asChild>
          <Link href="/pod">
            <PlayCircle className="mr-2 h-4 w-4" />
            New Notebook
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search runs..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select 
          defaultValue={currentFilter} 
          onValueChange={handleFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Runs</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="recent">
        <TabsList className="mb-4">
          <TabsTrigger value="recent">Recent Runs</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          {selectedNotebook && (
            <TabsTrigger value="notebook">Selected Notebook</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recent Notebook Runs</CardTitle>
              <CardDescription>
                View and manage your recent GPU computation runs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <RunsList 
                key={refreshKey}
                initialRuns={initialRuns} 
                userId={userId} 
                filter={currentFilter}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Runs</CardTitle>
              <CardDescription>
                Manage your scheduled and recurring notebook runs
              </CardDescription>
            </CardHeader>
            <CardContent className="py-10 flex flex-col items-center justify-center text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No scheduled runs</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                You haven't set up any scheduled notebook runs yet
              </p>
              <Button>Schedule a Run</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {selectedNotebook && (
          <TabsContent value="notebook">
            <NotebookRunner 
              notebookId={selectedNotebook.id}
              runs={selectedNotebook.runs}
              notebookName={selectedNotebook.name}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Display NotebookRunner for a specific notebook if selected */}
      {!selectedNotebook && initialRuns.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Notebook</h2>
          <NotebookRunner 
            notebookId={initialRuns[0].notebookId}
            runs={initialRuns.filter(run => run.notebookId === initialRuns[0].notebookId)}
            notebookName={initialRuns[0].notebookName}
          />
        </div>
      )}
    </div>
  );
}
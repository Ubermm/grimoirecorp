//@ts-nocheck
import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NotebookService } from '@/services/notebookService';

// Loading state component
function NotebooksLoading() {
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-lg text-muted-foreground">Loading notebooks...</span>
    </div>
  );
}

// Function to create status badge component
function NotebookStatusBadge({ status }: { status: string }) {
  const statusMap = {
    'pending': { color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200', label: 'Pending' },
    'running': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', label: 'Running' },
    'completed': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', label: 'Completed' },
    'failed': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', label: 'Failed' },
  };

  const { color, label } = statusMap[status as keyof typeof statusMap] || statusMap.pending;

  return (
    <Badge variant="outline" className={`${color}`}>
      {label}
    </Badge>
  );
}

// Component to display notebooks
function NotebookList({ notebooks }: { notebooks: any[] }) {
  if (notebooks.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-semibold">No notebooks yet</h3>
        <p className="text-muted-foreground">Create your first notebook to get started</p>
      </div>
    );
  }
  return(
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notebooks.map((notebook) => {
        // Ensure we have a unique key - using _id or id or create a fallback
        const uniqueKey = notebook._id || notebook.id || `notebook-${notebook.name}-${notebook.createdAt}`;
        
        return (
          <div key={uniqueKey} className="notebook-item">
            <Link href={`/pod/${notebook._id || notebook.id}`}>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-lg">{notebook.name}</CardTitle>
                <CardDescription>
                  Created {new Date(notebook.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <NotebookStatusBadge status={notebook.status} />
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(notebook.updatedAt).toLocaleString()}
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                Open Notebook
              </Button>
            </CardFooter>
          </Card>
        </Link>
        </div>
        );
      })}
    </div>
  );
}

export default async function PodsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Initialize service to fetch notebooks
  const notebookService = new NotebookService();
  
  // Fetch the user's notebooks
  const notebooks = await notebookService.getUserNotebooks(session.user.id);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notebooks</h1>
          <p className="text-muted-foreground">Create and manage your computational notebooks</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/pod/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Notebook
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<NotebooksLoading />}>
        <NotebookList notebooks={notebooks || []} />
      </Suspense>
    </div>
  );
}
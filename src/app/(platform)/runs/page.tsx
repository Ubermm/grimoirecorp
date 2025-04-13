//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Runs from '@/components/Runs';
import { NotebookService } from '@/services/notebookService';

export default async function RunsPage({ 
  searchParams 
}: { 
  searchParams: { filter?: string, organizationId?: string } 
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  const params = await searchParams;
  const filter = params.filter || 'all';
  const organizationId = params.organizationId;
  
  // Initialize service to fetch runs
  const notebookService = new NotebookService();
  
  // Fetch the initial runs
  let initialRuns = [];
  try {
    if (organizationId) {
      initialRuns = await notebookService.getOrganizationRuns(organizationId, session.user.id, filter);
    } else {
      initialRuns = await notebookService.getUserRuns(session.user.id, filter);
    }
  } catch (error) {
    console.error('Error fetching initial runs:', error);
    // We'll show an empty state and let client-side handle error display
  }
  
  return (
    <Runs 
      initialRuns={initialRuns} 
      userId={session.user.id} 
      filter={filter}
      organizationId={organizationId}
    />
  );
}
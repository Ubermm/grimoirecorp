//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Models from '@/components/Models';
import { ModelService } from '@/services/modelService';

export default async function ModelsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Initialize the model service to seed models (in development)
  // and ensure there's data to display
  const modelService = new ModelService();
  if (process.env.NODE_ENV === 'development') {
    await modelService.seedModels();
  }
  
  return <Models />;
}
//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import Org from '@/components/Org';

export default async function OrganizationsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  return <Org />;
}
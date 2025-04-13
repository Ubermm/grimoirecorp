import { cookies } from 'next/headers';
import { auth } from '@/app/(auth)/auth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }
  
  // Get sidebar collapsed state from cookies
  //const cookieStore = await cookies();
  const isCollapsed = false;

  return (
    <div className="flex h-screen">
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user}/>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarProvider>
      <Toaster position="top-center" />
    </div>
  );
}
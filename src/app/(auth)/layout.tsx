import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { Toaster } from 'sonner';

export default function RLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <NavBar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <Toaster position="top-center" />
    </div>
  );
}
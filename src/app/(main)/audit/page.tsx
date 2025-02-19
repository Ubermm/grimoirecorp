'use client';

import { useEffect, Suspense } from 'react';
import { toast, Toaster } from 'sonner';
import Audit from '@/components/Audit';

export default function HomePage() {
  useEffect(() => {
    const checkMobileView = () => {
      // Check if screen width is typical for mobile devices
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        toast.warning('This page is optimized for desktop view', {
          description: 'Some features may not display correctly on mobile devices.',
          duration: 5000,
          position: 'top-center'
        });
      }
    };

    // Check on client-side mount
    checkMobileView();

    // Add resize listener to check if user resizes browser
    window.addEventListener('resize', checkMobileView);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []); // Empty dependency array ensures this runs only on mount

  return (
    <>
    <Suspense>
      <Audit />
    </Suspense>
    </>
  );
}
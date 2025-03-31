'use client';

import { useEffect, Suspense, useState } from 'react';
import { toast, Toaster } from 'sonner';
import Audit from '@/components/Audit';

export default function HomePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    };

    checkMobileView(); // Initial check

    window.addEventListener('resize', checkMobileView);
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  if (isMobile) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        textAlign: 'center',
        fontSize: '1.5rem', 
        padding: '20px'
      }}>
        This page cannot be viewed on a mobile device. Please use a desktop.
      </div>
    );
  }

  return (
    <>
    <Suspense>
      <Audit />
    </Suspense>
    </>
  );
}
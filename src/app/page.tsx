//@ts-nocheck

import React, { Suspense } from 'react';
import HomePage from '@/components/HomePage';
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function homePage(){
  return(
    <>
    <NavBar/>
    <Suspense >
      <HomePage />
    </Suspense>
    <Footer/>
    </>
  );
}
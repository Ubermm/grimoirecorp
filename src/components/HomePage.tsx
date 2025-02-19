//@ts-nocheck
'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Search, ArrowRightLeft, AlertCircle, Users, Target, LineChart, Code2, Binary, Lock, BookOpen, FileCheck, Zap, Shield } from "lucide-react";
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Lattice from './Lattice';
import { AnimatePresence } from 'framer-motion';
import Head from 'next/head';

const UnderlinedWords = ({ words, activeIndex }) => {
  const containerRef = useRef(null);
  const [underlineProps, setUnderlineProps] = useState({ left: 0, width: 0 });
  const wordRefs = useRef([]);

  useEffect(() => {
    if (wordRefs.current[activeIndex] && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const wordRect = wordRefs.current[activeIndex].getBoundingClientRect();
      
      // Get the position relative to the container
      setUnderlineProps({
        left: wordRect.left - containerRect.left,
        width: wordRect.width,
      });
    }
  }, [activeIndex, words]);

  return (
    <div className="relative flex flex-col items-center" ref={containerRef}>
      <div className="flex items-center justify-center">
        <span className="mr-2">Grimoire Works with</span>
        <div className="relative inline-flex">
          {words.map((word, index) => (
            <span
              key={index}
              ref={el => wordRefs.current[index] = el}
              className={`mx-1 text-white ${index === activeIndex ? 'opacity-100' : 'opacity-0 absolute'}`}
              style={{
                position: index === activeIndex ? 'relative' : 'absolute',
                left: index === activeIndex ? 'auto' : '50%',
                transform: index === activeIndex ? 'none' : 'translateX(-50%)'
              }}
            >
              {word}
            </span>
          ))}
        </div>
      </div>
      {/* Animated underline */}
      <div
        className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-in-out"
        style={{
          left: `${underlineProps.left}px`,
          width: `${underlineProps.width}px`
        }}
      />
    </div>
  );
};
const HomePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if the 'from' search parameter is 'register'
    if (searchParams.get('from') === 'register') {
      window.history.pushState({}, '', '/');
      window.location.reload();
    }
  }, [searchParams]);

  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const terms = ["Formal Verification", "Logic Engines", "Proof Systems"];
  const painPoints = [
    "We had to recall thousands of units due to compliance gaps.",
    "Regulatory audits keep catching inconsistencies in our records.",
    "Supply chain issues disrupt our validation processes.",
    "We struggle to prove compliance with evolving FDA regulations."
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTermIndex((prevIndex) => (prevIndex + 1) % terms.length);
    }, 2500); // Change terms every 2.5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const words = ["cGMP Consultants", "Pharmaceutical Companies", "CROs"];

  // Cycle the active word using a timeout
  useEffect(() => {
    let timeoutId;
    const cycleWords = () => {
      setActiveWordIndex(prev => (prev + 1) % words.length);
      timeoutId = setTimeout(cycleWords, 2500); // Change active word every 2.5 seconds
    };
    timeoutId = setTimeout(cycleWords, 2500);
    return () => clearTimeout(timeoutId);
  }, []);

  const wordsMemo = useMemo(() => words, []);
  const stats = [
    { value: "3,000+", label: "FDA Warning Letters Analyzed" },
    { value: "50+", label: "Regulatory Citations Per Letter" },
    { value: "100%", label: "Title 21 CFR Sections Coverage" }
  ];
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      <div className="min-h-screen bg-black">
        <style jsx global>{`
        @media (max-width: 768px) {  /* Adjust for your breakpoint */
            .hide-on-mobile {
              display: none !important;
            }
          }
          @media (max-width: 640px) {
            html, body {
              overflow-x: hidden;
              width: 100%;
              position: relative;
            }
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
          }
          
          @media (max-width: 768px) {
            .text-3xl {
              font-size: 1.75rem;
            }
            .text-5xl {
              font-size: 2.25rem;
            }
            .text-4xl {
              font-size: 1.875rem;
            }
            .text-2xl {
              font-size: 1.5rem;
            }
            .grid {
              grid-template-columns: repeat(1, minmax(0, 1fr));
            }
            .flex-col-reverse-mobile {
              flex-direction: column-reverse;
            }
            .mb-10-mobile {
              margin-bottom: 2.5rem;
            }
          }
          
          @media (orientation: landscape) and (max-height: 500px) {
            .min-h-screen {
              min-height: 100%;
            }
          }
          
          * {
            -webkit-tap-highlight-color: transparent;
          }
          
          input, button {
            font-size: 16px;
          }
        `}</style>

        {/* Hero Section */}
        <section
          className="relative flex items-center justify-center min-h-[85vh] bg-black bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/Header.jpg')" }}
        >
          {/* Glassmorphic Overlay */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Content Container */}
          <div className="relative z-10 text-center px-4 sm:px-6 py-10 max-w-4xl mx-auto">
            {/* Headline */}
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-8 pt-10 sm:pt-20">
              Power FDA Compliance Audits With
              <div className="relative h-8 sm:h-10 md:h-12 mt-2 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={terms[currentTermIndex]}
                    className="absolute w-full text-purple-500"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {terms[currentTermIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </h1>
            
            {/* Secondary Headline */}
            <motion.h2
              className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6 pt-2 sm:pt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              We Help <span className="text-white/80">Audit Documentation</span> Not Just Store it 
            </motion.h2>

            {/* Compliance Description */}
            <motion.div
              className="text-sm sm:text-base md:text-lg text-white/70 mb-8 sm:mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Grimoire is a protocol validation layer, designed for manufacturers of FDA-regulated products, helping streamline clinical trial audits, automate CFR references, and provide direct access to relevant FDA warning letters and regulatory texts for better compliance and risk management.
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col xs:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Link href="/demo">
                <Button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base hover:bg-gray-200 w-full xs:w-auto">
                  Book a Demo
                </Button>
              </Link>
              <Link href="/audit">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base w-full xs:w-auto">
                  Build an Audit
                </Button>
              </Link>
            </motion.div>

            {/* Animated Underlined Entities */}
            <motion.div
              className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed pt-10 sm:pt-14"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <UnderlinedWords words={wordsMemo} activeIndex={activeWordIndex} />
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 sm:p-6 relative overflow-hidden">
          {/* Animated Graph Background */}
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path 
                d="M0,80 C20,40 40,60 60,30 C80,0 100,50 120,20" 
                stroke="red" 
                strokeWidth="1" 
                fill="transparent"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              />
            </svg>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center relative z-10"
          >
            Exhaustive Verification Made Possible
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-base sm:text-lg text-gray-400 mt-4 text-center max-w-2xl px-4 relative z-10"
          >
            We provide full validation over sampling, ensuring compliance with every aspect of Title 21 CFR.
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10 w-full max-w-5xl px-4 relative z-10">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="bg-gray-900 p-4 sm:p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-black-700 to-black-900" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black-800 to-transparent" />
                  <CardContent className="relative flex flex-col items-center justify-center p-0 sm:p-2">
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-3xl sm:text-4xl md:text-5xl font-bold"
                    >
                      {stat.value}
                    </motion.h2>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* See How Button */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mt-8 sm:mt-10 relative z-10"
          >
            <Button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold shadow-md hover:bg-gray-200 transition" onClick={() => window.location.href='/docs/quickstart'}>
              See How
            </Button>
          </motion.div>
        </div>

        {/* Pain Points Section */}
        <section className="relative bg-black text-white py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            {/* Section Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-center mb-12 sm:mb-20 tracking-tight text-purple-400">
              Does this sound familiar?
            </h2>
            
            {/* Pain Points Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
              {painPoints.map((point, index) => {
                // Split the text to highlight specific words in orange
                const parts = point.split(/\b(actions|questions|semantic|decisions)\b/);
                
                return (
                  <motion.div
                    key={index}
                    className="transform transition duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                  >
                    <div className="h-full relative">
                      {/* Top curved border */}
                      <div className="absolute top-0 left-0 w-full h-16 border-t border-l border-r border-gray-700 rounded-t-2xl" />
                      
                      {/* Content area */}
                      <div className="pt-16 px-4 sm:px-6 pb-6">
                        <p className="text-center text-base sm:text-lg font-medium">
                          {parts.map((part, i) => {
                            if (part === "actions" || part === "questions" || 
                                part === "semantic" || part === "decisions") {
                              return <span key={i} className="text-orange-400">{part}</span>;
                            }
                            return part;
                          })}
                        </p>
                        
                        {/* Solved indicator */}
                        <div className="text-center mt-6">
                          <span className="text-green-400 text-sm">Solved </span>
                          <span className="text-green-400">✓</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div> 
          </div>        
        </section>

        {/* Ensure Readiness Section */}
        <section className="bg-black text-white py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 flex flex-col lg:flex-row items-center lg:items-start">
            
            {/* Left Section: CTA Text & Button */}
            <div className="lg:w-1/2 text-left mb-8 lg:mb-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Ensure Your FDA Inspection Readiness
              </h2>
              <p className="text-gray-300 mb-6">
                Stay ahead of regulatory requirements and avoid delays. Make sure your clinical trial meets FDA compliance standards.
              </p>
              <Link href="/audit">
                <Button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-300 w-full sm:w-auto">
                  Check FDA Compliance
                </Button>
              </Link>
            </div>

            {/* Right Section: Study Quote */}
            <div className="lg:w-1/2 lg:pl-12 border-t lg:border-t-0 lg:border-l border-gray-700 pt-8 lg:pt-0">
              <blockquote className="italic text-gray-400">
                "Out of 8,863 clinical trials required to report results, only 
                <span className="text-white font-semibold"> 39.5% </span> 
                met the 1-year deadline, while 
                <span className="text-white font-semibold"> 68.8% </span> 
                reported at any time. Compliance ranged from 
                <span className="text-white font-semibold"> 66.0% </span> 
                for on-time delayed reporting requests to 
                <span className="text-white font-semibold"> 99.1% </span> 
                for document submission with results."
              </blockquote>
              <div className="text-gray-500 text-sm mt-2">— JAMA Intern Med, 2021</div>
            </div>
            
          </div>
        </section>

        {/* Identify Gaps Section */}
        <section className="bg-black text-white py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 flex flex-col-reverse lg:flex-row items-center lg:items-start">
            
            {/* Right Section: Study Quote */}
            <div className="lg:w-1/2 mb-8 lg:mb-0 lg:pr-12 border-t lg:border-t-0 lg:border-r border-gray-700 pt-8 lg:pt-0">
              <blockquote className="italic text-gray-400">
                "Clinical data inconsistencies and compliance blind spots can delay trials and regulatory approvals. Analyzing similar FDA warning letters helps uncover adjacent violations, mitigating risks before they become costly roadblocks."
              </blockquote>
              <div className="text-gray-500 text-sm mt-2">— Oracle Health Sciences Survey, 2018</div>
            </div>
            
            {/* Left Section: CTA Text & Button */}
            <div className="lg:w-1/2 text-left lg:pl-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Proactively Identify Compliance Gaps
              </h2>
              <p className="text-gray-300 mb-6">
                Discover regulatory blind spots before they become violations. Leverage insights from past FDA warning letters to strengthen your compliance strategy.
              </p>
              <Link href="/analytics">
                <Button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-300 w-full sm:w-auto">
                  Analyze FDA Violations
                </Button>
              </Link>
            </div>
            
          </div>
        </section>

        {/* Logical Precision Section */}
        <section className="bg-gradient-to-r from-black via-gray-800 to-black py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12"
            >
              {/* Left Column: Engaging Content */}
              <div className="lg:w-1/2">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  Unleash Logical Precision in Compliance
                </h2>
                <p className="text-gray-300 mt-4 text-base sm:text-lg">
                  Our platform harnesses the power of Prolog—a cutting-edge logic programming language—to transform your regulatory compliance. We augment your existing workflows by offering exhaustive verification, intelligent analysis, and actionable insights.
                </p>
                <ul className="list-disc ml-6 mt-6 text-gray-300 space-y-2 text-sm sm:text-base">
                  <li>
                    <strong>Prolog-Powered Verification:</strong> Leverage declarative logic for comprehensive, automated validation that empowers your team to focus on strategic decisions.
                  </li>
                  <li>
                    <strong>Find Similar Warning Letters:</strong> Detect patterns and trends in FDA warning letters before they become issues.
                  </li>
                  <li>
                    <strong>Deep CFR Code Analysis:</strong> Dissect complex regulatory texts to ensure every code is accounted for.
                  </li>
                </ul>
                <Link href="/audit">
                  <Button className="mt-6 bg-white text-black px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold hover:bg-gray-200 w-full sm:w-auto">
                    Discover How
                  </Button>
                </Link>
              </div>
              
              {/* Right Column: Visual Illustration */}
              <div className="lg:w-1/2 mt-8 lg:mt-0 hide-on-mobile">
                <Lattice/>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Help Shape Section */}
        <section
          className="relative bg-cover bg-center text-white py-12 sm:py-16"
          style={{ backgroundImage: "url('/DHeader.jpg')" }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Help Shape the Future of Clinical Compliance
            </h2>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
              We're rolling out new features in beta and collaborating with trial managers 
              and manufacturers to develop comprehensive tools that address real-world challenges.
            </p>
            <Link href="/contact">
              <Button className="bg-white text-black px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold hover:bg-black hover:text-white w-full sm:w-auto">
                Contact Us
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
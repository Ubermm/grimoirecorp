'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, FileText, Search, ListChecks } from "lucide-react";
import Image from 'next/image';

const Section = ({ title, children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    {children}
  </div>
);

const LetterComparisonPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Warning Letter Comparison</h1>
            <p className="text-xl text-gray-400">
              Analyze FDA warning letters, identify patterns, and compare violations.
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Overview Section */}
            <Card className="bg-black border border-white/10">
              <CardContent className="p-6 space-y-6 text-white/80">
                <Section title="Overview">
                  <p className="text-gray-300">
                    The Warning Letter Comparison feature enables detailed analysis between different FDA warning letters, helping identify patterns, common violations, and regulatory trends.
                  </p>
                  <Alert className="bg-purple-500/10 border-purple-500/20 mt-4">
                    <Info className="h-4 w-4 text-purple-500" />
                    <AlertDescription className="text-white/80">
                      Compare warning letters using direct URLs or pasted content. Our system analyzes CFR violations, corrective actions, and regulatory contexts.
                    </AlertDescription>
                  </Alert>
                </Section>

              </CardContent>
            </Card>

            {/* Comparison Types */}
            <Section title="Comparison Types">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">Direct Comparison</h4>
                  </div>
                  <p className="text-sm text-gray-400">Compare any two warning letters by providing their URLs.</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">Violation Set Analysis</h4>
                  </div>
                  <p className="text-sm text-gray-400">Find letters with similar or superset violations.</p>
                </div>
              </div>
            </Section>

            {/* Steps to Use */}
            <Section title="Using the Comparison Tool">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">1. Select Method</h4>
                  </div>
                  <p className="text-sm text-gray-400">Choose direct URL input or content paste.</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">2. Input Letters</h4>
                  </div>
                  <p className="text-sm text-gray-400">Provide URLs or paste letter content.</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-5 w-5 text-purple-400" />
                    <h4 className="font-medium text-white">3. Review Analysis</h4>
                  </div>
                  <p className="text-sm text-gray-400">View side-by-side comparison results.</p>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterComparisonPage;
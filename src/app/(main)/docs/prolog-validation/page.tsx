'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, FileCheck, Binary, Code2, CheckCircle2, Workflow } from "lucide-react";
import Image from 'next/image';

const Section = ({ title, children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    <h3 className="text-xl font-semibold text-white">{title}</h3>
    {children}
  </div>
);

const PrologValidationPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Prolog Validation System</h1>
            <p className="text-xl text-gray-400">
              Comprehensive validation framework powered by logical programming
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Overview Card */}
            <Card className="bg-black border border-white/10">
              <CardContent className="p-6 space-y-6 text-white/80">
                <Section title="System Overview">
                  <p className="text-gray-300">
                    Our Prolog validation system leverages formal logic programming to provide exhaustive verification of CFR requirements. Through automated rule generation and logical analysis, we ensure complete coverage of Title 21 CFR regulations.
                  </p>
                  
                  <Alert className="bg-purple-500/10 border-purple-500/20 mt-4">
                    <Info className="h-4 w-4 text-purple-500" />
                    <AlertDescription className="text-white/80">
                      The system automatically transforms CFR requirements into Prolog rules, enabling comprehensive validation of compliance measures and generating detailed visual flowcharts.
                    </AlertDescription>
                  </Alert>

                </Section>

                {/* Validation Process */}
                <Section title="Validation Process">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileCheck className="h-5 w-5 text-purple-400" />
                        <h4 className="font-medium text-white">1. CFR Selection</h4>
                      </div>
                      <p className="text-sm text-gray-400">Choose relevant Title 21 CFR codes for validation</p>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Binary className="h-5 w-5 text-purple-400" />
                        <h4 className="font-medium text-white">2. Rule Generation</h4>
                      </div>
                      <p className="text-sm text-gray-400">Automatic creation of Prolog rules from requirements</p>
                    </div>
                    
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-purple-400" />
                        <h4 className="font-medium text-white">3. Validation</h4>
                      </div>
                      <p className="text-sm text-gray-400">Comprehensive verification against generated rules</p>
                    </div>
                  </div>
                </Section>

                {/* Key Features */}
                <Section title="Key Features">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Automated Rule Generation</h4>
                      <ul className="list-disc pl-6 text-gray-400 space-y-1">
                        <li>Direct integration with eCFR API</li>
                        <li>Intelligent requirement parsing</li>
                        <li>Context-aware rule creation</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Validation Framework</h4>
                      <ul className="list-disc pl-6 text-gray-400 space-y-1">
                        <li>Complete requirement coverage</li>
                        <li>Real-time validation feedback</li>
                        <li>Gap analysis and reporting</li>
                      </ul>
                    </div>
                  </div>
                </Section>

                {/* Usage Guide */}
                <Section title="Using the System">
                  <ol className="space-y-4">
                    <li className="flex items-start gap-4">
                      <div className="rounded-full bg-purple-500/10 w-6 h-6 flex items-center justify-center text-sm text-purple-400 mt-1">1</div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Select CFR Requirements</h4>
                        <p className="text-gray-400">Choose the relevant Title 21 CFR codes for your validation needs</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="rounded-full bg-purple-500/10 w-6 h-6 flex items-center justify-center text-sm text-purple-400 mt-1">2</div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Complete Validation Forms</h4>
                        <p className="text-gray-400">Fill out the generated validation questionnaires for each requirement</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="rounded-full bg-purple-500/10 w-6 h-6 flex items-center justify-center text-sm text-purple-400 mt-1">3</div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Review Results</h4>
                        <p className="text-gray-400">Analyze validation outcomes and generated compliance reports</p>
                      </div>
                    </li>
                  </ol>
                </Section>

                {/* Best Practices */}
                <Section title="Best Practices">
                  <ul className="list-disc pl-6 text-gray-400 space-y-2">
                    <li>Provide detailed context for each validation requirement</li>
                    <li>Review all generated validation questions thoroughly</li>
                    <li>Document validation results for audit trails</li>
                    <li>Use flowcharts for process visualization and improvement</li>
                    <li>Maintain comprehensive validation records</li>
                  </ul>
                </Section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrologValidationPage;
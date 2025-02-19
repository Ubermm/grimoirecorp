'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileCheck, Shield, Target, AlertCircle, ArrowRight, CheckCircle2, Book, Search, LineChart, FileText } from "lucide-react";
import Link from 'next/link';

const ProcessStep = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center p-6 bg-gray-900/50 rounded-lg border border-gray-800"
  >
    <div className="rounded-full bg-purple-500/10 p-3 mb-4">
      <Icon className="h-6 w-6 text-purple-400" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-gray-400 text-center">{description}</p>
  </motion.div>
);

const FeatureSection = ({ title, description, steps, icon: Icon }) => (
  <Card className="bg-black border border-gray-800 mb-8">
    <CardHeader className="flex flex-row items-center gap-4">
      <div className="rounded-full bg-purple-500/10 p-3">
        <Icon className="h-6 w-6 text-purple-400" />
      </div>
      <div>
        <CardTitle className="text-2xl text-white">{title}</CardTitle>
        <p className="text-gray-400 mt-2">{description}</p>
      </div>
    </CardHeader>
    <CardContent className="space-y-6 text-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-full bg-purple-500/10 w-6 h-6 flex items-center justify-center text-sm text-purple-400">
                {index + 1}
              </div>
              <h4 className="text-white font-medium">{step.title}</h4>
            </div>
            <p className="text-gray-400 text-sm">{step.description}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const QuickStartPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const validationSteps = [
    { title: "Select CFR Codes", description: "Choose relevant Title 21 CFR codes from our comprehensive database" },
    { title: "Complete Forms", description: "Fill out structured validation forms for each selected code" },
    { title: "Review & Submit", description: "Review automated validation results and generate compliance reports" }
  ];

  const warningLetterSteps = [
    { title: "Upload Letters", description: "Input FDA warning letters for analysis via URL or text" },
    { title: "Pattern Analysis", description: "Review AI-detected patterns and violation relationships" },
    { title: "Risk Assessment", description: "Get insights on potential compliance risks and recommendations" }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Hero Section */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              {...fadeIn}
            >
              Begin Your Compliance Journey
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-400"
              {...fadeIn}
              transition={{ delay: 0.2 }}
            >
              Comprehensive validation and warning letter analysis to eliminate regulatory hurdles
            </motion.p>
          </div>

          {/* Mission Statement */}
          <motion.div
            className="mb-12"
            {...fadeIn}
            transition={{ delay: 0.3 }}
          >
            <Alert className="bg-purple-500/10 border-purple-500/20">
              <AlertCircle className="h-4 w-4 text-purple-500" />
              <AlertDescription className="text-white/80">
                Our team has dedicated years to developing robust validation frameworks and advanced warning letter analysis tools that ensure 100% coverage of Title 21 CFR requirements, dramatically reducing regulatory delays and compliance gaps.
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Feature Sections */}
          <FeatureSection
            title="Prolog-Powered Validation"
            description="Complete CFR code validation with exhaustive verification"
            steps={validationSteps}
            icon={Shield}
          />

          <FeatureSection
            title="Warning Letter Analysis"
            description="AI-powered analysis of FDA warning letters to identify patterns and risks"
            steps={warningLetterSteps}
            icon={Search}
          />

          {/* Additional Features */}
          <Card className="bg-black border border-gray-800 mb-12">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Key Platform Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    Validation Features
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-300">
                    <li>Exhaustive verification of each CFR requirement</li>
                    <li>Automated logical analysis of compliance data</li>
                    <li>Real-time validation feedback</li>
                    <li>Complete audit trail generation</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-purple-400" />
                    Analysis Features
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-300">
                    <li>Pattern detection across warning letters</li>
                    <li>Risk prediction and violation relationships</li>
                    <li>Historical trend analysis</li>
                    <li>Automated compliance recommendations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <motion.div 
            className="text-center space-y-4"
            {...fadeIn}
            transition={{ delay: 0.7 }}
          >
            <Link href="/audit">
              <Button 
                className="bg-white text-black px-8 py-4 text-lg hover:bg-black hover:text-white transition-colors duration-200 border border-white"
              >
                Start Your First Audit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-gray-400 mt-4">
              Begin with either validation or warning letter analysis—our platform guides you through every step
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickStartPage;
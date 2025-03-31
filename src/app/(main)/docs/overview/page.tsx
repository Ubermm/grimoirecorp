'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Database, Cpu, FileOutput, ArrowRight } from "lucide-react";
import Link from 'next/link';
import MermaidChart from '@/components/MermaidChart';

const FeatureCard = ({ icon: Icon, title, description, items }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="rounded-full bg-purple-500/10 p-2">
        <Icon className="h-5 w-5 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="text-gray-400 mb-4">{description}</p>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-gray-300">
          <ArrowRight className="h-5 w-5 text-purple-400 mt-1 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const PlatformSection = ({ title, children }) => (
  <section className="mb-12">
    <h2 className="text-2xl font-semibold text-white mb-6">{title}</h2>
    {children}
  </section>
);

const OverviewPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Platform Overview
            </h1>
            <p className="text-xl text-gray-400">
              Comprehensive FDA compliance management powered by AI and formal verification
            </p>
          </motion.div>

          <Alert className="bg-purple-500/10 border-purple-500/20 mb-12">
            <Info className="h-5 w-5 text-purple-500" />
            <AlertDescription className="text-white/80">
              Our platform combines advanced AI analysis with Prolog-based formal verification to provide actionable compliance insights and validated regulatory adherence.
            </AlertDescription>
          </Alert>

          <PlatformSection title="Data Flow Visualization">
            <Card className="bg-black border border-gray-800 mb-8">
              <CardContent className="p-6">
                <div className="rounded-lg border border-gray-800 p-4 bg-black">
                  <div className="mb-4 text-gray-400">
                    Platform data processing workflow from input sources to deliverables
                  </div>
                  <MermaidChart chart={`flowchart TD
    subgraph Input ["Data Sources"]
        A[FDA Warning Letters] 
        B[Title 21 CFR Database]
        C[Compliance Documents]
    end

    subgraph Processing ["Core Processing"]
        D[AI Analysis Engine]
        E[Prolog Validation Engine]
        F[Pattern Detection]
    end

    subgraph Output ["Deliverables"]
        G[Violation Analysis]
        H[Compliance Reports]
        I[Validation Results]
        J[Risk Predictions]
    end

    A --> D
    B --> D & E
    C --> D & E
    D --> F
    F --> G & J
    E --> H & I

    style Input fill:#2d1b4d,stroke:#433773
    style Processing fill:#1a1a1a,stroke:#333
    style Output fill:#2d1b4d,stroke:#433773`}/>
                </div>
              </CardContent>
            </Card>
          </PlatformSection>

          <PlatformSection title="Core Features">
            <div className="grid md:grid-cols-2 gap-6">
              <FeatureCard
                icon={Database}
                title="Warning Letter Analysis"
                description="AI-powered analysis of FDA warning letters to identify patterns and risks"
                items={[
                  "Pattern detection across similar violations",
                  "Statistical analysis of violation types",
                  "Industry-wide trend identification",
                  "Risk prediction based on historical data"
                ]}
              />
              
              <FeatureCard
                icon={Cpu}
                title="Prolog Validation"
                description="Formal verification system for comprehensive compliance validation"
                items={[
                  "Automated validation against CFR requirements",
                  "Logical flowchart generation",
                  "Structured validation reporting",
                  "Complete coverage verification"
                ]}
              />
            </div>
          </PlatformSection>

          <PlatformSection title="Platform Capabilities">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-black border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Data Sources</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-400">
                  <ul className="space-y-2">
                    <li>• FDA Warning Letter Database</li>
                    <li>• Title 21 CFR Documentation</li>
                    <li>• FDA Guidance Documents</li>
                    <li>• Historical Compliance Data</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-black border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Processing</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-400">
                  <ul className="space-y-2">
                    <li>• AI-Powered Analysis</li>
                    <li>• Prolog Logic Engine</li>
                    <li>• Pattern Recognition</li>
                    <li>• Risk Assessment</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-black border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Outputs</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-400">
                  <ul className="space-y-2">
                    <li>• Compliance Reports</li>
                    <li>• Validation Results</li>
                    <li>• Risk Predictions</li>
                    <li>• Actionable Insights</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </PlatformSection>

          <PlatformSection title="Getting Started">
            <Card className="bg-black border border-gray-800">
              <CardContent className="p-6">
                <ol className="space-y-4 text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/10 text-purple-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</span>
                    <span>Access the analytics page and select "New Analysis"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/10 text-purple-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</span>
                    <span>Choose between Warning Letter Analysis or Compliance Validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/10 text-purple-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</span>
                    <span>Upload relevant documentation or select CFR codes for validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-purple-500/10 text-purple-400 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</span>
                    <span>Review generated insights and validation results</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </PlatformSection>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;
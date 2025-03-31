'use client';
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { motion } from "framer-motion";
import Image from 'next/image';

const SimilarViolationsPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.h1 
            className="text-4xl font-bold text-white mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Similar Violation Analysis
          </motion.h1>

          <div className="space-y-8">
            <Card className="bg-black border border-white/10">
              <CardContent className="p-6 space-y-6 text-white/80">
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <h2 className="text-2xl font-semibold text-white mb-4">Understanding Risk Prediction</h2>
                  <p>Our system uses CFR 21 violation codes to identify similar cases and predict potential risks. The analysis is based on the principle that warning letters with overlapping violation codes are likely to share similar compliance challenges.</p>
                </motion.section>

                <Alert className="bg-purple-500/10 border-purple-500/20">
                  <Info className="h-4 w-4 text-purple-500" />
                  <AlertDescription className="text-white/80">
                    The system analyzes the specific CFR codes cited in warning letters to create a violation pattern map, helping identify companies with similar compliance challenges.
                  </AlertDescription>
                </Alert>
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
                  <div className="space-y-4">
                    {["Violation Code Analysis", "Pattern Matching", "Risk Assessment"].map((title, index) => (
                      <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.2 }}>
                        <h3 className="text-xl font-semibold text-white mb-2">{index + 1}. {title}</h3>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                          {title === "Violation Code Analysis" && [
                            "Extracts CFR 21 codes from warning letters",
                            "Creates a violation pattern fingerprint",
                            "Maps relationships between different violations",
                            "Identifies common violation groupings"
                          ]}
                          {title === "Pattern Matching" && [
                            "Finds warning letters with matching violation codes",
                            "Identifies cases with superset violations (additional related violations)",
                            "Calculates similarity scores between cases",
                            "Ranks results by relevance"
                          ]}
                          {title === "Risk Assessment" && [
                            "Analyzes violation patterns in similar cases",
                            "Identifies potential additional risk areas",
                            "Provides statistical insights on violation correlations",
                            "Highlights commonly co-occurring violations"
                          ]}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>

                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <h2 className="text-2xl font-semibold text-white mb-4">Using the Feature</h2>
                  <ol className="list-decimal pl-6 space-y-2">
                    {["Start a new analysis from the dashboard", "Select 'Find Similar' analysis type", "Input warning letter URL or paste content", "Review matched cases and statistical summary", "Explore detailed violation patterns"].map((step, index) => (
                      <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.2 }}>{step}</motion.li>
                    ))}
                  </ol>
                </motion.section>

                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <h2 className="text-2xl font-semibold text-white mb-4">Understanding Results</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    {["Similar cases with matching violation codes", "Statistical summary of violation patterns", "Match scores and violation counts", "Links to related warning letters"].map((item, index) => (
                      <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.2 }}>{item}</motion.li>
                    ))}
                  </ul>
                </motion.section>

                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    {["Review all matched violations carefully", "Pay special attention to superset violations", "Use insights for preventive measures", "Consider historical patterns in your industry"].map((tip, index) => (
                      <motion.li key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.2 }}>{tip}</motion.li>
                    ))}
                  </ul>
                </motion.section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimilarViolationsPage;

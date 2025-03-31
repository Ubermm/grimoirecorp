"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Landmark } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-4 text-white">
        {/* Main Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold text-center mb-8 tracking-tight"
        >
          Consolidating Prolog & Compliance to Slash Delays in Clinical Trials
        </motion.h1>

        {/* Introductory Paragraph */}
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto text-center text-gray-300 text-lg mb-12"
        >
          We are a small, agile team on a mission to dramatically reduce the outrageously high rate of delays in clinical trials and the manufacturing of FDA-regulated products. By merging the power of Prolog-based formal methods with cutting-edge compliance technology, we’re transforming regulatory processes into a seamless, verifiable journey.
        </motion.p>

        {/* Vision & Approach Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white/5 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <Brain className="w-8 h-8 text-white mr-3" />
              Our Vision
            </h2>
            <p className="text-gray-400">
              We envision a world where regulatory compliance isn’t a bottleneck, but a catalyst for innovation. Our mission is to eradicate delays that hinder clinical progress and product approvals—ensuring life-saving therapies reach patients faster.
            </p>
          </div>

          <div className="bg-white/5 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <Landmark className="w-8 h-8 text-white mr-3" />
              Our Approach
            </h2>
            <p className="text-gray-400">
              By leveraging formal methods and Prolog-based reasoning, we consolidate complex regulatory requirements into precise, verifiable models. Our rapid, iterative process enables continuous improvement—transforming compliance into an automated, reliable component of your workflow.
            </p>
          </div>
        </div>

        {/* Call-to-Action Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-neutral-900/70 rounded-lg p-8 text-center mb-16"
        >
          <h3 className="text-2xl font-bold mb-4">
            Join Us in Revolutionizing Compliance
          </h3>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            As we iterate rapidly on our innovative platform, we’re actively seeking strategic partners and collaborators. Together, we can eliminate delays in clinical trials and FDA-regulated manufacturing—paving the way for faster approvals and better patient outcomes.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/contact">
              <Button className="bg-gray-800 hover:bg-gray-700">
                Collaborate with Us
              </Button>
            </Link>
            <a href="https://www.linkedin.com/company/grimoire-corp/?viewAsMember=true" target="_blank" rel="noopener noreferrer">
              <Button className="bg-gray-800 hover:bg-gray-700">
                Follow Us on LinkedIn
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;

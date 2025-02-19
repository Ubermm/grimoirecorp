// Route: /app/docs/ai-best-practices/page.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, BookOpen } from "lucide-react";

const AIBestPracticesPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">CFR Title 21 AI Consultation Best Practices</h1>

          <div className="space-y-8">
            <Card className="bg-black border border-white/10">
              <CardContent className="p-6 space-y-6 text-white/80">
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
                  <p>The AI Consultation system provides real-time interpretation of CFR Title 21 regulations through advanced language models. This system is designed to help compliance officers quickly understand regulatory requirements and their practical implications.</p>
                </section>

                <Alert className="bg-purple-500/10 border-purple-500/20">
                  <Info className="h-4 w-4 text-purple-500" />
                  <AlertDescription className="text-white/80">
                    While the AI provides valuable insights, it should be used as a supplementary tool alongside human expertise and official FDA guidance. All AI interpretations should be verified against official sources.
                  </AlertDescription>
                </Alert>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Key Features</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">1. Regulatory Interpretation</h3>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Plain language explanations of complex regulations</li>
                        <li>Context-aware interpretations</li>
                        <li>Cross-reference identification</li>
                        <li>Historical context and precedents</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">2. Query Capabilities</h3>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Natural language question processing</li>
                        <li>Specific regulation lookups</li>
                        <li>Related requirement suggestions</li>
                        <li>Compliance scenario analysis</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">3. Documentation Support</h3>
                      <ul className="list-disc pl-6 space-y-2 mt-2">
                        <li>Citation generation</li>
                        <li>Requirement summaries</li>
                        <li>Compliance checklist creation</li>
                        <li>Export capabilities for documentation</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Effective Query Techniques</h2>
                  <ol className="list-decimal pl-6 space-y-2">
                    <li>Be specific about the regulation section you're inquiring about</li>
                    <li>Provide context about your specific use case</li>
                    <li>Ask for practical examples when needed</li>
                    <li>Request clarification on technical terms</li>
                    <li>Verify cross-references and related requirements</li>
                    <li>Document important interpretations for future reference</li>
                  </ol>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Understanding AI Responses</h2>
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Response Components</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Regulatory interpretation</li>
                      <li>Relevant citations</li>
                      <li>Related requirements</li>
                      <li>Practical implications</li>
                    </ul>

                    <h3 className="text-xl font-semibold text-white mb-2">Verification Steps</h3>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Cross-reference with official CFR documentation</li>
                      <li>Review cited regulations in context</li>
                      <li>Consult with subject matter experts</li>
                      <li>Document verification process</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Best Practices</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Always verify AI interpretations against official sources</li>
                    <li>Use specific, well-structured queries</li>
                    <li>Document both questions and answers</li>
                    <li>Maintain context in follow-up questions</li>
                    <li>Regular review of saved interpretations</li>
                    <li>Share important insights with team members</li>
                    <li>Keep track of regulation updates that might affect previous interpretations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Limitations and Considerations</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>AI interpretations are supplementary guidance only</li>
                    <li>Recent regulatory changes may not be reflected immediately</li>
                    <li>Complex scenarios may require human expert consultation</li>
                    <li>Always prioritize official FDA guidance</li>
                    <li>Document any discrepancies found in AI interpretations</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBestPracticesPage;
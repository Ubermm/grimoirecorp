// Route: /app/terms/page.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
          <Card className="bg-black border border-white/10">
            <CardContent className="p-6 space-y-6 text-white/80">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                <p>By accessing and using Grimoire.corp's FDA compliance analysis platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                <p>Grimoire.corp provides tools for analyzing FDA warning letters, comparing regulatory documents, and validating compliance measures. The Service includes similarity analysis, warning letter comparison, and Prolog-based validation features.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. Use License</h2>
                <p>We grant you a limited, non-exclusive, non-transferable license to use the Service for your internal business purposes, subject to these Terms.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. User Responsibilities</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are responsible for maintaining the confidentiality of your account.</li>
                  <li>You must not misuse the Service or interfere with its operation.</li>
                  <li>You agree to use the Service in compliance with all applicable laws and regulations.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Data Analysis and Results</h2>
                <p>While we strive for accuracy, the Service's analysis results are provided "as is" and should not be considered legal advice. Users should verify all results and consult qualified professionals for regulatory compliance decisions.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>
                <p>All content, features, and functionality of the Service are owned by Grimoire.corp and are protected by international copyright, trademark, and other intellectual property laws.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
                <p>Grimoire.corp shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the Service.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Changes to Terms</h2>
                <p>We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Information</h2>
                <p>For questions about these Terms, please contact us at support@grimoire.corp</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
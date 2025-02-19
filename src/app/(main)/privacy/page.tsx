// Route: /app/privacy/page.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <Card className="bg-black border border-white/10">
            <CardContent className="p-6 space-y-6 text-white/80">
              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">1. Information Collection</h2>
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Warning letter content and URLs submitted for analysis</li>
                  <li>CFR subsection references and corrective action contexts</li>
                  <li>Account information and usage data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Information</h2>
                <p>We use the collected information to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Provide and improve our compliance analysis services</li>
                  <li>Generate analysis reports and validate compliance measures</li>
                  <li>Maintain and enhance the security of our platform</li>
                  <li>Communicate with you about service updates and features</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
                <p>We implement appropriate technical and organizational measures to protect your information, including:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and monitoring</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">4. Data Retention</h2>
                <p>We retain your information for as long as necessary to provide our services and comply with legal obligations. You can request deletion of your data by contacting our support team.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">5. Information Sharing</h2>
                <p>We do not sell your information to third parties. We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                  <li>Business partners with your explicit consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to certain data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">7. Updates to Privacy Policy</h2>
                <p>We may update this Privacy Policy periodically. We will notify you of any material changes via email or through our platform.</p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
                <p>For privacy-related inquiries, please contact us at support@grimoire.corp</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
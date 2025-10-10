import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-slate-300 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing or using AI Bug Hunter & Code Analyzer ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p className="mb-4">
                AI Bug Hunter provides automated code analysis, bug detection, and security vulnerability scanning services powered by artificial intelligence. The Service is offered on a subscription basis with multiple tier options.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. User Accounts</h2>
              <div className="space-y-3">
                <p><strong className="text-purple-400">3.1 Registration:</strong> You must provide accurate, complete, and current information during registration.</p>
                <p><strong className="text-purple-400">3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
                <p><strong className="text-purple-400">3.3 Account Termination:</strong> We reserve the right to suspend or terminate accounts that violate these Terms.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Subscription Plans and Billing</h2>
              <div className="space-y-3">
                <p><strong className="text-purple-400">4.1 Subscription Tiers:</strong> We offer Free, Basic, Pro, and Enterprise subscription tiers with varying features and analysis limits.</p>
                <p><strong className="text-purple-400">4.2 Payment:</strong> Paid subscriptions are billed monthly or annually in advance. All fees are non-refundable except as required by law.</p>
                <p><strong className="text-purple-400">4.3 Auto-Renewal:</strong> Subscriptions automatically renew unless cancelled before the renewal date.</p>
                <p><strong className="text-purple-400">4.4 Price Changes:</strong> We reserve the right to modify subscription prices with 30 days notice to existing subscribers.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use Policy</h2>
              <p className="mb-3">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Abuse, harass, or harm other users of the Service</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Resell, redistribute, or sublicense the Service without authorization</li>
                <li>Exceed API rate limits or usage quotas for your subscription tier</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property Rights</h2>
              <div className="space-y-3">
                <p><strong className="text-purple-400">6.1 Your Content:</strong> You retain all rights to the code you upload for analysis. By using the Service, you grant us a limited license to process and analyze your code.</p>
                <p><strong className="text-purple-400">6.2 Our Property:</strong> The Service, including all software, algorithms, design, and content, is owned by AI Bug Hunter and protected by copyright and intellectual property laws.</p>
                <p><strong className="text-purple-400">6.3 Analysis Results:</strong> Analysis results and reports generated by our AI are provided to you under a non-exclusive license for your internal business use.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Privacy and Security</h2>
              <p className="mb-4">
                We take data security seriously. Your code and analysis results are processed securely and stored with encryption. For detailed information about how we handle your data, please review our <Link to="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Disclaimers and Limitations of Liability</h2>
              <div className="space-y-3">
                <p><strong className="text-purple-400">8.1 "AS IS" Service:</strong> The Service is provided "as is" without warranties of any kind, either express or implied.</p>
                <p><strong className="text-purple-400">8.2 No Guarantee:</strong> While we strive for accuracy, we do not guarantee that our analysis will detect all bugs, vulnerabilities, or issues in your code.</p>
                <p><strong className="text-purple-400">8.3 Limitation of Liability:</strong> To the maximum extent permitted by law, AI Bug Hunter shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.</p>
                <p><strong className="text-purple-400">8.4 Maximum Liability:</strong> Our total liability to you for any claims related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless AI Bug Hunter, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Termination</h2>
              <p className="mb-4">
                Either party may terminate your account at any time. Upon termination, your right to access the Service will immediately cease. We may retain certain information as required by law or for legitimate business purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which AI Bug Hunter operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <p><strong className="text-purple-400">Email:</strong> legal@aibughunter.com</p>
                <p><strong className="text-purple-400">Support:</strong> <Link to="/support" className="text-purple-400 hover:text-purple-300 underline">Contact Support</Link></p>
              </div>
            </section>

            <section className="pt-6 border-t border-slate-700">
              <p className="text-sm text-slate-500">
                By using AI Bug Hunter & Code Analyzer, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register">
            <Button className="bg-purple-600 hover:bg-purple-700">Create Account</Button>
          </Link>
          <Link to="/privacy">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">View Privacy Policy</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

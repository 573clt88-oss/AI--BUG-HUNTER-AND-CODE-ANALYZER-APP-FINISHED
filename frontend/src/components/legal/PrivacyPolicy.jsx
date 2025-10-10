import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-slate-300 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
              <p className="mb-4">
                AI Bug Hunter & Code Analyzer ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our code analysis service.
              </p>
              <p className="mb-4">
                This policy complies with GDPR (General Data Protection Regulation), CCPA (California Consumer Privacy Act), and other applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-purple-400 mb-3 mt-4">1.1 Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Account Information:</strong> Email address, name, password (encrypted)</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store full credit card details)</li>
                <li><strong>Code Content:</strong> Source code files you upload for analysis</li>
                <li><strong>Support Communications:</strong> Messages you send to our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-400 mb-3 mt-4">1.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Usage Data:</strong> Analysis history, feature usage, subscription tier</li>
                <li><strong>Technical Data:</strong> IP address, browser type, device information, operating system</li>
                <li><strong>Cookies:</strong> Session cookies for authentication and functionality</li>
                <li><strong>Log Data:</strong> Server logs including timestamps and API requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-3">We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Delivery:</strong> To provide code analysis and bug detection services</li>
                <li><strong>Account Management:</strong> To create and manage your account</li>
                <li><strong>Billing:</strong> To process payments and manage subscriptions</li>
                <li><strong>AI Model Training:</strong> To improve our analysis algorithms (anonymized data only)</li>
                <li><strong>Communication:</strong> To send service updates, security alerts, and support responses</li>
                <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our Terms</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Storage and Security</h2>
              <div className="space-y-3">
                <p><strong className="text-purple-400">3.1 Storage Location:</strong> Your data is stored on secure cloud servers with MongoDB encryption at rest.</p>
                <p><strong className="text-purple-400">3.2 Encryption:</strong> Data is encrypted in transit using TLS/SSL and at rest using industry-standard encryption.</p>
                <p><strong className="text-purple-400">3.3 Access Controls:</strong> Strict access controls limit who can view your data. Only authorized personnel have access.</p>
                <p><strong className="text-purple-400">3.4 Retention Period:</strong> We retain your data for as long as your account is active, plus 90 days after account deletion for backup purposes.</p>
                <p><strong className="text-purple-400">3.5 Code Storage:</strong> Uploaded code is stored temporarily for analysis and deleted after processing unless you save results.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Sharing and Disclosure</h2>
              <p className="mb-3">We DO NOT sell your personal information. We may share your data only in these limited circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Third-party services that help us operate (e.g., Stripe for payments, MailChimp for emails, cloud hosting providers)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets (you will be notified)</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>
              <p className="mb-3">We integrate with the following third-party services:</p>
              <div className="bg-slate-900/50 p-4 rounded-lg space-y-2">
                <p><strong className="text-purple-400">Stripe:</strong> Payment processing (see <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Stripe Privacy Policy</a>)</p>
                <p><strong className="text-purple-400">MailChimp:</strong> Email communications (see <a href="https://mailchimp.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">MailChimp Privacy Policy</a>)</p>
                <p><strong className="text-purple-400">AI/ML Services:</strong> Code analysis powered by AI models (data is anonymized)</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Privacy Rights</h2>
              <p className="mb-3">Depending on your location, you have the following rights:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (opt-out link in every email)</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing where applicable</li>
                <li><strong>Lodge Complaint:</strong> File a complaint with your data protection authority</li>
              </ul>
              <p className="mt-4 text-sm bg-purple-900/30 p-4 rounded-lg">
                To exercise these rights, contact us at <strong>privacy@aibughunter.com</strong>. We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
              <div className="space-y-3">
                <p><strong className="text-purple-400">Essential Cookies:</strong> Required for authentication and core functionality (cannot be disabled)</p>
                <p><strong className="text-purple-400">Analytics Cookies:</strong> Help us understand how you use our service (can be disabled in browser)</p>
                <p><strong className="text-purple-400">No Third-Party Advertising:</strong> We do not use advertising cookies or track you across other websites</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
              <p>
                Our Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. International Data Transfers</h2>
              <p className="mb-4">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure adequate safeguards are in place, including Standard Contractual Clauses (SCCs) for GDPR compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or prominent notice on our website. The "Last Updated" date will be revised accordingly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data:
              </p>
              <div className="bg-slate-900/50 p-4 rounded-lg space-y-2">
                <p><strong className="text-purple-400">Privacy Team:</strong> privacy@aibughunter.com</p>
                <p><strong className="text-purple-400">Support:</strong> <Link to="/support" className="text-purple-400 hover:text-purple-300 underline">Contact Support</Link></p>
                <p><strong className="text-purple-400">Legal:</strong> legal@aibughunter.com</p>
              </div>
            </section>

            <section className="pt-6 border-t border-slate-700">
              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">GDPR & CCPA Compliance</h3>
                <p className="text-sm">
                  This Privacy Policy is designed to comply with the EU General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). If you are a resident of the EU, UK, or California, additional rights may apply to you.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/terms">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">View Terms of Service</Button>
          </Link>
          <Link to="/support">
            <Button className="bg-purple-600 hover:bg-purple-700">Contact Support</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

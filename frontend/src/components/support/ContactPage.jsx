import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "We've received your message and will respond within 24 hours.",
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Contact & Support</h1>
          <p className="text-slate-400">Get help with AI Bug Hunter & Code Analyzer</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Send us a message</CardTitle>
              <p className="text-slate-400">We typically respond within 24 hours</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="What can we help you with?"
                    required
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-slate-300">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your issue or question in detail..."
                    required
                    rows={6}
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support Information */}
          <div className="space-y-6">
            {/* Direct Contact */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-2">
                <p><strong className="text-purple-400">General Support:</strong> support@aibughunter.com</p>
                <p><strong className="text-purple-400">Technical Issues:</strong> tech@aibughunter.com</p>
                <p><strong className="text-purple-400">Billing:</strong> billing@aibughunter.com</p>
                <p><strong className="text-purple-400">Privacy:</strong> privacy@aibughunter.com</p>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Common Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-3">
                <div className="border-b border-slate-700 pb-3">
                  <h4 className="font-semibold text-white mb-1">How do I upgrade my subscription?</h4>
                  <p className="text-sm">Visit the <Link to="/subscription" className="text-purple-400 hover:text-purple-300 underline">Subscription page</Link> and select your desired plan.</p>
                </div>
                <div className="border-b border-slate-700 pb-3">
                  <h4 className="font-semibold text-white mb-1">What languages are supported?</h4>
                  <p className="text-sm">We support 18+ programming languages including Python, JavaScript, Java, C++, and more. Check the dashboard for the full list.</p>
                </div>
                <div className="border-b border-slate-700 pb-3">
                  <h4 className="font-semibold text-white mb-1">Is my code secure?</h4>
                  <p className="text-sm">Yes! All code is encrypted in transit and at rest. Read our <Link to="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link> for details.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Can I cancel anytime?</h4>
                  <p className="text-sm">Yes, you can cancel your subscription at any time. No long-term commitments required.</p>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-2">
                <p><strong className="text-purple-400">Email Support:</strong> 24/7 (response within 24 hours)</p>
                <p><strong className="text-purple-400">Critical Issues:</strong> Priority response for Pro/Enterprise users</p>
                <p className="text-sm text-slate-400 mt-4">Enterprise customers have access to dedicated support channels and faster response times.</p>
              </CardContent>
            </Card>

            {/* Social/Resources */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-xl flex items-center">
                  <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Additional Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-2">
                <p className="flex items-center">
                  <span className="text-purple-400 mr-2">📚</span>
                  Documentation (Coming Soon)
                </p>
                <p className="flex items-center">
                  <span className="text-purple-400 mr-2">🎥</span>
                  Video Tutorials (Coming Soon)
                </p>
                <p className="flex items-center">
                  <span className="text-purple-400 mr-2">💬</span>
                  Community Forum (Coming Soon)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex justify-center gap-6 text-slate-400">
            <Link to="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/" className="hover:text-purple-400 transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

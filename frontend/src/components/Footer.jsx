import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900/80 border-t border-slate-800 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI Bug Hunter
            </h3>
            <p className="text-slate-400 text-sm">
              Advanced AI-powered code analysis and bug detection for modern development teams.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Product</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Home</Link></li>
              <li><Link to="/subscription" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Pricing</Link></li>
              <li><Link to="/analyzer" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Code Analyzer</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Dashboard</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/support" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Contact Support</Link></li>
              <li><a href="mailto:support@aibughunter.com" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">support@aibughunter.com</a></li>
              <li><span className="text-slate-400 text-sm">Documentation (Coming Soon)</span></li>
              <li><span className="text-slate-400 text-sm">API Reference (Coming Soon)</span></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Privacy Policy</Link></li>
              <li><a href="/SECURITY.md" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">Security</a></li>
              <li><a href="/LICENSE" className="text-slate-400 hover:text-purple-400 transition-colors text-sm">License</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-500 text-sm">
            © {currentYear} AI Bug Hunter. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-slate-500 text-sm flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              GDPR & CCPA Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

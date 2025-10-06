import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Check, Crown, Zap, Shield, Users, BarChart3, 
  Clock, Calendar, CreditCard, AlertTriangle, Star
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SubscriptionPage() {
  const { user, updateUserSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: 0,
      interval: 'month',
      description: 'Perfect for getting started',
      features: [
        '10 code analyses per month',
        'Basic error detection',
        'Public code analysis only',
        'Community support',
        'Basic reporting'
      ],
      limitations: [
        'Limited to 10 analyses/month',
        'No advanced security scanning',
        'No real-time collaboration',
        'Basic AI insights only'
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Tier',
      price: 19,
      interval: 'month',
      description: 'For professional developers and teams',
      features: [
        'Unlimited code analyses',
        'Advanced security scanning',
        'Private repository support',
        'Real-time code fixing',
        'Priority support',
        'Detailed analytics & insights',
        'Team collaboration tools',
        'Custom analysis rules',
        'API access',
        'Export capabilities',
        'Advanced AI recommendations',
        'Performance monitoring'
      ],
      limitations: [],
      popular: true,
      badge: 'Most Popular'
    }
  ];

  const getCurrentPlan = () => {
    return plans.find(plan => plan.id === user?.subscription?.tier) || plans[0];
  };

  const handleUpgrade = async (planId) => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    
    try {
      const userEmail = user?.email || 'guest@example.com';
      const formData = new FormData();
      formData.append('tier', planId);
      formData.append('user_email', userEmail);
      
      const response = await axios.post(`${BACKEND_URL}/api/subscription/checkout`, formData);
      
      if (response.data.payment_link) {
        // Redirect to Stripe payment link
        window.open(response.data.payment_link, '_blank');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      setError('Failed to start upgrade process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/subscription/cancel`);
      updateUserSubscription({ status: 'cancelled' });
      alert('Subscription cancelled successfully. You will retain Pro access until the end of your billing period.');
    } catch (error) {
      console.error('Cancellation error:', error);
      setError('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeftInTrial = () => {
    if (!user?.subscription?.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(user.subscription.trialEndsAt);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const currentPlan = getCurrentPlan();
  const isProUser = user?.subscription?.tier === 'pro';
  const isTrialing = user?.subscription?.status === 'trialing';
  const daysLeftInTrial = getDaysLeftInTrial();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4" data-testid="subscription-title">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Unlock the full power of AI-driven code analysis with advanced security scanning, 
            real-time debugging, and unlimited analyses.
          </p>
        </div>

        {/* Current Status Alert */}
        {isTrialing && (
          <Alert className="mb-8 bg-purple-900/50 border-purple-500">
            <Crown className="h-4 w-4" />
            <AlertDescription className="text-purple-200">
              <strong>Free Trial Active:</strong> You have {daysLeftInTrial} days left in your Pro trial. 
              Upgrade now to continue enjoying unlimited analyses and premium features.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-8 bg-red-900/50 border-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Plan Info */}
        <Card className="mb-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${isProUser ? 'bg-purple-600' : 'bg-slate-700'}`}>
                  {isProUser ? <Crown className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-slate-400" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{currentPlan.name}</h3>
                  <p className="text-slate-400">
                    {isProUser ? '$19/month' : 'Free'} • 
                    {isTrialing ? ` Trial (${daysLeftInTrial} days left)` : 
                     user?.subscription?.status === 'cancelled' ? ' Cancelled (ends at period end)' : 
                     ' Active'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {user?.subscription?.usage && (
                  <div className="text-right">
                    <div className="text-sm text-slate-400">This month</div>
                    <div className="text-lg font-semibold text-white">
                      {user.subscription.usage.used}
                      {user.subscription.usage.limit === -1 ? ' analyses' : ` / ${user.subscription.usage.limit}`}
                    </div>
                  </div>
                )}
                
                {isProUser && user?.subscription?.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    Cancel Plan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-500 ring-2 ring-purple-500' 
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}
            >
              {plan.popular && (
                <div className="absolute -right-10 top-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-12 py-2 rotate-45 text-sm font-semibold">
                  {plan.badge}
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  plan.id === 'pro' ? 'bg-purple-600' : 'bg-slate-700'
                }`}>
                  {plan.id === 'pro' ? (
                    <Crown className="w-8 h-8 text-white" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                <CardDescription className="text-slate-300">{plan.description}</CardDescription>
                
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-slate-400">/{plan.interval}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6">
                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-white mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-300 mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                            <span className="text-slate-400">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-4">
                    {user?.subscription?.tier === plan.id ? (
                      <Button 
                        disabled 
                        className="w-full bg-slate-600 text-slate-400 cursor-not-allowed"
                        data-testid={`current-plan-${plan.id}`}
                      >
                        Current Plan
                      </Button>
                    ) : plan.id === 'free' ? (
                      <Button 
                        disabled={isProUser}
                        variant="outline"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {isProUser ? 'Downgrade (Contact Support)' : 'Current Plan'}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading}
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-white text-purple-900 hover:bg-slate-100' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                        data-testid={`upgrade-${plan.id}`}
                      >
                        {loading ? 'Processing...' : 
                         isTrialing ? 'Continue with Pro' :
                         'Upgrade to Pro'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2">Can I change plans anytime?</h4>
                <p className="text-slate-400">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">What happens to my data?</h4>
                <p className="text-slate-400">All your analysis history and data are preserved when changing plans.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">Is there a free trial?</h4>
                <p className="text-slate-400">Yes! All new accounts get a 7-day free trial of Pro features.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">How secure is my code?</h4>
                <p className="text-slate-400">Your code is analyzed securely and never stored permanently. We use enterprise-grade encryption.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="text-center mt-8">
          <p className="text-slate-400">
            Have questions? <a href="mailto:support@aibughunter.com" className="text-purple-400 hover:text-purple-300">Contact our support team</a>
          </p>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, Shield, Zap, Clock, TrendingUp, FileText, 
  Bug, AlertTriangle, CheckCircle, Crown, Calendar,
  BarChart3, Activity, Users, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserDashboard() {
  const { user, updateUserSubscription } = useAuth();
  const [stats, setStats] = useState({
    totalAnalyses: 45,
    criticalIssues: 12,
    fixedIssues: 8,
    codeQuality: 87,
    securityScore: 92
  });

  const [recentAnalyses, setRecentAnalyses] = useState([
    {
      id: '1',
      fileName: 'auth.js',
      language: 'JavaScript',
      timestamp: '2 hours ago',
      status: 'completed',
      issues: 3,
      severity: 'medium'
    },
    {
      id: '2', 
      fileName: 'database.py',
      language: 'Python',
      timestamp: '1 day ago',
      status: 'completed',
      issues: 7,
      severity: 'high'
    },
    {
      id: '3',
      fileName: 'api.java',
      language: 'Java', 
      timestamp: '2 days ago',
      status: 'completed',
      issues: 1,
      severity: 'low'
    }
  ]);

  const getUsagePercentage = () => {
    if (!user?.subscription?.usage) return 0;
    const { used, limit } = user.subscription.usage;
    if (limit === -1) return 0; // Unlimited
    return Math.round((used / limit) * 100);
  };

  const getDaysLeftInTrial = () => {
    if (!user?.subscription?.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(user.subscription.trialEndsAt);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isProUser = user?.subscription?.tier === 'pro';
  const isTrialing = user?.subscription?.status === 'trialing';
  const usagePercentage = getUsagePercentage();
  const daysLeftInTrial = getDaysLeftInTrial();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="dashboard-title">
              Welcome back, {user?.displayName}
            </h1>
            <p className="text-slate-300">
              Monitor your code analysis activity and insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge 
              variant={isProUser ? "default" : "secondary"}
              className={isProUser ? "bg-purple-600" : "bg-slate-600"}
            >
              {isProUser ? (
                <>
                  <Crown className="w-4 h-4 mr-1" />
                  Pro Plan
                </>
              ) : (
                'Free Plan'
              )}
            </Badge>
            <Link to="/analyzer">
              <Button className="bg-purple-600 hover:bg-purple-700" data-testid="analyze-code-btn">
                <Code className="w-4 h-4 mr-2" />
                Analyze Code
              </Button>
            </Link>
          </div>
        </div>

        {/* Trial/Usage Alert */}
        {isTrialing && (
          <Card className="mb-8 border-purple-500 bg-purple-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-white">Free Trial Active</h3>
                    <p className="text-sm text-slate-300">
                      {daysLeftInTrial} days remaining • Unlimited analyses during trial
                    </p>
                  </div>
                </div>
                <Link to="/subscription">
                  <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Limit Warning for Free Users */}
        {!isProUser && !isTrialing && usagePercentage > 80 && (
          <Card className="mb-8 border-yellow-500 bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h3 className="font-semibold text-white">Usage Limit Warning</h3>
                    <p className="text-sm text-slate-300">
                      You've used {user?.subscription?.usage?.used} of {user?.subscription?.usage?.limit} monthly analyses
                    </p>
                  </div>
                </div>
                <Link to="/subscription">
                  <Button variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Analyses</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="total-analyses">{stats.totalAnalyses}</div>
              <div className="text-xs text-green-400">+12% from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Critical Issues</CardTitle>
              <Bug className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="critical-issues">{stats.criticalIssues}</div>
              <div className="text-xs text-red-400">-3 from last week</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Issues Fixed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="fixed-issues">{stats.fixedIssues}</div>
              <div className="text-xs text-green-400">+5 this week</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Code Quality</CardTitle>
              <Target className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="code-quality">{stats.codeQuality}%</div>
              <Progress value={stats.codeQuality} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Security Score</CardTitle>
              <Shield className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="security-score">{stats.securityScore}%</div>
              <Progress value={stats.securityScore} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Analyses */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Recent Analyses</CardTitle>
                  <Link to="/history">
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="recent-analyses">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                          <Code className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{analysis.fileName}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Badge variant="outline" className="border-slate-600 text-slate-400">
                              {analysis.language}
                            </Badge>
                            <span>{analysis.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(analysis.severity)}>
                          {analysis.issues} issue{analysis.issues !== 1 ? 's' : ''}
                        </Badge>
                        <Link to={`/results/${analysis.id}`}>
                          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-300">Analyses Used</span>
                      <span className="text-white">
                        {user?.subscription?.usage?.used || 0}
                        {user?.subscription?.usage?.limit === -1 
                          ? ' (Unlimited)' 
                          : ` / ${user?.subscription?.usage?.limit || 10}`
                        }
                      </span>
                    </div>
                    {user?.subscription?.usage?.limit !== -1 && (
                      <Progress value={usagePercentage} className="h-2" />
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-slate-600">
                    <Link to="/subscription" className="block">
                      <Button 
                        className={`w-full ${isProUser ? 'bg-slate-700 hover:bg-slate-600' : 'bg-purple-600 hover:bg-purple-700'}`}
                        data-testid="manage-subscription-btn"
                      >
                        {isProUser ? 'Manage Subscription' : 'Upgrade to Pro'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link to="/analyzer" className="block">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Code className="w-4 h-4 mr-2" />
                      New Analysis
                    </Button>
                  </Link>
                  <Link to="/analyzer/realtime" className="block">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Zap className="w-4 h-4 mr-2" />
                      Real-time Debugger
                    </Button>
                  </Link>
                  <Link to="/history" className="block">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Clock className="w-4 h-4 mr-2" />
                      Analysis History
                    </Button>
                  </Link>
                  <Link to="/analytics" className="block">
                    <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Code Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Tips & Insights */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-700">
                    <p className="text-blue-300">
                      💡 Your code quality has improved by 12% this month! Keep up the good work.
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
                    <p className="text-yellow-300">
                      ⚠️ Consider reviewing your authentication patterns - 3 security issues found.
                    </p>
                  </div>
                  <div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
                    <p className="text-green-300">
                      ✅ Great job on performance optimization! 5 issues resolved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
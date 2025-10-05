import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, DollarSign, BarChart3, Activity, 
  Shield, Bug, Zap, Crown, AlertTriangle,
  TrendingUp, Calendar, FileText, Mail
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 2847,
    activeSubscriptions: 342,
    monthlyRevenue: 6498,
    totalAnalyses: 15632,
    analysesThisMonth: 3421,
    conversionRate: 12.1
  });

  const [recentUsers, setRecentUsers] = useState([
    {
      id: '1',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      subscription: 'pro',
      status: 'active',
      joinDate: '2024-01-15',
      lastActive: '2 hours ago'
    },
    {
      id: '2', 
      email: 'jane.smith@company.com',
      displayName: 'Jane Smith',
      subscription: 'free',
      status: 'trialing',
      joinDate: '2024-01-14',
      lastActive: '1 day ago'
    },
    {
      id: '3',
      email: 'dev.team@startup.io',
      displayName: 'Dev Team',
      subscription: 'pro',
      status: 'active',
      joinDate: '2024-01-12',
      lastActive: '30 minutes ago'
    }
  ]);

  const [systemHealth, setSystemHealth] = useState({
    apiResponseTime: 245,
    uptime: 99.98,
    activeAnalyses: 23,
    queuedAnalyses: 5,
    errorRate: 0.02
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'trialing': return 'bg-blue-600';
      case 'cancelled': return 'bg-red-600';
      case 'past_due': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getSubscriptionBadge = (subscription) => {
    return subscription === 'pro' ? (
      <Badge className="bg-purple-600">
        <Crown className="w-3 h-3 mr-1" />
        Pro
      </Badge>
    ) : (
      <Badge variant="secondary">Free</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="admin-dashboard-title">
              Admin Dashboard
            </h1>
            <p className="text-slate-300">
              Monitor platform performance, user activity, and business metrics
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-red-600">
              <Shield className="w-4 h-4 mr-1" />
              Admin Access
            </Badge>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Mail className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="total-users">{stats.totalUsers}</div>
              <div className="text-xs text-green-400">+12% from last month</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Active Subscriptions</CardTitle>
              <Crown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="active-subscriptions">{stats.activeSubscriptions}</div>
              <div className="text-xs text-green-400">+8% this month</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="monthly-revenue">${stats.monthlyRevenue}</div>
              <div className="text-xs text-green-400">+15% growth</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="total-analyses">{stats.totalAnalyses}</div>
              <div className="text-xs text-cyan-400">{stats.analysesThisMonth} this month</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="conversion-rate">{stats.conversionRate}%</div>
              <div className="text-xs text-orange-400">Trial to Pro</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">System Health</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="system-uptime">{systemHealth.uptime}%</div>
              <div className="text-xs text-emerald-400">Uptime</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="users" data-testid="users-tab">Users</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
            <TabsTrigger value="system" data-testid="system-tab">System</TabsTrigger>
            <TabsTrigger value="support" data-testid="support-tab">Support</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Users */}
              <div className="lg:col-span-2">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Recent Users</CardTitle>
                      <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        View All Users
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4" data-testid="recent-users">
                      {recentUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{user.displayName}</h4>
                              <p className="text-sm text-slate-400">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getSubscriptionBadge(user.subscription)}
                                <Badge className={getStatusColor(user.status)}>
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-400">Joined</div>
                            <div className="text-sm text-white">{new Date(user.joinDate).toLocaleDateString()}</div>
                            <div className="text-xs text-slate-500">Active {user.lastActive}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User Actions */}
              <div className="space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email Campaign
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                        <FileText className="w-4 h-4 mr-2" />
                        Export User Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Shield className="w-4 h-4 mr-2" />
                        Security Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">User Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Free Users</span>
                        <span className="text-white">{stats.totalUsers - stats.activeSubscriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pro Users</span>
                        <span className="text-white">{stats.activeSubscriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trial Users</span>
                        <span className="text-white">156</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Churned This Month</span>
                        <span className="text-red-400">23</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                      <p>Revenue chart would go here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <Activity className="w-16 h-16 mx-auto mb-4" />
                      <p>Usage analytics chart would go here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">API Response Time</span>
                      <span className="text-white">{systemHealth.apiResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">System Uptime</span>
                      <span className="text-green-400">{systemHealth.uptime}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Active Analyses</span>
                      <span className="text-blue-400">{systemHealth.activeAnalyses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Queued Analyses</span>
                      <span className="text-yellow-400">{systemHealth.queuedAnalyses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Error Rate</span>
                      <span className="text-red-400">{systemHealth.errorRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 text-sm font-medium">High API Usage</span>
                      </div>
                      <p className="text-xs text-yellow-300">API usage is 85% of monthly limit</p>
                    </div>
                    
                    <div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">System Healthy</span>
                      </div>
                      <p className="text-xs text-green-300">All systems operational</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Support Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Mail className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Open Tickets</h3>
                  <p className="text-slate-400">All support requests have been resolved</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
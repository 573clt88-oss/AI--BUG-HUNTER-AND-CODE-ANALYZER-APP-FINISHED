import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  Users, DollarSign, BarChart3, Activity, 
  Shield, Crown, TrendingUp, Calendar, Mail
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminAnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, trendsRes] = await Promise.all([
        axios.get(`${API}/analytics/admin/overview`),
        axios.get(`${API}/analytics/admin/trends`)
      ]);
      
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error('Admin analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading admin analytics...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Failed to Load Analytics</h3>
              <p className="text-slate-400 mb-4">Please try again later</p>
              <Button onClick={fetchAnalytics} className="bg-purple-600 hover:bg-purple-700">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Prepare subscription breakdown chart data
  const subscriptionData = Object.entries(overview.subscription_breakdown || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    users: value
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Analytics Dashboard
            </h1>
            <p className="text-slate-300">
              Platform-wide metrics and performance insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-red-600">
              <Shield className="w-4 h-4 mr-1" />
              Admin Access
            </Badge>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={fetchAnalytics}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overview.total_users}</div>
              <div className="text-xs text-green-400 mt-1">
                +{overview.new_users_last_30_days} in last 30 days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Active Subscriptions</CardTitle>
              <Crown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overview.active_subscriptions}</div>
              <div className="text-xs text-purple-400 mt-1">
                Paid users
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">${overview.monthly_revenue.toLocaleString()}</div>
              <div className="text-xs text-green-400 mt-1">
                From subscriptions
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overview.conversion_rate}%</div>
              <div className="text-xs text-orange-400 mt-1">
                Free to paid
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Analyses</CardTitle>
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{overview.total_analyses.toLocaleString()}</div>
              <div className="text-xs text-cyan-400 mt-1">
                {overview.analyses_this_month} this month
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Avg. analyses/user</p>
                  <p className="text-white font-bold">
                    {overview.total_users > 0 ? Math.round(overview.total_analyses / overview.total_users) : 0}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Avg. revenue/user</p>
                  <p className="text-white font-bold">
                    ${overview.total_users > 0 ? (overview.monthly_revenue / overview.total_users).toFixed(2) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Trend */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-cyan-400" />
                    Analysis Activity (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trends?.trends && trends.trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trends.trends}>
                        <defs>
                          <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          style={{ fontSize: '11px' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="analyses" 
                          stroke="#8b5cf6" 
                          fillOpacity={1} 
                          fill="url(#colorAnalyses)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <p>No trend data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Growth */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    User Growth (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trends?.trends && trends.trends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          style={{ fontSize: '11px' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="new_users" 
                          stroke="#06b6d4" 
                          strokeWidth={2} 
                          dot={{ fill: '#06b6d4' }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                      <p>No user growth data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Breakdown */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-purple-400" />
                    Subscription Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subscriptionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, users }) => `${name}: ${users}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="users"
                      >
                        {subscriptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Breakdown Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subscriptionData.map((tier, index) => (
                      <div key={tier.name} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-white font-medium">{tier.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{tier.users}</div>
                          <div className="text-xs text-slate-400">
                            {overview.total_users > 0 
                              ? ((tier.users / overview.total_users) * 100).toFixed(1) 
                              : 0}% of users
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">${overview.monthly_revenue.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm mb-1">Paid Users</p>
                      <p className="text-2xl font-bold text-white">{overview.active_subscriptions}</p>
                    </div>
                    <div className="p-4 bg-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm mb-1">ARPU</p>
                      <p className="text-2xl font-bold text-white">
                        ${overview.active_subscriptions > 0 
                          ? (overview.monthly_revenue / overview.active_subscriptions).toFixed(2)
                          : 0}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-700 rounded-lg">
                    <h4 className="text-white font-semibold mb-4">Key Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Conversion Rate</span>
                        <span className="text-white font-medium">{overview.conversion_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">MRR Per User</span>
                        <span className="text-white font-medium">
                          ${overview.total_users > 0 
                            ? (overview.monthly_revenue / overview.total_users).toFixed(2)
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Total Users</span>
                        <span className="text-white font-medium">{overview.total_users}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

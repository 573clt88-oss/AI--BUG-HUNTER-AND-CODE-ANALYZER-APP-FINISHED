import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import Footer from "@/components/Footer";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard({ supportedLanguages, analysisTypes }) {
  const [recentAnalyses, setRecentAnalyses] = useState([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    criticalIssues: 0,
    avgSecurityScore: 0,
    avgQualityScore: 0
  });

  useEffect(() => {
    fetchRecentAnalyses();
  }, []);

  const fetchRecentAnalyses = async () => {
    try {
      const response = await axios.get(`${API}/analysis/history`);
      const recent = response.data.slice(0, 5);
      setRecentAnalyses(recent);
      
      // Calculate basic stats (you could enhance this with dedicated endpoints)
      setStats({
        totalAnalyses: response.data.length,
        criticalIssues: 0, // This would come from analysis results
        avgSecurityScore: 85, // This would be calculated from actual data
        avgQualityScore: 78
      });
    } catch (e) {
      console.error("Failed to fetch recent analyses:", e);
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="dashboard-title">
              AI Bug Hunter & Code Analyzer
            </h1>
            <p className="text-slate-300 text-lg">
              Detect bugs, security vulnerabilities, and code quality issues with AI-powered analysis
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/history">
              <Button variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700" data-testid="view-history-btn">
                View History
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Total Analyses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="total-analyses">{stats.totalAnalyses}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Critical Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400" data-testid="critical-issues">{stats.criticalIssues}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Avg Security Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400" data-testid="security-score">{stats.avgSecurityScore}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Avg Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400" data-testid="quality-score">{stats.avgQualityScore}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* File Upload Analysis */}
          <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload & Analyze Files
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload your code files for comprehensive AI-powered analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Supported Languages:</h4>
                  <div className="flex flex-wrap gap-2">
                    {supportedLanguages.slice(0, 6).map((lang) => (
                      <Badge key={lang.type} variant="secondary" className="bg-slate-700 text-slate-300">
                        {lang.name}
                      </Badge>
                    ))}
                    {supportedLanguages.length > 6 && (
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        +{supportedLanguages.length - 6} more
                      </Badge>
                    )}
                  </div>
                </div>
                <Link to="/analyze-file" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" data-testid="upload-file-btn">
                    Upload Files
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Text Analysis */}
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Paste & Analyze Code
              </CardTitle>
              <CardDescription className="text-slate-400">
                Paste your code directly for quick analysis and bug detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Analysis Types:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisTypes.slice(0, 3).map((type) => (
                      <Badge key={type.id} variant="outline" className="border-slate-600 text-slate-300">
                        {type.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Link to="/analyze-text" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" data-testid="analyze-text-btn">
                    Analyze Code
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Analyses */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Analyses</CardTitle>
            <CardDescription className="text-slate-400">
              Your latest code analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 mb-4">No analyses yet</p>
                <div className="flex gap-4 justify-center">
                  <Link to="/analyze-file">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      Upload First File
                    </Button>
                  </Link>
                  <Link to="/simple-analyzer">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      Analyze Code
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4" data-testid="recent-analyses">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-white">{analysis.file_name}</h4>
                        <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                          {analysis.file_type}
                        </Badge>
                        <Badge variant="outline" className="border-slate-500 text-slate-400">
                          {analysis.analysis_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {new Date(analysis.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={analysis.status === 'completed' ? 'default' : 'destructive'}
                        className={analysis.status === 'completed' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {analysis.status}
                      </Badge>
                      <Link to={`/results/${analysis.result_id}`}>
                        <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-600">
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-slate-400">
            Powered by AI • Secure Analysis • Enterprise Ready
          </p>
        </div>
      </div>
    </div>
  );
}
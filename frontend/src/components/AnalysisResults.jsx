import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AnalysisResults() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisResult();
  }, [resultId]);

  const fetchAnalysisResult = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API}/analysis/result/${resultId}`);
      setResult(response.data);
    } catch (error) {
      console.error("Failed to fetch analysis result:", error);
      toast({
        title: "Error",
        description: "Failed to load analysis result",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-600';
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      bug: '🐛',
      security: '🔒',
      performance: '⚡',
      style: '🎨',
      error: '❌',
      analysis: '🔍'
    };
    return icons[type] || '📝';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Result Not Found</h2>
          <p className="text-slate-300 mb-6">The analysis result you're looking for doesn't exist or has been removed.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                View History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const criticalIssues = result.issues.filter(issue => issue.severity?.toLowerCase() === 'critical');
  const highIssues = result.issues.filter(issue => issue.severity?.toLowerCase() === 'high');
  const otherIssues = result.issues.filter(issue => !['critical', 'high'].includes(issue.severity?.toLowerCase()));

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="results-title">
              Analysis Results
            </h1>
            <p className="text-slate-300">
              Detailed analysis report for your code
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/history">
              <Button variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700" data-testid="back-to-history-btn">
                Back to History
              </Button>
            </Link>
            <Link to="/">
              <Button className="bg-purple-600 hover:bg-purple-700" data-testid="new-analysis-btn">
                New Analysis
              </Button>
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Analysis Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-white capitalize" data-testid="analysis-type">
                {result.analysis_type}
              </div>
              <div className="text-sm text-slate-400">
                {result.file_type.toUpperCase()}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Security Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(result.security_score)}`} data-testid="security-score">
                {result.security_score}/100
              </div>
              <Progress value={result.security_score} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(result.code_quality_score)}`} data-testid="quality-score">
                {result.code_quality_score}/100
              </div>
              <Progress value={result.code_quality_score} className="mt-2 h-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-200 text-sm">Issues Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white" data-testid="total-issues">
                {result.issues.length}
              </div>
              <div className="text-sm text-slate-400">
                {criticalIssues.length} Critical • {highIssues.length} High
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 leading-relaxed" data-testid="summary">
              {result.summary}
            </p>
            <div className="mt-4 text-sm text-slate-400">
              Analyzed by: {result.ai_model_used} • {new Date(result.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <Tabs defaultValue="issues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="issues" className="data-[state=active]:bg-slate-700" data-testid="issues-tab">
              Issues & Bugs ({result.issues.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="data-[state=active]:bg-slate-700" data-testid="suggestions-tab">
              Suggestions ({result.suggestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-6">
            {/* Critical Issues */}
            {criticalIssues.length > 0 && (
              <Card className="bg-red-900/20 border-red-600">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Critical Issues ({criticalIssues.length})
                  </CardTitle>
                  <CardDescription className="text-red-300">
                    These issues require immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="critical-issues">
                    {criticalIssues.map((issue, index) => (
                      <div key={index} className="p-4 bg-slate-800 rounded-lg border border-red-600/50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getTypeIcon(issue.type)}</span>
                            <div>
                              <Badge className={`${getSeverityColor(issue.severity)} text-white mb-1`}>
                                {issue.severity}
                              </Badge>
                              {issue.line && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400 ml-2">
                                  Line {issue.line}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <h4 className="font-semibold text-white mb-2">{issue.description}</h4>
                        {issue.suggestion && (
                          <p className="text-slate-300 text-sm bg-slate-700 p-3 rounded border-l-4 border-blue-500">
                            <span className="font-medium text-blue-400">Suggestion:</span> {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* High Priority Issues */}
            {highIssues.length > 0 && (
              <Card className="bg-yellow-900/20 border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-yellow-400">High Priority Issues ({highIssues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="high-issues">
                    {highIssues.map((issue, index) => (
                      <div key={index} className="p-4 bg-slate-800 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getTypeIcon(issue.type)}</span>
                            <div>
                              <Badge className={`${getSeverityColor(issue.severity)} text-white mb-1`}>
                                {issue.severity}
                              </Badge>
                              {issue.line && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400 ml-2">
                                  Line {issue.line}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <h4 className="font-semibold text-white mb-2">{issue.description}</h4>
                        {issue.suggestion && (
                          <p className="text-slate-300 text-sm bg-slate-700 p-3 rounded border-l-4 border-blue-500">
                            <span className="font-medium text-blue-400">Suggestion:</span> {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Other Issues */}
            {otherIssues.length > 0 && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Other Issues ({otherIssues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="other-issues">
                    {otherIssues.map((issue, index) => (
                      <div key={index} className="p-4 bg-slate-700 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getTypeIcon(issue.type)}</span>
                            <div>
                              <Badge className={`${getSeverityColor(issue.severity)} text-white mb-1`}>
                                {issue.severity}
                              </Badge>
                              {issue.line && (
                                <Badge variant="outline" className="border-slate-600 text-slate-400 ml-2">
                                  Line {issue.line}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <h4 className="font-semibold text-white mb-2">{issue.description}</h4>
                        {issue.suggestion && (
                          <p className="text-slate-300 text-sm bg-slate-600 p-3 rounded border-l-4 border-blue-500">
                            <span className="font-medium text-blue-400">Suggestion:</span> {issue.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.issues.length === 0 && (
              <Card className="bg-green-900/20 border-green-600">
                <CardContent className="text-center py-12">
                  <div className="text-green-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Issues Found!</h3>
                  <p className="text-slate-300">Your code looks clean and doesn't have any detected issues.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Improvement Suggestions</CardTitle>
                <CardDescription className="text-slate-400">
                  Recommendations to enhance your code quality
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.suggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-slate-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-slate-400">No specific suggestions available for this analysis.</p>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="suggestions">
                    {result.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-4 bg-slate-700 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-start gap-3">
                          <div className="text-green-400 mt-1">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{suggestion.category}</h4>
                            <p className="text-slate-300 text-sm">{suggestion.description}</p>
                            {suggestion.impact && (
                              <p className="text-green-400 text-xs mt-2">Impact: {suggestion.impact}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, Square, RefreshCw, Download, Upload, Settings, 
  Bug, Shield, Zap, Code, FileText, AlertTriangle,
  CheckCircle, XCircle, Clock, Cpu, Eye, EyeOff,
  Split, Maximize2, Minimize2, Search, Filter
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AdvancedCodeAnalyzer() {
  const { user } = useAuth();
  const [code, setCode] = useState(`// Welcome to AI Bug Hunter - Advanced Code Analyzer
// Try pasting your code here for real-time analysis

function authenticateUser(username, password) {
  // Potential security vulnerabilities below:
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  
  if (password.length < 6) {
    return false;
  }
  
  // Missing input validation
  const user = database.query(query);
  return user ? true : false;
}

class DataProcessor {
  constructor() {
    this.cache = new Map();
  }
  
  // Performance issue: No cache size limit
  processData(data) {
    if (this.cache.has(data)) {
      return this.cache.get(data);
    }
    
    // Expensive operation without error handling
    const result = data.split('').reverse().join('').toUpperCase();
    this.cache.set(data, result);
    return result;
  }
}`);

  const [language, setLanguage] = useState('javascript');
  const [analysisType, setAnalysisType] = useState('comprehensive');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [showFixSuggestions, setShowFixSuggestions] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [splitView, setSplitView] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const editorRef = useRef(null);
  const timeoutRef = useRef(null);

  // Mock analysis results for demo
  const mockAnalysisResults = {
    id: 'analysis_' + Date.now(),
    timestamp: new Date().toISOString(),
    file_name: 'code_input.js',
    file_type: language,
    analysis_type: analysisType,
    security_score: 45,
    code_quality_score: 62,
    performance_score: 58,
    maintainability_score: 71,
    issues: [
      {
        id: 1,
        type: 'security',
        severity: 'critical',
        line: 5,
        column: 20,
        title: 'SQL Injection Vulnerability',
        description: 'Direct string concatenation in SQL query allows SQL injection attacks',
        suggestion: 'Use parameterized queries or prepared statements',
        fixCode: `const query = "SELECT * FROM users WHERE username = ? AND password = ?";
const user = database.query(query, [username, password]);`,
        category: 'OWASP A03:2021 - Injection'
      },
      {
        id: 2,
        type: 'security',
        severity: 'high',
        line: 7,
        column: 7,
        title: 'Weak Password Validation',
        description: 'Password length validation is insufficient for security',
        suggestion: 'Implement stronger password requirements (length, complexity, special characters)',
        fixCode: `if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])/.test(password)) {
  return false;
}`,
        category: 'Authentication & Session Management'
      },
      {
        id: 3,
        type: 'security',
        severity: 'medium',
        line: 11,
        column: 15,
        title: 'Missing Input Validation',
        description: 'User inputs are not validated before processing',
        suggestion: 'Add input sanitization and validation',
        fixCode: `// Validate and sanitize inputs
if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
  throw new Error('Invalid input parameters');
}`,
        category: 'Input Validation'
      },
      {
        id: 4,
        type: 'performance',
        severity: 'medium',
        line: 22,
        column: 5,
        title: 'Unbounded Cache Growth',
        description: 'Cache has no size limit and will grow indefinitely',
        suggestion: 'Implement cache size limit and eviction policy',
        fixCode: `constructor() {
  this.cache = new Map();
  this.maxCacheSize = 1000;
}

processData(data) {
  if (this.cache.size >= this.maxCacheSize) {
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
  }
  // ... rest of the method
}`,
        category: 'Memory Management'
      },
      {
        id: 5,
        type: 'bugs',
        severity: 'low',
        line: 32,
        column: 12,
        title: 'Missing Error Handling',
        description: 'Operations that can throw exceptions are not wrapped in try-catch',
        suggestion: 'Add proper error handling for data processing',
        fixCode: `processData(data) {
  try {
    if (this.cache.has(data)) {
      return this.cache.get(data);
    }
    
    const result = data.split('').reverse().join('').toUpperCase();
    this.cache.set(data, result);
    return result;
  } catch (error) {
    console.error('Data processing failed:', error);
    throw new Error('Failed to process data');
  }
}`,
        category: 'Error Handling'
      }
    ],
    suggestions: [
      {
        category: 'Security',
        description: 'Implement proper authentication and authorization mechanisms',
        impact: 'High - Prevents unauthorized access'
      },
      {
        category: 'Performance',
        description: 'Add caching strategies and optimize database queries',
        impact: 'Medium - Improves response times'
      },
      {
        category: 'Code Quality',
        description: 'Add comprehensive unit tests and documentation',
        impact: 'Medium - Improves maintainability'
      }
    ],
    summary: 'Code analysis found 5 issues including 2 critical security vulnerabilities. Priority should be given to fixing SQL injection and implementing proper input validation.',
    processing_time: 2.3,
    ai_model_used: 'claude-3-5-sonnet-20241022'
  };

  // Real-time analysis simulation
  useEffect(() => {
    if (realtimeMode && code.trim()) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        performAnalysis(true);
      }, 1000); // Debounce for 1 second
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, realtimeMode, language, analysisType]);

  const performAnalysis = async (isRealtime = false) => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, isRealtime ? 100 : 300);

    try {
      // Call real backend API
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/analyze/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_content: code,
          file_type: language,
          analysis_type: analysisType
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const analysisResult = await response.json();
      
      setAnalysisResults({
        ...analysisResult,
        timestamp: new Date().toISOString()
      });
      
      setAnalysisProgress(100);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Fallback to mock results if API fails
      setAnalysisResults({
        ...mockAnalysisResults,
        timestamp: new Date().toISOString(),
        file_type: language,
        analysis_type: analysisType,
        summary: `Analysis failed: ${error.message}. Showing demo results.`,
        ai_model_used: "Demo Mode (API Error)"
      });
      
      setAnalysisProgress(100);
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'security': return <Shield className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'bugs': return <Bug className="w-4 h-4" />;
      case 'style': return <Code className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const applyQuickFix = (issue) => {
    if (issue.fixCode) {
      // In a real implementation, this would intelligently replace the problematic code
      const updatedCode = code + '\n\n// AI Suggested Fix:\n' + issue.fixCode;
      setCode(updatedCode);
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analysis_${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="analyzer-title">
              Advanced Code Analyzer
            </h1>
            <p className="text-slate-300">Real-time code analysis, debugging, and automated fixing</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={realtimeMode ? "default" : "outline"}
                onClick={() => setRealtimeMode(!realtimeMode)}
                className={realtimeMode ? "bg-green-600 hover:bg-green-700" : "border-slate-600 text-slate-300"}
                data-testid="realtime-toggle"
              >
                {realtimeMode ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                Real-time {realtimeMode ? 'ON' : 'OFF'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setSplitView(!splitView)}
                className="border-slate-600 text-slate-300"
              >
                {splitView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card className="mb-6 bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">Analyzing code...</span>
                    <span className="text-slate-300">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" data-testid="analysis-progress" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAnalyzing(false)}
                  className="border-slate-600 text-slate-300"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className={`grid gap-6 ${splitView ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Code Editor Section */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Code Editor</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm rounded px-3 py-1"
                    data-testid="language-select"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="csharp">C#</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                  
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm rounded px-3 py-1"
                    data-testid="analysis-type-select"
                  >
                    <option value="comprehensive">Comprehensive</option>
                    <option value="security">Security Focus</option>
                    <option value="performance">Performance</option>
                    <option value="bugs">Bug Detection</option>
                    <option value="style">Code Style</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => performAnalysis()}
                      disabled={isAnalyzing || !code.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="analyze-button"
                    >
                      {isAnalyzing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
                    </Button>
                    
                    <Button variant="outline" className="border-slate-600 text-slate-300">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                  
                  {analysisResults && (
                    <Button
                      variant="outline"
                      onClick={exportResults}
                      className="border-slate-600 text-slate-300"
                      data-testid="export-results"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Results
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    ref={editorRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-96 bg-slate-900 border border-slate-600 rounded-lg p-4 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Paste or type your code here..."
                    data-testid="code-editor"
                  />
                  
                  {/* Line numbers and syntax highlighting overlay could go here */}
                  <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                    Lines: {code.split('\n').length} | Chars: {code.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Results Section */}
          {splitView && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Analysis Results</CardTitle>
                  {analysisResults && (
                    <Badge className="bg-purple-600">
                      {analysisResults.issues.length} issue{analysisResults.issues.length !== 1 ? 's' : ''} found
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {analysisResults ? (
                  <Tabs defaultValue="issues" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-700">
                      <TabsTrigger value="issues" data-testid="issues-tab">Issues</TabsTrigger>
                      <TabsTrigger value="fixes" data-testid="fixes-tab">Quick Fixes</TabsTrigger>
                      <TabsTrigger value="metrics" data-testid="metrics-tab">Metrics</TabsTrigger>
                      <TabsTrigger value="insights" data-testid="insights-tab">AI Insights</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="issues" className="space-y-4 max-h-80 overflow-y-auto">
                      {analysisResults.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-4 bg-slate-700 rounded-lg border-l-4 border-red-500 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => setSelectedIssue(selectedIssue === issue.id ? null : issue.id)}
                          data-testid={`issue-${issue.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {getTypeIcon(issue.type)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-white">{issue.title}</h4>
                                  <Badge className={getSeverityColor(issue.severity)}>
                                    {issue.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-300 mb-2">{issue.description}</p>
                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                  <span>Line {issue.line}:{issue.column}</span>
                                  <span>{issue.category}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {selectedIssue === issue.id && (
                            <div className="mt-4 pt-4 border-t border-slate-600">
                              <div className="space-y-3">
                                <div>
                                  <h5 className="text-sm font-medium text-white mb-2">Suggested Fix:</h5>
                                  <p className="text-sm text-slate-300 mb-3">{issue.suggestion}</p>
                                </div>
                                
                                {issue.fixCode && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h5 className="text-sm font-medium text-white">Code Fix:</h5>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          applyQuickFix(issue);
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                        data-testid={`apply-fix-${issue.id}`}
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Apply Fix
                                      </Button>
                                    </div>
                                    <SyntaxHighlighter
                                      language={language}
                                      style={atomDark}
                                      className="text-xs rounded"
                                    >
                                      {issue.fixCode}
                                    </SyntaxHighlighter>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="fixes" className="space-y-4">
                      <Alert className="bg-blue-900/50 border-blue-600">
                        <Zap className="h-4 w-4" />
                        <AlertDescription className="text-blue-300">
                          AI-powered quick fixes are available for {analysisResults.issues.filter(i => i.fixCode).length} issues.
                          Click "Apply Fix" on any issue to automatically implement the suggested solution.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid gap-3">
                        {analysisResults.issues.filter(issue => issue.fixCode).map((issue) => (
                          <div key={issue.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                            <div>
                              <h4 className="font-medium text-white text-sm">{issue.title}</h4>
                              <p className="text-xs text-slate-400">Line {issue.line}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => applyQuickFix(issue)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Apply Fix
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="metrics" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">Security</span>
                              <span className="text-white">{analysisResults.security_score}%</span>
                            </div>
                            <Progress value={analysisResults.security_score} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">Quality</span>
                              <span className="text-white">{analysisResults.code_quality_score}%</span>
                            </div>
                            <Progress value={analysisResults.code_quality_score} className="h-2" />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">Performance</span>
                              <span className="text-white">{analysisResults.performance_score || 58}%</span>
                            </div>
                            <Progress value={analysisResults.performance_score || 58} className="h-2" />
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-300">Maintainability</span>
                              <span className="text-white">{analysisResults.maintainability_score || 71}%</span>
                            </div>
                            <Progress value={analysisResults.maintainability_score || 71} className="h-2" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-600">
                        <h4 className="font-medium text-white mb-3">Analysis Summary</h4>
                        <p className="text-sm text-slate-300">{analysisResults.summary}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                          <span>Processed in {analysisResults.processing_time}s</span>
                          <span>Model: {analysisResults.ai_model_used}</span>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="insights" className="space-y-4">
                      <div className="space-y-3">
                        {analysisResults.suggestions.map((suggestion, index) => (
                          <div key={index} className="p-4 bg-slate-700 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-medium text-white mb-2">{suggestion.category}</h4>
                            <p className="text-sm text-slate-300 mb-2">{suggestion.description}</p>
                            <p className="text-xs text-blue-400">Impact: {suggestion.impact}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-12">
                    <Code className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Analysis Yet</h3>
                    <p className="text-slate-400 mb-4">
                      {realtimeMode 
                        ? "Type or paste code to see real-time analysis" 
                        : "Click 'Analyze Code' to start analyzing your code"
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Full-width results when not in split view */}
        {!splitView && analysisResults && (
          <Card className="mt-6 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Same content as above but in full width */}
              <div className="text-white">Full-width analysis results would go here...</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
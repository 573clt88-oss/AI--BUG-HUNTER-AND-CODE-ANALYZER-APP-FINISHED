import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Bug, Shield, Zap, Code } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SimpleAnalyzer({ supportedLanguages = [], analysisTypes = [] }) {
  const [code, setCode] = useState("");
  const [fileType, setFileType] = useState("");
  const [analysisType, setAnalysisType] = useState("comprehensive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast({
        title: "No code provided",
        description: "Please enter some code to analyze",
        variant: "destructive",
      });
      return;
    }

    if (!fileType) {
      toast({
        title: "Language not selected",
        description: "Please select a programming language",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError("");
    setResults(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 90) {
          return prev + 15;
        }
        return prev;
      });
    }, 500);

    try {
      console.log("Sending analysis request...", { 
        codeLength: code.length, 
        fileType, 
        analysisType,
        apiUrl: `${API}/analyze/text`
      });

      const response = await axios.post(`${API}/analyze/text`, {
        file_content: code,
        file_type: fileType,
        analysis_type: analysisType
      });

      console.log("Analysis response received:", response.data);

      clearInterval(progressInterval);
      setProgress(100);

      setResults(response.data);
      
      toast({
        title: "Analysis complete!",
        description: "Your code has been analyzed successfully",
      });

    } catch (error) {
      console.error("Analysis error:", error);
      clearInterval(progressInterval);
      setProgress(0);
      
      const errorMessage = error.response?.data?.detail || error.message || "An error occurred during analysis";
      setError(errorMessage);
      
      toast({
        title: "Analysis failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Bug className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Code className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const addExampleCode = (language) => {
    const examples = {
      python: `def login(username, password):
    # SQL Injection vulnerability
    query = f"SELECT * FROM users WHERE name='{username}' AND pwd='{password}'"
    
    # Code injection vulnerability  
    result = eval(password)
    
    # Hardcoded credentials
    if password == "admin123":
        return True
        
    return result`,
      javascript: `function authenticateUser(username, password) {
    // SQL Injection vulnerability
    const query = \`SELECT * FROM users WHERE name='\${username}' AND pwd='\${password}'\`;
    
    // Code injection vulnerability
    const result = eval(password);
    
    // XSS vulnerability
    document.innerHTML = \`Welcome \${username}\`;
    
    return result;
}`,
      java: `public class LoginService {
    public boolean authenticate(String username, String password) {
        // SQL Injection vulnerability
        String query = "SELECT * FROM users WHERE name='" + username + "' AND pwd='" + password + "'";
        
        // Hardcoded password
        if ("admin123".equals(password)) {
            return true;
        }
        
        return executeQuery(query);
    }
}`
    };
    
    const example = examples[language] || examples.python;
    setCode(example);
    setFileType(language);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🐛 AI Code Analyzer - Simple Test
          </h1>
          <p className="text-slate-300">
            Test the code analysis functionality directly - no login required
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Enter Code to Analyze</CardTitle>
                <CardDescription className="text-slate-400">
                  Paste your code or try an example
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Example buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addExampleCode('python')}
                    className="border-slate-600 text-slate-300"
                  >
                    Python Example
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addExampleCode('javascript')}
                    className="border-slate-600 text-slate-300"
                  >
                    JS Example
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => addExampleCode('java')}
                    className="border-slate-600 text-slate-300"
                  >
                    Java Example
                  </Button>
                </div>

                {/* Code input */}
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="min-h-[300px] bg-slate-900 border-slate-600 text-white font-mono text-sm"
                />

                <div className="text-sm text-slate-400">
                  {code.length} characters
                </div>
              </CardContent>
            </Card>

            {/* Analysis Configuration */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Analysis Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Programming Language
                  </label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id} className="text-white">
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Analysis Type
                  </label>
                  <Select value={analysisType} onValueChange={setAnalysisType}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      {analysisTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id} className="text-white">
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Analyzing...</span>
                      <span className="text-slate-300">{progress}%</span>
                    </div>
                    <Progress value={progress} className="bg-slate-700" />
                  </div>
                )}

                <Button 
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !code.trim() || !fileType}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAnalyzing ? "Analyzing..." : "🚀 Start Analysis"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            {error && (
              <Card className="bg-red-900/50 border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-200 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Analysis Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-200">{error}</p>
                </CardContent>
              </Card>
            )}

            {results && (
              <>
                {/* Summary */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {results.security_score}/100
                        </div>
                        <div className="text-sm text-slate-400">Security Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {results.code_quality_score}/100
                        </div>
                        <div className="text-sm text-slate-400">Quality Score</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-slate-900 rounded">
                      <p className="text-sm text-slate-300">{results.summary}</p>
                    </div>
                    
                    <div className="mt-2 text-xs text-slate-500">
                      Analysis by: {results.ai_model_used}
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                {results.issues && results.issues.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Bug className="w-5 h-5" />
                        Issues Found ({results.issues.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {results.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-900 rounded">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity?.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-slate-400 capitalize">{issue.type}</span>
                            </div>
                            <p className="text-sm text-white mb-2">{issue.description}</p>
                            {issue.suggestion && (
                              <p className="text-xs text-slate-400">
                                💡 <strong>Fix:</strong> {issue.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Suggestions */}
                {results.suggestions && results.suggestions.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Improvement Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {results.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-green-400 mt-0.5">✓</span>
                          <span className="text-slate-300">{suggestion}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!results && !error && !isAnalyzing && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="text-center py-12">
                  <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    Enter code and click "Start Analysis" to see results here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
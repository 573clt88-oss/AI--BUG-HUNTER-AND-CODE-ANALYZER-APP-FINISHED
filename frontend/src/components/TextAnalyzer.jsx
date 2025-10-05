import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TextAnalyzer({ supportedLanguages, analysisTypes }) {
  const [code, setCode] = useState("");
  const [fileType, setFileType] = useState("");
  const [analysisType, setAnalysisType] = useState("comprehensive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const codeExamples = {
    python: `def find_user(user_id):
    # Potential SQL injection vulnerability
    query = f"SELECT * FROM users WHERE id = {user_id}"
    result = execute_query(query)
    return result`,
    javascript: `function validateInput(input) {
    // Missing input validation
    if (input.length > 0) {
        document.innerHTML = input; // XSS vulnerability
        return true;
    }
    return false;
}`,
    java: `public class UserService {
    // Memory leak potential
    private static List<User> userCache = new ArrayList<>();
    
    public User getUser(int id) {
        // No bounds checking
        return userCache.get(id);
    }
}`
  };

  const insertExample = (language) => {
    if (codeExamples[language]) {
      setCode(codeExamples[language]);
      const langType = supportedLanguages.find(lang => lang.name.toLowerCase() === language)?.type;
      if (langType) {
        setFileType(langType);
      }
    }
  };

  const analyzeCode = async () => {
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
        description: "Please select the programming language",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            return prev + 15;
          }
          return prev;
        });
      }, 800);

      const response = await axios.post(`${API}/analyze/text`, {
        file_content: code,
        file_type: fileType,
        analysis_type: analysisType
      });

      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Analysis complete",
        description: "Your code has been analyzed successfully",
      });

      // Navigate to results page
      setTimeout(() => {
        navigate(`/results/${response.data.id}`);
      }, 1000);

    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error.response?.data?.detail || "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-analyzer-title">
              Paste & Analyze Code
            </h1>
            <p className="text-slate-300">
              Paste your code directly for quick analysis and bug detection
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700" data-testid="back-to-dashboard-btn">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Code Input Area */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Code Input</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => insertExample('python')}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="python-example-btn"
                    >
                      Python Example
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => insertExample('javascript')}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="javascript-example-btn"
                    >
                      JS Example
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => insertExample('java')}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      data-testid="java-example-btn"
                    >
                      Java Example
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Paste your code here for analysis. Try the example buttons to see sample vulnerable code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="min-h-[400px] bg-slate-900 border-slate-600 text-white font-mono text-sm resize-none"
                  data-testid="code-input"
                />
                
                <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
                  <span>{code.length} characters</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCode("")}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    data-testid="clear-code-btn"
                  >
                    Clear
                  </Button>
                </div>

                {/* Progress Bar */}
                {isAnalyzing && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">Analyzing code...</span>
                      <span className="text-sm text-slate-300">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" data-testid="analysis-progress" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Language</CardTitle>
                <CardDescription className="text-slate-400">
                  Select the programming language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={fileType} onValueChange={setFileType} data-testid="language-select">
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.type} value={lang.type} className="text-white hover:bg-slate-600">
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Analysis Type</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose the type of analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={analysisType} onValueChange={setAnalysisType} data-testid="analysis-type-select">
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {analysisTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id} className="text-white hover:bg-slate-600">
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-slate-400">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Analysis Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-slate-300">Security vulnerabilities</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-slate-300">Logic bugs & errors</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-slate-300">Performance issues</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-300">Code quality & style</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={analyzeCode} 
              disabled={!code.trim() || !fileType || isAnalyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
              data-testid="analyze-code-btn"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Start Analysis'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
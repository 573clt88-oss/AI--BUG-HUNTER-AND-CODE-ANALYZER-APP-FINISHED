import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function FileAnalyzer({ supportedLanguages, analysisTypes }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisType, setAnalysisType] = useState("comprehensive");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file) => {
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 1MB",
        variant: "destructive",
      });
      return;
    }

    // Check if file type is supported
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const isSupported = supportedLanguages.some(lang => lang.extension === extension);
    
    if (!isSupported) {
      toast({
        title: "Unsupported file type",
        description: `File type ${extension} is not supported for analysis`,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File selected",
      description: `${file.name} is ready for analysis`,
    });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const analyzeFile = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to analyze",
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
            return prev + 10;
          }
          return prev;
        });
      }, 500);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('analysis_type', analysisType);

      const response = await axios.post(`${API}/analyze/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="file-analyzer-title">
              Upload & Analyze Files
            </h1>
            <p className="text-slate-300">
              Upload your code files for comprehensive AI-powered analysis
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700" data-testid="back-to-dashboard-btn">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Area */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">File Upload</CardTitle>
                <CardDescription className="text-slate-400">
                  Drag and drop your code file or click to browse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${dragActive 
                      ? 'border-purple-400 bg-purple-900/20' 
                      : selectedFile 
                        ? 'border-green-400 bg-green-900/20'
                        : 'border-slate-600 hover:border-slate-500'
                    }
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  data-testid="file-upload-area"
                >
                  <input
                    type="file"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept={supportedLanguages.map(lang => lang.extension).join(',')}
                    data-testid="file-input"
                  />
                  
                  {selectedFile ? (
                    <div className="text-green-400">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-lg font-medium text-white mb-1">{selectedFile.name}</p>
                      <p className="text-sm text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Ready for analysis
                      </p>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-lg font-medium text-white mb-1">
                        {dragActive ? "Drop your file here" : "Choose a file or drag it here"}
                      </p>
                      <p className="text-sm">Supports files up to 1MB</p>
                    </div>
                  )}
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

          {/* Analysis Configuration */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Analysis Type</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose the type of analysis to perform
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
                <CardTitle className="text-white text-lg">Supported Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {supportedLanguages.map((lang) => (
                    <div key={lang.type} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{lang.name}</span>
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                        {lang.extension}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={analyzeFile} 
              disabled={!selectedFile || isAnalyzing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
              data-testid="analyze-file-btn"
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
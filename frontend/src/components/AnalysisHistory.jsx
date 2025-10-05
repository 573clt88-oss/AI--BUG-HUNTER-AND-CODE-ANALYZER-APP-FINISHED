import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, searchTerm, filterType]);

  const fetchAnalysisHistory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API}/analysis/history`);
      setAnalyses(response.data);
    } catch (error) {
      console.error("Failed to fetch analysis history:", error);
      toast({
        title: "Error",
        description: "Failed to load analysis history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAnalyses = () => {
    let filtered = analyses;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(analysis =>
        analysis.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.file_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.analysis_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(analysis => analysis.analysis_type === filterType);
    }

    setFilteredAnalyses(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
        return 'bg-red-600';
      case 'processing':
        return 'bg-yellow-600';
      default:
        return 'bg-slate-600';
    }
  };

  const getFileTypeIcon = (fileType) => {
    const icons = {
      python: '🐍',
      javascript: '🟨',
      typescript: '🔷',
      java: '☕',
      cpp: '⚡',
      c: '🔧',
      csharp: '💎',
      php: '🐘',
      ruby: '💎',
      go: '🐹',
      rust: '⚙️',
      kotlin: '🎯',
      swift: '🦉',
      html: '🌐',
      css: '🎨',
      sql: '🗃️',
      json: '📋',
      yaml: '📄'
    };
    return icons[fileType] || '📄';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading analysis history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="history-title">
              Analysis History
            </h1>
            <p className="text-slate-300">
              View and manage your previous code analyses
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700" data-testid="back-to-dashboard-btn">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by filename, language, or analysis type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  data-testid="search-input"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className={filterType === "all" ? "bg-purple-600" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  data-testid="filter-all-btn"
                >
                  All
                </Button>
                <Button
                  variant={filterType === "comprehensive" ? "default" : "outline"}
                  onClick={() => setFilterType("comprehensive")}
                  className={filterType === "comprehensive" ? "bg-purple-600" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  data-testid="filter-comprehensive-btn"
                >
                  Comprehensive
                </Button>
                <Button
                  variant={filterType === "security" ? "default" : "outline"}
                  onClick={() => setFilterType("security")}
                  className={filterType === "security" ? "bg-purple-600" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  data-testid="filter-security-btn"
                >
                  Security
                </Button>
                <Button
                  variant={filterType === "bugs" ? "default" : "outline"}
                  onClick={() => setFilterType("bugs")}
                  className={filterType === "bugs" ? "bg-purple-600" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
                  data-testid="filter-bugs-btn"
                >
                  Bugs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">Analysis Results</CardTitle>
                <CardDescription className="text-slate-400">
                  {filteredAnalyses.length} of {analyses.length} analyses
                </CardDescription>
              </div>
              <Button onClick={fetchAnalysisHistory} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-medium text-white mb-2">No analyses found</h3>
                <p className="text-slate-400 mb-6">
                  {searchTerm || filterType !== "all" 
                    ? "No analyses match your current filters" 
                    : "You haven't performed any code analyses yet"
                  }
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/analyze-file">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Analyze Files
                    </Button>
                  </Link>
                  <Link to="/analyze-text">
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      Analyze Code
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4" data-testid="analysis-results">
                {filteredAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-6 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {getFileTypeIcon(analysis.file_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-white text-lg">{analysis.file_name}</h4>
                          <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                            {analysis.file_type}
                          </Badge>
                          <Badge variant="outline" className="border-slate-500 text-slate-400">
                            {analysis.analysis_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>
                            {new Date(analysis.timestamp).toLocaleDateString()} at{' '}
                            {new Date(analysis.timestamp).toLocaleTimeString()}
                          </span>
                          <span>ID: {analysis.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge 
                        className={`${getStatusColor(analysis.status)} text-white`}
                        data-testid={`status-${analysis.status}`}
                      >
                        {analysis.status}
                      </Badge>
                      
                      {analysis.status === 'completed' && (
                        <Link to={`/results/${analysis.result_id}`}>
                          <Button 
                            variant="outline" 
                            className="border-slate-600 text-slate-300 hover:bg-slate-600"
                            data-testid={`view-results-${analysis.id}`}
                          >
                            View Results
                          </Button>
                        </Link>
                      )}
                      
                      {analysis.status === 'failed' && (
                        <Button 
                          variant="outline" 
                          className="border-red-600 text-red-400 hover:bg-red-900/20"
                          onClick={() => {
                            toast({
                              title: "Analysis Failed",
                              description: "This analysis encountered an error during processing",
                              variant: "destructive",
                            });
                          }}
                        >
                          Error Details
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
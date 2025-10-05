import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

// Import components
import Dashboard from "@/components/Dashboard";
import FileAnalyzer from "@/components/FileAnalyzer";
import TextAnalyzer from "@/components/TextAnalyzer";
import AnalysisHistory from "@/components/AnalysisHistory";
import AnalysisResults from "@/components/AnalysisResults";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main App Component
function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    checkApiConnection();
    fetchSupportedLanguages();
    fetchAnalysisTypes();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await axios.get(`${API}/`);
      setApiStatus("connected");
      console.log("API Status:", response.data.message);
    } catch (e) {
      setApiStatus("error");
      console.error("API Connection Error:", e);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the analysis backend",
        variant: "destructive",
      });
    }
  };

  const fetchSupportedLanguages = async () => {
    try {
      const response = await axios.get(`${API}/supported-languages`);
      setSupportedLanguages(response.data.languages);
    } catch (e) {
      console.error("Failed to fetch supported languages:", e);
    }
  };

  const fetchAnalysisTypes = async () => {
    try {
      const response = await axios.get(`${API}/analysis-types`);
      setAnalysisTypes(response.data.types);
    } catch (e) {
      console.error("Failed to fetch analysis types:", e);
    }
  };

  if (apiStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Bug Hunter</h2>
          <p className="text-slate-300">Connecting to analysis engine...</p>
        </div>
      </div>
    );
  }

  if (apiStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-slate-900 to-red-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
          <p className="text-slate-300 mb-4">Unable to connect to the AI Bug Hunter backend service.</p>
          <button 
            onClick={checkApiConnection}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Dashboard 
              supportedLanguages={supportedLanguages}
              analysisTypes={analysisTypes}
            />
          } />
          <Route path="/analyze-file" element={
            <FileAnalyzer 
              supportedLanguages={supportedLanguages}
              analysisTypes={analysisTypes}
            />
          } />
          <Route path="/analyze-text" element={
            <TextAnalyzer 
              supportedLanguages={supportedLanguages}
              analysisTypes={analysisTypes}
            />
          } />
          <Route path="/history" element={<AnalysisHistory />} />
          <Route path="/results/:resultId" element={<AnalysisResults />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
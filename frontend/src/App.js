import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

// Context Providers
import { AuthProvider } from "@/contexts/AuthContext";

// Authentication Components
import LoginPage from "@/components/auth/LoginPage";
import RegisterPage from "@/components/auth/RegisterPage";
import ProtectedRoute from "@/components/ProtectedRoute";

// Main Application Components
import UserDashboard from "@/components/dashboard/UserDashboard";
import AdvancedCodeAnalyzer from "@/components/analyzer/AdvancedCodeAnalyzer";
import SubscriptionPage from "@/components/subscription/SubscriptionPage";
import AdminDashboard from "@/components/admin/AdminDashboard";

// Legacy Components (for backward compatibility)
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
          <h2 className="text-2xl font-bold text-white mb-2">AI Bug Hunter & Code Analyzer</h2>
          <p className="text-slate-300">Loading advanced code analysis platform...</p>
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
          <h2 className="text-2xl font-bold text-white mb-2">Service Unavailable</h2>
          <p className="text-slate-300 mb-4">Unable to connect to the AI Bug Hunter backend service.</p>
          <button 
            onClick={checkApiConnection}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected Application Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/analyzer" element={
              <ProtectedRoute>
                <AdvancedCodeAnalyzer />
              </ProtectedRoute>
            } />
            
            <Route path="/analyzer/realtime" element={
              <ProtectedRoute>
                <AdvancedCodeAnalyzer />
              </ProtectedRoute>
            } />
            
            <Route path="/subscription" element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            } />
            
            <Route path="/subscription/success" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="text-green-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
                    <p className="text-slate-300 mb-6">Welcome to AI Bug Hunter Pro! You now have unlimited code analysis.</p>
                    <a href="/dashboard" className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                      Go to Dashboard
                    </a>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/subscription/cancel" element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="text-yellow-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Payment Cancelled</h2>
                    <p className="text-slate-300 mb-6">Your payment was cancelled. You can try again anytime.</p>
                    <div className="space-y-3">
                      <a href="/subscription" className="block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        Try Again
                      </a>
                      <a href="/dashboard" className="block px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        Back to Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            {/* Legacy Routes (for backward compatibility) */}
            <Route path="/history" element={
              <ProtectedRoute>
                <AnalysisHistory />
              </ProtectedRoute>
            } />
            
            <Route path="/results/:resultId" element={
              <ProtectedRoute>
                <AnalysisResults />
              </ProtectedRoute>
            } />
            
            <Route path="/analyze-file" element={
              <ProtectedRoute>
                <FileAnalyzer 
                  supportedLanguages={supportedLanguages}
                  analysisTypes={analysisTypes}
                />
              </ProtectedRoute>
            } />
            
            <Route path="/analyze-text" element={
              <ProtectedRoute>
                <TextAnalyzer 
                  supportedLanguages={supportedLanguages}
                  analysisTypes={analysisTypes}
                />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            {/* Public Landing Page */}
            <Route path="/" element={
              <Dashboard 
                supportedLanguages={supportedLanguages}
                analysisTypes={analysisTypes}
              />
            } />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
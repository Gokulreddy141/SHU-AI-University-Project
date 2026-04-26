"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import CompatibilityMatrix from "@/components/features/audit/CompatibilityMatrix";
import RecommendedConfiguration from "@/components/features/audit/RecommendedConfiguration";
import CompatibilityTesting from "@/components/features/audit/CompatibilityTesting";
import { CompatibilityData } from "@/lib/audit/types";

export default function CompatibilityDashboardPage() {
  const { user } = useAuth("recruiter");
  const [activeTab, setActiveTab] = useState<"matrix" | "config" | "testing">("matrix");
  const [compatibilityData, setCompatibilityData] = useState<CompatibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchCompatibilityMatrix();
  }, []);

  const fetchCompatibilityMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/audit/compatibility/matrix');
      const data = await response.json();
      
      if (response.ok) {
        setCompatibilityData(data.compatibilityMatrix);
        setLastUpdated(new Date(data.lastUpdated));
      } else {
        setError(data.message || 'Failed to fetch compatibility matrix');
      }
    } catch (err) {
      setError('Failed to fetch compatibility matrix');
      console.error('Error fetching compatibility matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestComplete = () => {
    // Refresh the compatibility matrix after a test completes
    fetchCompatibilityMatrix();
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-slate-600 dark:text-slate-400">Loading compatibility data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <span className="text-red-800 dark:text-red-200 font-medium">Error loading compatibility data</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
          <button
            onClick={fetchCompatibilityMatrix}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Browser Compatibility Matrix
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            AI system compatibility across different browsers and configurations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg mr-1">schedule</span>
              Last updated: {lastUpdated.toLocaleString()}
            </div>
          )}
          <button
            onClick={fetchCompatibilityMatrix}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "matrix", label: "Compatibility Matrix", icon: "grid_view" },
            { id: "config", label: "Recommended Configuration", icon: "settings_suggest" },
            { id: "testing", label: "Run Tests", icon: "science" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "matrix" | "config" | "testing")}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "matrix" && compatibilityData && (
          <CompatibilityMatrix 
            browsers={compatibilityData.browsers}
            onRefresh={fetchCompatibilityMatrix}
          />
        )}

        {activeTab === "config" && compatibilityData && (
          <RecommendedConfiguration 
            recommendedConfig={compatibilityData.recommendedConfiguration}
            browsers={compatibilityData.browsers}
          />
        )}

        {activeTab === "testing" && (
          <CompatibilityTesting 
            onTestComplete={handleTestComplete}
          />
        )}
      </div>
    </div>
  );
}
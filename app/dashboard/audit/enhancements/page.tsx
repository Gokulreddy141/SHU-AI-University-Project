"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import EnhancementListView from "@/components/features/audit/EnhancementListView";
import EnhancementDetailView from "@/components/features/audit/EnhancementDetailView";
import EnhancementRoadmapView from "@/components/features/audit/EnhancementRoadmapView";
import { PrioritizedEnhancement, EnhancementRoadmap } from "@/lib/audit/types";

export default function EnhancementsPage() {
  const { user } = useAuth("recruiter");
  const [activeTab, setActiveTab] = useState<"list" | "roadmap">("list");
  const [selectedEnhancement, setSelectedEnhancement] = useState<PrioritizedEnhancement | null>(null);
  const [enhancements, setEnhancements] = useState<PrioritizedEnhancement[]>([]);
  const [roadmap, setRoadmap] = useState<EnhancementRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEnhancements();
  }, []);

  const fetchEnhancements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit/enhancements');
      const data = await response.json();
      
      if (data.success) {
        setEnhancements(data.data.enhancements);
        setRoadmap(data.data.roadmap);
      } else {
        setError(data.error || 'Failed to fetch enhancements');
      }
    } catch (err) {
      setError('Failed to fetch enhancements');
      console.error('Error fetching enhancements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhancementSelect = (enhancement: PrioritizedEnhancement) => {
    setSelectedEnhancement(enhancement);
  };

  const handleBackToList = () => {
    setSelectedEnhancement(null);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-slate-600 dark:text-slate-400">Loading enhancements...</span>
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
            <span className="text-red-800 dark:text-red-200 font-medium">Error loading enhancements</span>
          </div>
          <p className="text-red-700 dark:text-red-300 mt-2">{error}</p>
          <button
            onClick={fetchEnhancements}
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
          <div className="flex items-center gap-3">
            {selectedEnhancement && (
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {selectedEnhancement ? selectedEnhancement.name : "Enhancement Recommendations"}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {selectedEnhancement 
                  ? "Implementation guide and details"
                  : "AI enhancement opportunities and roadmap visualization"
                }
              </p>
            </div>
          </div>
        </div>
        
        {!selectedEnhancement && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined text-lg">lightbulb</span>
            <span>{enhancements.length} enhancement opportunities identified</span>
          </div>
        )}
      </div>

      {selectedEnhancement ? (
        <EnhancementDetailView 
          enhancement={selectedEnhancement}
          onBack={handleBackToList}
        />
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "list", label: "Enhancement List", icon: "list" },
                { id: "roadmap", label: "Roadmap", icon: "timeline" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "list" | "roadmap")}
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
            {activeTab === "list" && (
              <EnhancementListView 
                enhancements={enhancements}
                onEnhancementSelect={handleEnhancementSelect}
                onRefresh={fetchEnhancements}
              />
            )}

            {activeTab === "roadmap" && roadmap && (
              <EnhancementRoadmapView 
                roadmap={roadmap}
                onEnhancementSelect={handleEnhancementSelect}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
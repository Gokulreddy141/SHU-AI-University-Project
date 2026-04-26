"use client";
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AuditExecutionControls from "@/components/features/audit/AuditExecutionControls";
import AuditProgressDisplay from "@/components/features/audit/AuditProgressDisplay";
import AuditResultsVisualization from "@/components/features/audit/AuditResultsVisualization";
import AuditHistoryView from "@/components/features/audit/AuditHistoryView";

export default function AuditDashboardPage() {
  const { user } = useAuth("recruiter");
  const [activeTab, setActiveTab] = useState<"execute" | "results" | "history">("execute");
  const [currentExecution, setCurrentExecution] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            AI Capabilities Audit
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Comprehensive validation and enhancement system for AI detection capabilities
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/audit/performance"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">speed</span>
            Performance Analysis
          </a>
          <a
            href="/dashboard/audit/compatibility"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">devices</span>
            Compatibility Matrix
          </a>
          <a
            href="/dashboard/audit/enhancements"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">lightbulb</span>
            Enhancement Recommendations
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "execute", label: "Execute Audit", icon: "play_arrow" },
            { id: "results", label: "Results", icon: "analytics" },
            { id: "history", label: "History", icon: "history" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "execute" | "results" | "history")}
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
        {activeTab === "execute" && (
          <div className="space-y-6">
            <AuditExecutionControls
              onExecutionStart={(executionId) => {
                setCurrentExecution(executionId);
                setActiveTab("results");
              }}
            />
            {currentExecution && (
              <AuditProgressDisplay executionId={currentExecution} />
            )}
          </div>
        )}

        {activeTab === "results" && (
          <AuditResultsVisualization executionId={currentExecution} />
        )}

        {activeTab === "history" && <AuditHistoryView />}
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SystemPerformanceOverview from "@/components/features/audit/SystemPerformanceOverview";
import PerformanceTrendCharts from "@/components/features/audit/PerformanceTrendCharts";
import BottleneckIdentificationDisplay from "@/components/features/audit/BottleneckIdentificationDisplay";

export default function PerformanceDashboardPage() {
  const { user } = useAuth("recruiter");
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "bottlenecks">("overview");
  const [selectedDateRange, setSelectedDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "" 
  });

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedDateRange({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
    });
  }, []);

  if (!user) return null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/dashboard/audit"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span className="text-sm">Back to Audit Dashboard</span>
            </a>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Performance Analysis Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time performance monitoring and historical analysis for all AI detection systems
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-slate-600 dark:text-slate-400">Date Range:</label>
            <input
              type="date"
              value={selectedDateRange.startDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={selectedDateRange.endDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "System Overview", icon: "dashboard" },
            { id: "trends", label: "Performance Trends", icon: "trending_up" },
            { id: "bottlenecks", label: "Bottleneck Analysis", icon: "warning" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "overview" | "trends" | "bottlenecks")}
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
        {activeTab === "overview" && (
          <SystemPerformanceOverview dateRange={selectedDateRange} />
        )}

        {activeTab === "trends" && (
          <PerformanceTrendCharts dateRange={selectedDateRange} />
        )}

        {activeTab === "bottlenecks" && (
          <BottleneckIdentificationDisplay dateRange={selectedDateRange} />
        )}
      </div>
    </div>
  );
}
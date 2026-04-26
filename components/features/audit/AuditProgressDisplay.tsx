"use client";
import React, { useState, useEffect } from "react";
import { AuditStatus, SystemAuditResult } from "@/lib/audit/types";

interface AuditProgressDisplayProps {
  executionId: string;
}

interface ProgressData {
  status: AuditStatus;
  partialResults?: {
    categoryResults?: Array<{
      category: string;
      status: "pass" | "fail" | "warning" | "running";
      systemResults: SystemAuditResult[];
      totalSystems: number;
      systemsPassed: number;
      systemsFailed: number;
    }>;
  };
}

export default function AuditProgressDisplay({ executionId }: AuditProgressDisplayProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;

    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/audit/status/${executionId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
          
          // Don't throw for "Execution ID is required" - this is expected when no audit exists
          if (errorMessage === "Execution ID is required") {
            setError(null);
            return;
          }
          
          throw new Error(errorMessage);
        }
        const data = await response.json();
        setProgressData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch audit progress:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch audit progress";
        setError(errorMessage);
      }
    };

    // Initial fetch
    fetchProgress();

    // Poll for updates every 2 seconds while audit is running
    const interval = setInterval(() => {
      if (progressData?.status?.isRunning !== false) {
        fetchProgress();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [executionId, progressData?.status?.isRunning]);

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
          <span className="text-red-800 dark:text-red-200 font-medium">Error</span>
        </div>
        <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-slate-600 dark:text-slate-400">Loading audit progress...</span>
        </div>
      </div>
    );
  }

  const { status, partialResults } = progressData;
  const isRunning = status.isRunning;
  const progress = status.progress || 0;

  const getStatusIcon = (systemStatus: string) => {
    switch (systemStatus) {
      case "pass": return { icon: "check_circle", color: "text-green-600 dark:text-green-400" };
      case "fail": return { icon: "error", color: "text-red-600 dark:text-red-400" };
      case "warning": return { icon: "warning", color: "text-yellow-600 dark:text-yellow-400" };
      case "running": return { icon: "hourglass_empty", color: "text-blue-600 dark:text-blue-400 animate-pulse" };
      default: return { icon: "radio_button_unchecked", color: "text-slate-400" };
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl">
            {isRunning ? "hourglass_empty" : "check_circle"}
          </span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Audit Progress
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Execution ID: {executionId}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Overall Progress
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-600 dark:text-slate-400">
          <span>
            {status.currentPhase || "Initializing..."}
          </span>
          <span>
            Duration: {formatDuration(status.startTime, status.estimatedCompletion)}
          </span>
        </div>
      </div>

      {/* Category Progress */}
      {partialResults?.categoryResults && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Category Progress
          </h3>
          
          {partialResults.categoryResults.map((category) => {
            const statusInfo = getStatusIcon(category.status);
            const categoryProgress = category.totalSystems > 0 
              ? ((category.systemsPassed + category.systemsFailed) / category.totalSystems) * 100 
              : 0;

            return (
              <div key={category.category} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${statusInfo.color}`}>
                      {statusInfo.icon}
                    </span>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                        {category.category} AI
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {category.systemsPassed} passed, {category.systemsFailed} failed of {category.totalSystems} systems
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {Math.round(categoryProgress)}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-3">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${categoryProgress}%` }}
                  />
                </div>

                {/* System-by-system status */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {category.systemResults.map((system) => {
                    const systemStatusInfo = getStatusIcon(system.status);
                    return (
                      <div
                        key={system.systemId}
                        className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs"
                      >
                        <span className={`material-symbols-outlined text-sm ${systemStatusInfo.color}`}>
                          {systemStatusInfo.icon}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">
                          {system.systemName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Footer */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-slate-600 dark:text-slate-400">Audit in progress...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-sm">
                  check_circle
                </span>
                <span className="text-slate-600 dark:text-slate-400">Audit completed</span>
              </>
            )}
          </div>
          
          {status.estimatedCompletion && isRunning && (
            <span className="text-slate-600 dark:text-slate-400">
              ETA: {new Date(status.estimatedCompletion).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import { AuditReport } from "@/lib/audit/types";

interface AuditResultsVisualizationProps {
  executionId: string | null;
}

export default function AuditResultsVisualization({ executionId }: AuditResultsVisualizationProps) {
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) return;

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/audit/results/${executionId}`);
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
        setAuditReport(data.results);
      } catch (err) {
        console.error("Failed to fetch audit results:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch audit results";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [executionId]);

  if (!executionId) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-400 mb-4 block">analytics</span>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Audit Results
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Execute an audit to view comprehensive results and analysis
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading audit results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
          <span className="text-red-800 dark:text-red-200 font-medium">Error Loading Results</span>
        </div>
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  if (!auditReport) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">info</span>
          <span className="text-yellow-800 dark:text-yellow-200 font-medium">No Results Available</span>
        </div>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          Audit results are not yet available. The audit may still be running.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass": return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "fail": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
      case "warning": return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
      default: return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return "check_circle";
      case "fail": return "error";
      case "warning": return "warning";
      default: return "help";
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const selectedCategoryData = selectedCategory 
    ? auditReport.categoryResults.find(c => c.category === selectedCategory)
    : null;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${getStatusColor(auditReport.overallStatus)}`}>
              <span className="material-symbols-outlined text-2xl">
                {getStatusIcon(auditReport.overallStatus)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Audit Results
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Completed {new Date(auditReport.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auditReport.overallStatus)}`}>
              <span className="material-symbols-outlined text-sm">
                {getStatusIcon(auditReport.overallStatus)}
              </span>
              {auditReport.overallStatus.toUpperCase()}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Duration: {formatDuration(auditReport.duration)}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {auditReport.summary.totalSystems}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Systems</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {auditReport.summary.systemsPassed}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Passed</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {auditReport.summary.systemsFailed}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Failed</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {auditReport.summary.systemsWarning}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Warnings</div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Overall Pass Rate
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {auditReport.summary.passRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${auditReport.summary.passRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Results */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Category Results
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {auditReport.categoryResults.map((category) => (
            <button
              key={category.category}
              onClick={() => setSelectedCategory(
                selectedCategory === category.category ? null : category.category
              )}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedCategory === category.category
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                  {category.category} AI
                </span>
                <span className={`material-symbols-outlined text-lg ${getStatusColor(category.status).split(' ')[0]}`}>
                  {getStatusIcon(category.status)}
                </span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {category.systemsPassed}/{category.totalSystems} passed
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${(category.systemsPassed / category.totalSystems) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Selected Category Details */}
        {selectedCategoryData && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-4 capitalize">
              {selectedCategoryData.category} AI Systems
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCategoryData.systemResults.map((system) => (
                <div
                  key={system.systemId}
                  className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {system.systemName}
                    </span>
                    <span className={`material-symbols-outlined ${getStatusColor(system.status).split(' ')[0]}`}>
                      {getStatusIcon(system.status)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Tests: {system.validationResult.testsPassed} passed, {system.validationResult.testsFailed} failed
                  </div>

                  {/* Performance Metrics */}
                  {system.performanceMetrics && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      {system.performanceMetrics.frameRate && (
                        <div>FPS: {system.performanceMetrics.frameRate.average.toFixed(1)}</div>
                      )}
                      {system.performanceMetrics.latency && (
                        <div>Latency: {system.performanceMetrics.latency.average.toFixed(1)}ms</div>
                      )}
                      {system.performanceMetrics.memory && (
                        <div>Memory: {system.performanceMetrics.memory.peak.toFixed(1)}MB</div>
                      )}
                    </div>
                  )}

                  {/* Accuracy Metrics */}
                  {system.accuracyMetrics && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <div>Accuracy: {system.accuracyMetrics.accuracy.toFixed(1)}%</div>
                      <div>False Positive Rate: {system.accuracyMetrics.falsePositiveRate.toFixed(1)}%</div>
                      <div>False Negative Rate: {system.accuracyMetrics.falseNegativeRate.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performance Analysis */}
      {auditReport.performanceAnalysis && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Performance Analysis
          </h3>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Overall Performance Score
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {auditReport.performanceAnalysis.performanceData.overallPerformanceScore}/100
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${auditReport.performanceAnalysis.performanceData.overallPerformanceScore}%` }}
              />
            </div>
          </div>

          {auditReport.performanceAnalysis.bottlenecks.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-3">
                Performance Bottlenecks
              </h4>
              <div className="space-y-2">
                {auditReport.performanceAnalysis.bottlenecks.map((bottleneck, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      bottleneck.severity === "high"
                        ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                        : bottleneck.severity === "medium"
                        ? "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
                        : "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {bottleneck.systemId} - {bottleneck.metricName}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        bottleneck.severity === "high"
                          ? "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                          : bottleneck.severity === "medium"
                          ? "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                          : "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200"
                      }`}>
                        {bottleneck.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {bottleneck.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Impact: {bottleneck.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Issues and Recommendations */}
      {(auditReport.summary.criticalIssues.length > 0 || auditReport.summary.recommendations.length > 0) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Issues and Recommendations
          </h3>
          
          {auditReport.summary.criticalIssues.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-red-600 dark:text-red-400 mb-3">
                Critical Issues
              </h4>
              <ul className="space-y-2">
                {auditReport.summary.criticalIssues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm mt-0.5">
                      error
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {auditReport.summary.recommendations.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-blue-600 dark:text-blue-400 mb-3">
                Recommendations
              </h4>
              <ul className="space-y-2">
                {auditReport.summary.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                      lightbulb
                    </span>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
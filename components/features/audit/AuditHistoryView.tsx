"use client";
import React, { useState, useEffect, useCallback } from "react";

interface AuditExecutionSummary {
  executionId: string;
  startTime: Date;
  duration: number;
  status: "pass" | "fail" | "warning";
  systemsPassed: number;
  systemsFailed: number;
  totalSystems: number;
  passRate: number;
}

interface AuditHistoryResponse {
  executions: AuditExecutionSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export default function AuditHistoryView() {
  const [historyData, setHistoryData] = useState<AuditHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);
  const pageSize = 10;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/audit/history?page=${currentPage}&pageSize=${pageSize}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to fetch audit history:", err);
      setError("Failed to fetch audit history");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleViewDetails = (executionId: string) => {
    setSelectedExecution(executionId);
    // This would typically open a modal or navigate to a detailed view
    // For now, we'll just highlight the selected execution
  };

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const totalPages = historyData ? Math.ceil(historyData.total / pageSize) : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Loading audit history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
          <span className="text-red-800 dark:text-red-200 font-medium">Error Loading History</span>
        </div>
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        <button
          onClick={fetchHistory}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!historyData || historyData.executions.length === 0) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-400 mb-4 block">history</span>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Audit History
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Execute your first audit to see historical results here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">history</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Audit History
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {historyData.total} total audit executions
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Execution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Results
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pass Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {historyData.executions.map((execution) => (
              <tr
                key={execution.executionId}
                className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                  selectedExecution === execution.executionId
                    ? "bg-primary/5 border-l-4 border-primary"
                    : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {execution.executionId.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(execution.startTime)}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                    <span className="material-symbols-outlined text-xs">
                      {getStatusIcon(execution.status)}
                    </span>
                    {execution.status.toUpperCase()}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 dark:text-slate-100">
                    {execution.systemsPassed}/{execution.totalSystems} systems
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {execution.systemsFailed} failed
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 dark:text-slate-100">
                    {formatDuration(execution.duration)}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${execution.passRate ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 min-w-[3rem]">
                      {(execution.passRate ?? 0).toFixed(1)}%
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(execution.executionId)}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        // Download report functionality
                        window.open(`/api/audit/reports/${execution.executionId}/download`, '_blank');
                      }}
                      className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      title="Download Report"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, historyData.total)} of {historyData.total} results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="px-2 text-slate-500">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? "bg-primary text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
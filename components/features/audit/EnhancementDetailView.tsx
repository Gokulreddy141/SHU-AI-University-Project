"use client";
import { useState, useEffect, useCallback } from "react";
import { PrioritizedEnhancement, ImplementationGuide, EnhancementStatus } from "@/lib/audit/types";

interface EnhancementDetailViewProps {
  enhancement: PrioritizedEnhancement;
  onBack: () => void;
}

export default function EnhancementDetailView({ enhancement }: EnhancementDetailViewProps) {
  const [guide, setGuide] = useState<ImplementationGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<EnhancementStatus>('status' in enhancement ? (enhancement as any).status : 'proposed');
  const [notes, setNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchImplementationGuide = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/audit/enhancements/${enhancement.id}/guide`);
      const data = await response.json();
      
      if (data.success) {
        setGuide(data.data.guide);
      } else {
        setError(data.error || 'Failed to fetch implementation guide');
      }
    } catch (err) {
      setError('Failed to fetch implementation guide');
      console.error('Error fetching guide:', err);
    } finally {
      setLoading(false);
    }
  }, [enhancement.id]);

  useEffect(() => {
    fetchImplementationGuide();
  }, [fetchImplementationGuide]);

  const updateStatus = async () => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/audit/enhancements/${enhancement.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });
      
      const data = await response.json();
      if (data.success) {
        // Status updated successfully
        setNotes('');
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      alert('Failed to update status');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "vision": return "visibility";
      case "audio": return "mic";
      case "behavioral": return "psychology";
      case "system": return "computer";
      default: return "category";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vision": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "audio": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "behavioral": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "system": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: EnhancementStatus) => {
    switch (status) {
      case "proposed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "approved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "in_progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhancement Overview */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(enhancement.category)}`}>
              <span className="material-symbols-outlined text-sm">
                {getCategoryIcon(enhancement.category)}
              </span>
              {enhancement.category.charAt(0).toUpperCase() + enhancement.category.slice(1)} AI
            </span>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
              {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
            </span>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {enhancement.priority}/10
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Priority Score
            </div>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-400 mb-4">
          {enhancement.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {enhancement.implementationEffort}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Implementation Effort
            </div>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {enhancement.demonstrationValue}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Demonstration Value
            </div>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {enhancement.estimatedHours}h
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Estimated Hours
            </div>
          </div>
          
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {enhancement.requiredLibraries.length}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Dependencies
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Priority Rationale</h4>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            {enhancement.priorityRationale}
          </p>
        </div>
      </div>

      {/* Status Management */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Status Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EnhancementStatus)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="proposed">Proposed</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about status change..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        
        <button
          onClick={updateStatus}
          disabled={updatingStatus}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updatingStatus ? 'Updating...' : 'Update Status'}
        </button>
      </div>

      {/* Implementation Guide */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-slate-600 dark:text-slate-400">Loading implementation guide...</span>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
            <span className="text-red-800 dark:text-red-200 font-medium">Error loading implementation guide</span>
          </div>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={fetchImplementationGuide}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : guide && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Implementation Overview
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {guide.overview}
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Technical Approach</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {guide.technicalApproach}
              </p>
            </div>
          </div>

          {/* Dependencies */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Required Dependencies
            </h3>
            <div className="space-y-3">
              {guide.requiredDependencies.map((dep, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {dep.name}
                    </h4>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      v{dep.version}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
                    {dep.purpose}
                  </p>
                  <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm text-slate-800 dark:text-slate-200">
                    {dep.installCommand}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Code Examples */}
          {guide.codeExamples.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Code Examples
              </h3>
              <div className="space-y-4">
                {guide.codeExamples.map((example, index) => (
                  <div key={index} className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {example.title}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {example.description}
                      </p>
                    </div>
                    <pre className="bg-slate-900 text-slate-100 p-4 overflow-x-auto text-sm">
                      <code>{example.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Points */}
          {guide.integrationPoints.length > 0 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Integration Points
              </h3>
              <div className="space-y-3">
                {guide.integrationPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="material-symbols-outlined text-primary mt-0.5">
                      {point.modificationType === 'new_file' ? 'add_circle' : 
                       point.modificationType === 'modify_existing' ? 'edit' : 'extension'}
                    </span>
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100">
                        {point.component}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {point.description}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 bg-slate-200 dark:bg-slate-600 text-xs rounded">
                        {point.modificationType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testing Strategy & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Testing Strategy
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {guide.testingStrategy}
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Estimated Timeline
              </h3>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {guide.estimatedTimeline}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
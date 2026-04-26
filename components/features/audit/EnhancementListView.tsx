"use client";
import { useState } from "react";
import { PrioritizedEnhancement, AICategory, EnhancementStatus } from "@/lib/audit/types";

interface EnhancementListViewProps {
  enhancements: PrioritizedEnhancement[];
  onEnhancementSelect: (enhancement: PrioritizedEnhancement) => void;
  onRefresh: () => void;
}

export default function EnhancementListView({ 
  enhancements, 
  onEnhancementSelect, 
  onRefresh 
}: EnhancementListViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<AICategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EnhancementStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"priority" | "effort" | "value">("priority");

  const filteredEnhancements = enhancements
    .filter(enhancement => 
      categoryFilter === "all" || enhancement.category === categoryFilter
    )
    .filter(enhancement => 
      statusFilter === "all" || (enhancement as unknown as Record<string, unknown>).status === statusFilter
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return b.priority - a.priority;
        case "effort":
          const effortOrder = { low: 1, medium: 2, high: 3 };
          return effortOrder[a.implementationEffort] - effortOrder[b.implementationEffort];
        case "value":
          const valueOrder = { low: 1, medium: 2, high: 3 };
          return valueOrder[b.demonstrationValue] - valueOrder[a.demonstrationValue];
        default:
          return 0;
      }
    });

  const getCategoryIcon = (category: AICategory) => {
    switch (category) {
      case "vision": return "visibility";
      case "audio": return "mic";
      case "behavioral": return "psychology";
      case "system": return "computer";
      default: return "category";
    }
  };

  const getCategoryColor = (category: AICategory) => {
    switch (category) {
      case "vision": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "audio": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "behavioral": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "system": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getValueColor = (value: string) => {
    switch (value) {
      case "high": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (priority >= 5) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Category:
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as AICategory | "all")}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Categories</option>
              <option value="vision">Vision AI</option>
              <option value="audio">Audio AI</option>
              <option value="behavioral">Behavioral AI</option>
              <option value="system">System AI</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EnhancementStatus | "all")}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="all">All Status</option>
              <option value="proposed">Proposed</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "priority" | "effort" | "value")}
              className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="priority">Priority</option>
              <option value="effort">Implementation Effort</option>
              <option value="value">Demonstration Value</option>
            </select>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
      </div>

      {/* Enhancement Cards */}
      <div className="grid gap-4">
        {filteredEnhancements.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-4 block">
              search_off
            </span>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              No enhancements found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your filters to see more results.
            </p>
          </div>
        ) : (
          filteredEnhancements.map((enhancement) => (
            <div
              key={enhancement.id}
              onClick={() => onEnhancementSelect(enhancement)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(enhancement.category)}`}>
                      <span className="material-symbols-outlined text-sm">
                        {getCategoryIcon(enhancement.category)}
                      </span>
                      {enhancement.category.charAt(0).toUpperCase() + enhancement.category.slice(1)} AI
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(enhancement.priority)}`}>
                      Priority {enhancement.priority}/10
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {enhancement.name}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                    {enhancement.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm text-slate-500">schedule</span>
                      <span className="text-slate-600 dark:text-slate-400">
                        {enhancement.estimatedHours}h
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEffortColor(enhancement.implementationEffort)}`}>
                      {enhancement.implementationEffort} effort
                    </span>
                    
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getValueColor(enhancement.demonstrationValue)}`}>
                      {enhancement.demonstrationValue} value
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {enhancement.priorityRationale}
                  </div>
                </div>

                <div className="ml-4">
                  <span className="material-symbols-outlined text-slate-400">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {filteredEnhancements.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {filteredEnhancements.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Enhancements
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredEnhancements.filter(e => e.priority >= 8).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                High Priority
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {filteredEnhancements.reduce((sum, e) => sum + e.estimatedHours, 0)}h
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Effort
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {filteredEnhancements.filter(e => e.demonstrationValue === 'high').length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                High Value
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
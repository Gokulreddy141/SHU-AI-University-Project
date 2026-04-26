"use client";
import React, { useState } from "react";
import { AICategory } from "@/lib/audit/types";

interface AuditExecutionControlsProps {
  onExecutionStart: (executionId: string) => void;
}

interface AuditOptions {
  categories: AICategory[];
  includePerformance: boolean;
  includeFalsePositiveAnalysis: boolean;
  includeEnhancementRecommendations: boolean;
  concurrency: number;
}

export default function AuditExecutionControls({ onExecutionStart }: AuditExecutionControlsProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [options, setOptions] = useState<AuditOptions>({
    categories: ["vision", "audio", "behavioral", "system"],
    includePerformance: true,
    includeFalsePositiveAnalysis: true,
    includeEnhancementRecommendations: true,
    concurrency: 4,
  });

  const categoryOptions = [
    { id: "vision", label: "Vision AI", description: "Face detection, gaze tracking, hand tracking (11 systems)", icon: "visibility" },
    { id: "audio", label: "Audio AI", description: "Voice activity, ambient noise, TTS detection (4 systems)", icon: "mic" },
    { id: "behavioral", label: "Behavioral AI", description: "Keystroke dynamics, mouse behavior (4 systems)", icon: "psychology" },
    { id: "system", label: "System AI", description: "Virtual camera, DevTools, screen recording (10 systems)", icon: "computer" },
  ];

  const handleCategoryToggle = (category: AICategory) => {
    setOptions(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleStartAudit = async () => {
    if (options.categories.length === 0) {
      alert("Please select at least one AI category to audit.");
      return;
    }

    setIsExecuting(true);
    try {
      const response = await fetch("/api/audit/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ options }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onExecutionStart(data.executionId);
    } catch (error) {
      console.error("Failed to start audit:", error);
      alert("Failed to start audit. Please try again.");
    } finally {
      setIsExecuting(false);
    }
  };

  const totalSystems = options.categories.reduce((total, category) => {
    switch (category) {
      case "vision": return total + 11;
      case "audio": return total + 4;
      case "behavioral": return total + 4;
      case "system": return total + 10;
      default: return total;
    }
  }, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <span className="material-symbols-outlined text-primary text-xl">science</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Audit Execution Controls
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configure and execute comprehensive AI capabilities audit
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Category Selection */}
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
            AI Categories to Audit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryOptions.map((category) => (
              <label
                key={category.id}
                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  options.categories.includes(category.id as AICategory)
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.categories.includes(category.id as AICategory)}
                  onChange={() => handleCategoryToggle(category.id as AICategory)}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-slate-600 dark:text-slate-400">
                      {category.icon}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {category.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {category.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Analysis Options */}
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
            Analysis Options
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.includePerformance}
                onChange={(e) => setOptions(prev => ({ ...prev, includePerformance: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Performance Benchmarking
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Measure FPS, latency, memory usage, and CPU performance
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.includeFalsePositiveAnalysis}
                onChange={(e) => setOptions(prev => ({ ...prev, includeFalsePositiveAnalysis: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  False Positive/Negative Detection
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Test legitimate vs. malpractice behaviors for accuracy analysis
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.includeEnhancementRecommendations}
                onChange={(e) => setOptions(prev => ({ ...prev, includeEnhancementRecommendations: e.target.checked }))}
                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Enhancement Recommendations
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Identify opportunities for additional AI capabilities
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Execution Settings */}
        <div>
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
            Execution Settings
          </h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Concurrency:</span>
              <select
                value={options.concurrency}
                onChange={(e) => setOptions(prev => ({ ...prev, concurrency: parseInt(e.target.value) }))}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value={1}>1 (Sequential)</option>
                <option value={2}>2 (Low)</option>
                <option value={4}>4 (Medium)</option>
                <option value={8}>8 (High)</option>
              </select>
            </label>
          </div>
        </div>

        {/* Summary and Execute Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Will audit <span className="font-medium text-slate-900 dark:text-slate-100">{totalSystems}</span> AI systems
            {options.includePerformance && ", measure performance"}
            {options.includeFalsePositiveAnalysis && ", analyze accuracy"}
            {options.includeEnhancementRecommendations && ", recommend enhancements"}
          </div>
          
          <button
            onClick={handleStartAudit}
            disabled={isExecuting || options.categories.length === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
              isExecuting || options.categories.length === 0
                ? "bg-slate-300 dark:bg-slate-600 text-slate-500 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Starting Audit...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Start Full Audit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
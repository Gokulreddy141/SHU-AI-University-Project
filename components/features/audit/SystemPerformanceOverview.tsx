"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PerformanceMetrics, BenchmarkComparison } from "@/lib/audit/types";

interface SystemPerformanceData {
  systemId: string;
  systemName: string;
  category: string;
  metrics: PerformanceMetrics;
  comparison: BenchmarkComparison;
  lastUpdated: Date;
}

interface SystemPerformanceOverviewProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function SystemPerformanceOverview({ dateRange }: SystemPerformanceOverviewProps) {
  const [performanceData, setPerformanceData] = useState<SystemPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // AI Systems organized by category
  const aiSystems = useMemo(() => ({
    vision: [
      { id: 'face-detection', name: 'Face Detection' },
      { id: 'gaze-tracking', name: 'Gaze Tracking' },
      { id: 'head-pose', name: 'Head Pose Estimation' },
      { id: 'blink-analysis', name: 'Blink Analysis' },
      { id: 'hand-tracking', name: 'Hand Tracking' },
      { id: 'object-detection', name: 'Object Detection' },
      { id: 'face-proximity', name: 'Face Proximity Detection' },
      { id: 'liveness-detection', name: 'Liveness Detection' },
      { id: 'micro-gaze', name: 'Micro-Gaze Tracking' },
      { id: 'lip-movement', name: 'Lip Movement Detection' },
      { id: 'biometric-recognition', name: 'Biometric Recognition' }
    ],
    audio: [
      { id: 'voice-activity', name: 'Voice Activity Detection' },
      { id: 'ambient-noise', name: 'Ambient Noise Analysis' },
      { id: 'audio-spoofing', name: 'Audio Spoofing Detection' },
      { id: 'lip-sync', name: 'Lip-Sync Verification' }
    ],
    behavioral: [
      { id: 'keystroke-dynamics', name: 'Keystroke Dynamics' },
      { id: 'mouse-behavior', name: 'Mouse Behavior Analysis' },
      { id: 'response-time', name: 'Response Time Profiling' },
      { id: 'typing-pattern', name: 'Typing Pattern Analysis' }
    ],
    system: [
      { id: 'virtual-camera', name: 'Virtual Camera Detection' },
      { id: 'virtual-device', name: 'Virtual Device Detection' },
      { id: 'browser-fingerprint', name: 'Browser Fingerprinting' },
      { id: 'extension-detection', name: 'Extension Detection' },
      { id: 'devtools-detection', name: 'DevTools Detection' },
      { id: 'screen-recording', name: 'Screen Recording Detection' },
      { id: 'multi-tab', name: 'Multi-Tab Detection' },
      { id: 'network-anomaly', name: 'Network Anomaly Detection' },
      { id: 'sandbox-vm', name: 'Sandbox/VM Detection' },
      { id: 'hardware-spoofing', name: 'Hardware Spoofing Detection' }
    ]
  }), []);

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allSystems = Object.entries(aiSystems).flatMap(([category, systems]) =>
        systems.map(system => ({ ...system, category }))
      );

      const performancePromises = allSystems.map(async (system) => {
        try {
          // Fetch latest performance data for each system
          const response = await fetch(
            `/api/audit/performance/${system.id}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
            {
              headers: {
                'x-user-id': 'dev-user-123',
                'x-user-role': 'recruiter'
              }
            }
          );

          if (!response.ok) {
            console.warn(`Failed to fetch performance data for ${system.id}`);
            return null;
          }

          const data = await response.json();
          
          if (data.performanceHistory && data.performanceHistory.length > 0) {
            const latest = data.performanceHistory[0];
            return {
              systemId: system.id,
              systemName: system.name,
              category: system.category,
              metrics: latest.metrics,
              comparison: latest.benchmarkComparison,
              lastUpdated: new Date(latest.timestamp)
            };
          }

          return null;
        } catch (error) {
          console.warn(`Error fetching performance data for ${system.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(performancePromises);
      const validResults = results.filter((result): result is SystemPerformanceData => result !== null);
      
      setPerformanceData(validResults);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, aiSystems]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'acceptable': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getMetricStatusColor = (meetsTarget: boolean) => {
    return meetsTarget 
      ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
      : 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  const filteredData = selectedCategory === "all" 
    ? performanceData 
    : performanceData.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-slate-600 dark:text-slate-400">Loading performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span className="text-red-800 dark:text-red-200">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Category:</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Categories</option>
          <option value="vision">Vision AI ({aiSystems.vision.length} systems)</option>
          <option value="audio">Audio AI ({aiSystems.audio.length} systems)</option>
          <option value="behavioral">Behavioral AI ({aiSystems.behavioral.length} systems)</option>
          <option value="system">System AI ({aiSystems.system.length} systems)</option>
        </select>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.map((system) => (
          <div key={system.systemId} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            {/* System Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{system.systemName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{system.category} AI</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.comparison.overallStatus)}`}>
                {system.comparison.overallStatus}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-3">
              {system.metrics.frameRate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Frame Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{system.metrics.frameRate.average.toFixed(1)} FPS</span>
                    <div className={`w-2 h-2 rounded-full ${getMetricStatusColor(system.metrics.frameRate.meetsTarget)}`}></div>
                  </div>
                </div>
              )}

              {system.metrics.latency && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Latency (avg)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{system.metrics.latency.average.toFixed(1)}ms</span>
                    <div className={`w-2 h-2 rounded-full ${getMetricStatusColor(system.metrics.latency.meetsTarget)}`}></div>
                  </div>
                </div>
              )}

              {system.metrics.memory && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Memory Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{system.metrics.memory.peak.toFixed(1)}MB</span>
                    <div className={`w-2 h-2 rounded-full ${getMetricStatusColor(!system.metrics.memory.exceedsThreshold)}`}></div>
                  </div>
                </div>
              )}

              {system.metrics.cpu && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">CPU Usage</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{system.metrics.cpu.average.toFixed(1)}%</span>
                    <div className={`w-2 h-2 rounded-full ${getMetricStatusColor(!system.metrics.cpu.exceedsThreshold)}`}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last updated: {system.lastUpdated.toLocaleString()}
              </p>
            </div>

            {/* Recommendations */}
            {system.comparison.recommendations.length > 0 && (
              <div className="mt-3">
                <details className="group">
                  <summary className="cursor-pointer text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm group-open:rotate-90 transition-transform">chevron_right</span>
                    View Recommendations
                  </summary>
                  <div className="mt-2 pl-4 space-y-1">
                    {system.comparison.recommendations.slice(0, 2).map((rec, index) => (
                      <p key={index} className="text-xs text-slate-600 dark:text-slate-400">{rec}</p>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-slate-400">analytics</span>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Performance Data</h3>
            <p className="text-slate-600 dark:text-slate-400">
              No performance data available for the selected date range and category.
            </p>
            <button
              onClick={fetchPerformanceData}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
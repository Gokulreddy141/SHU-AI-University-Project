"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Bottleneck, PerformanceMetrics, BenchmarkComparison } from "@/lib/audit/types";

interface BottleneckData extends Bottleneck {
  systemName: string;
  category: string;
  currentMetrics: PerformanceMetrics;
  recommendations: string[];
}

interface BottleneckIdentificationDisplayProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function BottleneckIdentificationDisplay({ dateRange }: BottleneckIdentificationDisplayProps) {
  const [bottlenecks, setBottlenecks] = useState<BottleneckData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  // AI Systems for bottleneck analysis
  const aiSystems = useMemo(() => [
    { id: 'face-detection', name: 'Face Detection', category: 'vision' },
    { id: 'gaze-tracking', name: 'Gaze Tracking', category: 'vision' },
    { id: 'head-pose', name: 'Head Pose Estimation', category: 'vision' },
    { id: 'blink-analysis', name: 'Blink Analysis', category: 'vision' },
    { id: 'hand-tracking', name: 'Hand Tracking', category: 'vision' },
    { id: 'object-detection', name: 'Object Detection', category: 'vision' },
    { id: 'face-proximity', name: 'Face Proximity Detection', category: 'vision' },
    { id: 'liveness-detection', name: 'Liveness Detection', category: 'vision' },
    { id: 'micro-gaze', name: 'Micro-Gaze Tracking', category: 'vision' },
    { id: 'lip-movement', name: 'Lip Movement Detection', category: 'vision' },
    { id: 'biometric-recognition', name: 'Biometric Recognition', category: 'vision' },
    { id: 'voice-activity', name: 'Voice Activity Detection', category: 'audio' },
    { id: 'ambient-noise', name: 'Ambient Noise Analysis', category: 'audio' },
    { id: 'audio-spoofing', name: 'Audio Spoofing Detection', category: 'audio' },
    { id: 'lip-sync', name: 'Lip-Sync Verification', category: 'audio' },
    { id: 'keystroke-dynamics', name: 'Keystroke Dynamics', category: 'behavioral' },
    { id: 'mouse-behavior', name: 'Mouse Behavior Analysis', category: 'behavioral' },
    { id: 'response-time', name: 'Response Time Profiling', category: 'behavioral' },
    { id: 'typing-pattern', name: 'Typing Pattern Analysis', category: 'behavioral' },
    { id: 'virtual-camera', name: 'Virtual Camera Detection', category: 'system' },
    { id: 'virtual-device', name: 'Virtual Device Detection', category: 'system' },
    { id: 'browser-fingerprint', name: 'Browser Fingerprinting', category: 'system' },
    { id: 'extension-detection', name: 'Extension Detection', category: 'system' },
    { id: 'devtools-detection', name: 'DevTools Detection', category: 'system' },
    { id: 'screen-recording', name: 'Screen Recording Detection', category: 'system' },
    { id: 'multi-tab', name: 'Multi-Tab Detection', category: 'system' },
    { id: 'network-anomaly', name: 'Network Anomaly Detection', category: 'system' },
    { id: 'sandbox-vm', name: 'Sandbox/VM Detection', category: 'system' },
    { id: 'hardware-spoofing', name: 'Hardware Spoofing Detection', category: 'system' }
  ], []);

  const identifyBottlenecks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const bottleneckPromises = aiSystems.map(async (system) => {
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
            return [];
          }

          const data = await response.json();
          
          if (data.performanceHistory && data.performanceHistory.length > 0) {
            const latest = data.performanceHistory[0];
            const metrics: PerformanceMetrics = latest.metrics;
            const comparison: BenchmarkComparison = latest.benchmarkComparison;

            // Identify bottlenecks based on performance metrics
            const systemBottlenecks: BottleneckData[] = [];

            // Check frame rate bottlenecks
            if (metrics.frameRate && !metrics.frameRate.meetsTarget) {
              const deviation = ((metrics.frameRate.target - metrics.frameRate.average) / metrics.frameRate.target) * 100;
              systemBottlenecks.push({
                systemId: system.id,
                systemName: system.name,
                category: system.category,
                metricName: 'frameRate',
                severity: deviation > 50 ? 'high' : deviation > 25 ? 'medium' : 'low',
                description: `Frame rate (${metrics.frameRate.average.toFixed(1)} FPS) is ${deviation.toFixed(1)}% below target (${metrics.frameRate.target} FPS)`,
                impact: `Reduced real-time performance may affect user experience and detection accuracy`,
                currentMetrics: metrics,
                recommendations: comparison.recommendations.filter(rec => rec.toLowerCase().includes('frame') || rec.toLowerCase().includes('fps'))
              });
            }

            // Check latency bottlenecks
            if (metrics.latency && !metrics.latency.meetsTarget) {
              const deviation = ((metrics.latency.average - metrics.latency.target) / metrics.latency.target) * 100;
              systemBottlenecks.push({
                systemId: system.id,
                systemName: system.name,
                category: system.category,
                metricName: 'latency',
                severity: deviation > 100 ? 'high' : deviation > 50 ? 'medium' : 'low',
                description: `Latency (${metrics.latency.average.toFixed(1)}ms) is ${deviation.toFixed(1)}% above target (${metrics.latency.target}ms)`,
                impact: `Increased response time may cause delays in violation detection and user interface responsiveness`,
                currentMetrics: metrics,
                recommendations: comparison.recommendations.filter(rec => rec.toLowerCase().includes('latency') || rec.toLowerCase().includes('optimization'))
              });
            }

            // Check memory bottlenecks
            if (metrics.memory && metrics.memory.exceedsThreshold) {
              const deviation = ((metrics.memory.peak - metrics.memory.threshold) / metrics.memory.threshold) * 100;
              systemBottlenecks.push({
                systemId: system.id,
                systemName: system.name,
                category: system.category,
                metricName: 'memory',
                severity: deviation > 50 ? 'high' : deviation > 25 ? 'medium' : 'low',
                description: `Memory usage (${metrics.memory.peak.toFixed(1)}MB) exceeds threshold (${metrics.memory.threshold}MB) by ${deviation.toFixed(1)}%`,
                impact: `High memory usage may lead to system instability and affect other AI systems`,
                currentMetrics: metrics,
                recommendations: comparison.recommendations.filter(rec => rec.toLowerCase().includes('memory') || rec.toLowerCase().includes('leak'))
              });
            }

            // Check CPU bottlenecks
            if (metrics.cpu && metrics.cpu.exceedsThreshold) {
              const deviation = ((metrics.cpu.average - metrics.cpu.threshold) / metrics.cpu.threshold) * 100;
              systemBottlenecks.push({
                systemId: system.id,
                systemName: system.name,
                category: system.category,
                metricName: 'cpu',
                severity: deviation > 50 ? 'high' : deviation > 25 ? 'medium' : 'low',
                description: `CPU usage (${metrics.cpu.average.toFixed(1)}%) exceeds threshold (${metrics.cpu.threshold}%) by ${deviation.toFixed(1)}%`,
                impact: `High CPU usage may slow down other processes and reduce overall system performance`,
                currentMetrics: metrics,
                recommendations: comparison.recommendations.filter(rec => rec.toLowerCase().includes('cpu') || rec.toLowerCase().includes('worker'))
              });
            }

            // Check for memory growth rate issues
            if (metrics.memory && metrics.memory.growth > 10) {
              systemBottlenecks.push({
                systemId: system.id,
                systemName: system.name,
                category: system.category,
                metricName: 'memoryGrowth',
                severity: metrics.memory.growth > 50 ? 'high' : metrics.memory.growth > 25 ? 'medium' : 'low',
                description: `Memory growth rate (${metrics.memory.growth.toFixed(1)}MB/min) indicates potential memory leak`,
                impact: `Continuous memory growth will eventually lead to system crashes and instability`,
                currentMetrics: metrics,
                recommendations: ['Investigate memory leak sources', 'Implement proper cleanup in AI processing loops', 'Monitor object lifecycle management']
              });
            }

            return systemBottlenecks;
          }

          return [];
        } catch (error) {
          console.warn(`Error analyzing bottlenecks for ${system.id}:`, error);
          return [];
        }
      });

      const results = await Promise.all(bottleneckPromises);
      const allBottlenecks = results.flat();
      
      // Sort by severity (high -> medium -> low)
      const severityOrder = { high: 3, medium: 2, low: 1 };
      allBottlenecks.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
      
      setBottlenecks(allBottlenecks);
    } catch (error) {
      console.error('Error identifying bottlenecks:', error);
      setError('Failed to identify performance bottlenecks');
    } finally {
      setLoading(false);
    }
  }, [dateRange, aiSystems]);

  useEffect(() => {
    identifyBottlenecks();
  }, [identifyBottlenecks]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'help';
    }
  };

  const getMetricIcon = (metricName: string) => {
    switch (metricName) {
      case 'frameRate': return 'speed';
      case 'latency': return 'schedule';
      case 'memory': return 'memory';
      case 'cpu': return 'developer_board';
      case 'memoryGrowth': return 'trending_up';
      default: return 'analytics';
    }
  };

  const filteredBottlenecks = selectedSeverity === "all" 
    ? bottlenecks 
    : bottlenecks.filter(bottleneck => bottleneck.severity === selectedSeverity);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-slate-600 dark:text-slate-400">Analyzing performance bottlenecks...</span>
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
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <span className="material-symbols-outlined text-red-600">error</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bottlenecks.filter(b => b.severity === 'high').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">High Severity</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <span className="material-symbols-outlined text-yellow-600">warning</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bottlenecks.filter(b => b.severity === 'medium').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Medium Severity</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <span className="material-symbols-outlined text-blue-600">info</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bottlenecks.filter(b => b.severity === 'low').length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Low Severity</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <span className="material-symbols-outlined text-slate-600">analytics</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {bottlenecks.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter by Severity:</label>
        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="all">All Severities ({bottlenecks.length})</option>
          <option value="high">High Severity ({bottlenecks.filter(b => b.severity === 'high').length})</option>
          <option value="medium">Medium Severity ({bottlenecks.filter(b => b.severity === 'medium').length})</option>
          <option value="low">Low Severity ({bottlenecks.filter(b => b.severity === 'low').length})</option>
        </select>
      </div>

      {/* Bottleneck List */}
      <div className="space-y-4">
        {filteredBottlenecks.map((bottleneck, index) => (
          <div key={`${bottleneck.systemId}-${bottleneck.metricName}-${index}`} className={`border rounded-lg p-6 ${getSeverityColor(bottleneck.severity)}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">{getSeverityIcon(bottleneck.severity)}</span>
                  <span className="material-symbols-outlined text-lg">{getMetricIcon(bottleneck.metricName)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{bottleneck.systemName}</h3>
                  <p className="text-sm opacity-80 capitalize">{bottleneck.category} AI • {bottleneck.metricName} Issue</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${getSeverityColor(bottleneck.severity)}`}>
                {bottleneck.severity} Priority
              </div>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Issue Description</h4>
                <p className="text-sm opacity-90">{bottleneck.description}</p>
              </div>

              {/* Impact */}
              <div>
                <h4 className="font-medium mb-2">Performance Impact</h4>
                <p className="text-sm opacity-90">{bottleneck.impact}</p>
              </div>

              {/* Current Metrics */}
              <div>
                <h4 className="font-medium mb-2">Current Performance Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {bottleneck.currentMetrics.frameRate && (
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded p-2">
                      <p className="font-medium">Frame Rate</p>
                      <p>{bottleneck.currentMetrics.frameRate.average.toFixed(1)} FPS</p>
                    </div>
                  )}
                  {bottleneck.currentMetrics.latency && (
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded p-2">
                      <p className="font-medium">Latency</p>
                      <p>{bottleneck.currentMetrics.latency.average.toFixed(1)}ms</p>
                    </div>
                  )}
                  {bottleneck.currentMetrics.memory && (
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded p-2">
                      <p className="font-medium">Memory</p>
                      <p>{bottleneck.currentMetrics.memory.peak.toFixed(1)}MB</p>
                    </div>
                  )}
                  {bottleneck.currentMetrics.cpu && (
                    <div className="bg-white/50 dark:bg-slate-800/50 rounded p-2">
                      <p className="font-medium">CPU</p>
                      <p>{bottleneck.currentMetrics.cpu.average.toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {bottleneck.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Optimization Recommendations</h4>
                  <ul className="space-y-1 text-sm">
                    {bottleneck.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-sm mt-0.5">arrow_right</span>
                        <span className="opacity-90">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBottlenecks.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No Performance Bottlenecks</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {selectedSeverity === "all" 
                ? "All AI systems are performing within acceptable parameters."
                : `No ${selectedSeverity} severity bottlenecks found.`}
            </p>
            <button
              onClick={identifyBottlenecks}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Refresh Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
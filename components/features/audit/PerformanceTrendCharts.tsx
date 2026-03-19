"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PerformanceMetrics } from "@/lib/audit/types";

interface PerformanceHistoryData {
  systemId: string;
  systemName: string;
  category: string;
  history: {
    timestamp: Date;
    metrics: PerformanceMetrics;
  }[];
}

interface PerformanceTrendChartsProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function PerformanceTrendCharts({ dateRange }: PerformanceTrendChartsProps) {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>("face-detection");
  const [selectedMetric, setSelectedMetric] = useState<string>("frameRate");

  // AI Systems for selection
  const aiSystems = useMemo(() => [
    { id: 'face-detection', name: 'Face Detection', category: 'vision' },
    { id: 'gaze-tracking', name: 'Gaze Tracking', category: 'vision' },
    { id: 'head-pose', name: 'Head Pose Estimation', category: 'vision' },
    { id: 'hand-tracking', name: 'Hand Tracking', category: 'vision' },
    { id: 'object-detection', name: 'Object Detection', category: 'vision' },
    { id: 'voice-activity', name: 'Voice Activity Detection', category: 'audio' },
    { id: 'ambient-noise', name: 'Ambient Noise Analysis', category: 'audio' },
    { id: 'keystroke-dynamics', name: 'Keystroke Dynamics', category: 'behavioral' },
    { id: 'mouse-behavior', name: 'Mouse Behavior Analysis', category: 'behavioral' },
    { id: 'virtual-camera', name: 'Virtual Camera Detection', category: 'system' },
    { id: 'devtools-detection', name: 'DevTools Detection', category: 'system' }
  ], []);

  const metricOptions = [
    { id: 'frameRate', name: 'Frame Rate (FPS)', unit: 'FPS' },
    { id: 'latency', name: 'Latency (ms)', unit: 'ms' },
    { id: 'memory', name: 'Memory Usage (MB)', unit: 'MB' },
    { id: 'cpu', name: 'CPU Usage (%)', unit: '%' }
  ];

  const fetchPerformanceHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/audit/performance/${selectedSystem}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
        {
          headers: {
            'x-user-id': 'dev-user-123',
            'x-user-role': 'recruiter'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch performance history');
      }

      const data = await response.json();
      
      if (data.performanceHistory && data.performanceHistory.length > 0) {
        const historyData: PerformanceHistoryData = {
          systemId: selectedSystem,
          systemName: data.systemName,
          category: aiSystems.find(s => s.id === selectedSystem)?.category || 'unknown',
          history: data.performanceHistory.map((item: Record<string, unknown>) => ({
            timestamp: new Date(item.timestamp as string | number | Date),
            metrics: item.metrics
          })).reverse() // Reverse to show chronological order
        };
        
        setPerformanceHistory([historyData]);
      } else {
        setPerformanceHistory([]);
      }
    } catch (error) {
      console.error('Error fetching performance history:', error);
      setError('Failed to load performance history');
    } finally {
      setLoading(false);
    }
  }, [selectedSystem, dateRange, aiSystems]);

  useEffect(() => {
    fetchPerformanceHistory();
  }, [fetchPerformanceHistory]);

  const getMetricValue = (metrics: PerformanceMetrics, metricType: string): number | null => {
    switch (metricType) {
      case 'frameRate':
        return metrics.frameRate?.average || null;
      case 'latency':
        return metrics.latency?.average || null;
      case 'memory':
        return metrics.memory?.average || null;
      case 'cpu':
        return metrics.cpu?.average || null;
      default:
        return null;
    }
  };

  const getMetricTarget = (metrics: PerformanceMetrics, metricType: string): number | null => {
    switch (metricType) {
      case 'frameRate':
        return metrics.frameRate?.target || null;
      case 'latency':
        return metrics.latency?.target || null;
      case 'memory':
        return metrics.memory?.threshold || null;
      case 'cpu':
        return metrics.cpu?.threshold || null;
      default:
        return null;
    }
  };

  const renderChart = () => {
    if (performanceHistory.length === 0 || !performanceHistory[0].history.length) {
      return (
        <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">trending_up</span>
            <p className="text-slate-600 dark:text-slate-400">No data available for selected system and date range</p>
          </div>
        </div>
      );
    }

    const systemData = performanceHistory[0];
    const chartData = systemData.history
      .map(item => ({
        timestamp: item.timestamp,
        value: getMetricValue(item.metrics, selectedMetric),
        target: getMetricTarget(item.metrics, selectedMetric)
      }))
      .filter(item => item.value !== null);

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">trending_up</span>
            <p className="text-slate-600 dark:text-slate-400">No {selectedMetric} data available for this system</p>
          </div>
        </div>
      );
    }

    // Simple line chart implementation using SVG
    const width = 800;
    const height = 300;
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const values = chartData.map(d => d.value!);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    const minTime = Math.min(...chartData.map(d => d.timestamp.getTime()));
    const maxTime = Math.max(...chartData.map(d => d.timestamp.getTime()));
    const timeRange = maxTime - minTime || 1;

    const getX = (timestamp: Date) => padding + ((timestamp.getTime() - minTime) / timeRange) * chartWidth;
    const getY = (value: number) => padding + ((maxValue - value) / valueRange) * chartHeight;

    // Generate path for line chart
    const pathData = chartData.map((d, i) => {
      const x = getX(d.timestamp);
      const y = getY(d.value!);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');

    // Target line if available
    const targetValue = chartData[0]?.target;
    const targetY = targetValue ? getY(targetValue) : null;

    const selectedMetricInfo = metricOptions.find(m => m.id === selectedMetric);

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {selectedMetricInfo?.name} - {systemData.systemName}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {chartData.length} data points from {chartData[0].timestamp.toLocaleDateString()} to {chartData[chartData.length - 1].timestamp.toLocaleDateString()}
          </p>
        </div>

        <div className="relative">
          <svg width={width} height={height} className="w-full h-auto">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200 dark:text-slate-700" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill="url(#grid)" />

            {/* Target line */}
            {targetY && (
              <line
                x1={padding}
                y1={targetY}
                x2={width - padding}
                y2={targetY}
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
            )}

            {/* Data line */}
            <path
              d={pathData}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {chartData.map((d, i) => (
              <circle
                key={i}
                cx={getX(d.timestamp)}
                cy={getY(d.value!)}
                r="4"
                fill="rgb(59, 130, 246)"
                stroke="white"
                strokeWidth="2"
              />
            ))}

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const value = minValue + ratio * valueRange;
              const y = padding + (1 - ratio) * chartHeight;
              return (
                <text
                  key={ratio}
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-slate-600 dark:fill-slate-400"
                >
                  {value.toFixed(1)}
                </text>
              );
            })}

            {/* X-axis labels */}
            {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 5)) === 0).map((d, i) => (
              <text
                key={i}
                x={getX(d.timestamp)}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-slate-600 dark:fill-slate-400"
              >
                {d.timestamp.toLocaleDateString()}
              </text>
            ))}

            {/* Axis lines */}
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-slate-300 dark:text-slate-600" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-slate-300 dark:text-slate-600" />
          </svg>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-slate-600 dark:text-slate-400">Actual Values</span>
            </div>
            {targetValue && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500 border-dashed border-t"></div>
                <span className="text-slate-600 dark:text-slate-400">Target ({targetValue.toFixed(1)} {selectedMetricInfo?.unit})</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Current</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {chartData[chartData.length - 1]?.value?.toFixed(1)} {selectedMetricInfo?.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Average</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)} {selectedMetricInfo?.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Best</p>
            <p className="text-lg font-semibold text-green-600">
              {(selectedMetric === 'latency' || selectedMetric === 'memory' || selectedMetric === 'cpu' ? minValue : maxValue).toFixed(1)} {selectedMetricInfo?.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Worst</p>
            <p className="text-lg font-semibold text-red-600">
              {(selectedMetric === 'latency' || selectedMetric === 'memory' || selectedMetric === 'cpu' ? maxValue : minValue).toFixed(1)} {selectedMetricInfo?.unit}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="text-slate-600 dark:text-slate-400">Loading performance trends...</span>
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
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">System:</label>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {aiSystems.map((system) => (
              <option key={system.id} value={system.id}>
                {system.name} ({system.category})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Metric:</label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          >
            {metricOptions.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {renderChart()}
    </div>
  );
}
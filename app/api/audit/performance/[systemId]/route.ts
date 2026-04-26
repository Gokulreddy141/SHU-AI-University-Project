import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PerformanceBenchmarkRecord from '@/models/PerformanceBenchmarkRecord';
import { getAuth } from '@/lib/apiUtils';

interface PerformanceTrend {
  metricName: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
}

interface GetSystemPerformanceResponse {
  systemId: string;
  systemName: string;
  performanceHistory: Record<string, unknown>[];
  trends: PerformanceTrend[];
}

/**
 * GET /api/audit/performance/:systemId
 * 
 * Returns performance history for a specific AI system with optional date filtering
 * and performance trend analysis.
 * 
 * Query Parameters:
 * - startDate: ISO date string for filtering start date
 * - endDate: ISO date string for filtering end date
 * 
 * Requirements: 4.9, 13.8
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ systemId: string }> }
): Promise<NextResponse> {
  try {
    // Validate authentication
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { systemId } = await params;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate systemId
    if (!systemId || typeof systemId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid systemId parameter' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Build date filter
    const dateFilter: Record<string, unknown> = { systemId };
    if (startDate || endDate) {
      (dateFilter as Record<string, unknown>).timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { error: 'Invalid startDate format. Use ISO date string.' },
            { status: 400 }
          );
        }
        ((dateFilter as Record<string, unknown>).timestamp as Record<string, unknown>).$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { error: 'Invalid endDate format. Use ISO date string.' },
            { status: 400 }
          );
        }
        ((dateFilter as Record<string, unknown>).timestamp as Record<string, unknown>).$lte = end;
      }
    }

    // Fetch performance history
    const performanceHistory = await PerformanceBenchmarkRecord.find(dateFilter)
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    if (performanceHistory.length === 0) {
      return NextResponse.json({
        systemId,
        systemName: getSystemName(systemId),
        performanceHistory: [],
        trends: []
      });
    }

    // Calculate performance trends
    const trends = calculatePerformanceTrends(performanceHistory);

    const response: GetSystemPerformanceResponse = {
      systemId,
      systemName: getSystemName(systemId),
      performanceHistory,
      trends
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('Error fetching system performance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate performance trends from historical data
 */
function calculatePerformanceTrends(history: Record<string, unknown>[]): PerformanceTrend[] {
  if (history.length < 2) {
    return [];
  }

  const trends: PerformanceTrend[] = [];
  const recent = history[0]; // Most recent (sorted desc)
  const older = history[Math.floor(history.length / 2)]; // Middle point for comparison

  // Analyze frame rate trend
  const recentMetrics = recent.metrics as Record<string, unknown> | undefined;
  const olderMetrics = older.metrics as Record<string, unknown> | undefined;
  
  if (recentMetrics?.frameRate && olderMetrics?.frameRate) {
    const recentFrameRate = recentMetrics.frameRate as Record<string, unknown>;
    const olderFrameRate = olderMetrics.frameRate as Record<string, unknown>;
    const recentFPS = recentFrameRate.average as number;
    const olderFPS = olderFrameRate.average as number;
    const change = ((recentFPS - olderFPS) / olderFPS) * 100;
    
    trends.push({
      metricName: 'frameRate',
      trend: change > 5 ? 'improving' : change < -5 ? 'degrading' : 'stable',
      changePercentage: Math.round(change * 100) / 100
    });
  }

  // Analyze latency trend
  if (recentMetrics?.latency && olderMetrics?.latency) {
    const recentLatency = recentMetrics.latency as Record<string, unknown>;
    const olderLatency = olderMetrics.latency as Record<string, unknown>;
    const recentLatencyAvg = recentLatency.average as number;
    const olderLatencyAvg = olderLatency.average as number;
    const change = ((recentLatencyAvg - olderLatencyAvg) / olderLatencyAvg) * 100;
    
    trends.push({
      metricName: 'latency',
      trend: change < -5 ? 'improving' : change > 5 ? 'degrading' : 'stable',
      changePercentage: Math.round(change * 100) / 100
    });
  }

  // Analyze memory trend
  if (recentMetrics?.memory && olderMetrics?.memory) {
    const recentMemory = recentMetrics.memory as Record<string, unknown>;
    const olderMemory = olderMetrics.memory as Record<string, unknown>;
    const recentMemoryAvg = recentMemory.average as number;
    const olderMemoryAvg = olderMemory.average as number;
    const change = ((recentMemoryAvg - olderMemoryAvg) / olderMemoryAvg) * 100;
    
    trends.push({
      metricName: 'memory',
      trend: change < -5 ? 'improving' : change > 10 ? 'degrading' : 'stable',
      changePercentage: Math.round(change * 100) / 100
    });
  }

  // Analyze CPU trend
  if (recentMetrics?.cpu && olderMetrics?.cpu) {
    const recentCPU = recentMetrics.cpu as Record<string, unknown>;
    const olderCPU = olderMetrics.cpu as Record<string, unknown>;
    const recentCPUAvg = recentCPU.average as number;
    const olderCPUAvg = olderCPU.average as number;
    const change = ((recentCPUAvg - olderCPUAvg) / olderCPUAvg) * 100;
    
    trends.push({
      metricName: 'cpu',
      trend: change < -5 ? 'improving' : change > 10 ? 'degrading' : 'stable',
      changePercentage: Math.round(change * 100) / 100
    });
  }

  return trends;
}

/**
 * Get human-readable system name from systemId
 */
function getSystemName(systemId: string): string {
  const systemNames: Record<string, string> = {
    'face-detection': 'Face Detection',
    'gaze-tracking': 'Gaze Tracking',
    'head-pose': 'Head Pose Estimation',
    'blink-analysis': 'Blink Analysis',
    'hand-tracking': 'Hand Tracking',
    'object-detection': 'Object Detection',
    'face-proximity': 'Face Proximity Detection',
    'liveness-detection': 'Liveness Detection',
    'micro-gaze': 'Micro-Gaze Tracking',
    'lip-movement': 'Lip Movement Detection',
    'biometric-recognition': 'Biometric Recognition',
    'voice-activity': 'Voice Activity Detection',
    'ambient-noise': 'Ambient Noise Analysis',
    'audio-spoofing': 'Audio Spoofing Detection',
    'lip-sync': 'Lip-Sync Verification',
    'keystroke-dynamics': 'Keystroke Dynamics',
    'mouse-behavior': 'Mouse Behavior Analysis',
    'response-time': 'Response Time Profiling',
    'typing-pattern': 'Typing Pattern Analysis',
    'virtual-camera': 'Virtual Camera Detection',
    'virtual-device': 'Virtual Device Detection',
    'browser-fingerprint': 'Browser Fingerprinting',
    'extension-detection': 'Extension Detection',
    'devtools-detection': 'DevTools Detection',
    'screen-recording': 'Screen Recording Detection',
    'multi-tab': 'Multi-Tab Detection',
    'network-anomaly': 'Network Anomaly Detection',
    'sandbox-vm': 'Sandbox/VM Detection',
    'hardware-spoofing': 'Hardware Spoofing Detection'
  };

  return systemNames[systemId] || systemId;
}
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import PerformanceBenchmarkRecord from '@/models/PerformanceBenchmarkRecord';
import { PerformanceAnalyzer } from '@/lib/audit/performance-analyzer';
import { getAuth } from '@/lib/apiUtils';
import { 
  PerformanceMetrics, 
  BenchmarkComparison,
  EnvironmentInfo 
} from '@/lib/audit/types';

interface BenchmarkSystemRequest {
  systemId: string;
  duration: number; // seconds
}

interface BenchmarkSystemResponse {
  systemId: string;
  metrics: PerformanceMetrics;
  comparison: BenchmarkComparison;
}

/**
 * POST /api/audit/performance/benchmark
 * 
 * Triggers a performance benchmark for a specific AI system and returns
 * metrics with comparison against target benchmarks.
 * 
 * Requirements: 4.1-4.8, 13.8
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Validate authentication
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: BenchmarkSystemRequest;
    try {
      body = await request.json();
    } catch {

      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate request parameters
    const { systemId, duration } = body;
    
    if (!systemId || typeof systemId !== 'string') {
      return NextResponse.json(
        { error: 'systemId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!duration || typeof duration !== 'number' || duration <= 0 || duration > 300) {
      return NextResponse.json(
        { error: 'duration is required and must be a number between 1 and 300 seconds' },
        { status: 400 }
      );
    }

    // Validate systemId exists in our known systems
    const validSystems = [
      'face-detection', 'gaze-tracking', 'head-pose', 'blink-analysis',
      'hand-tracking', 'object-detection', 'face-proximity', 'liveness-detection',
      'micro-gaze', 'lip-movement', 'biometric-recognition',
      'voice-activity', 'ambient-noise', 'audio-spoofing', 'lip-sync',
      'keystroke-dynamics', 'mouse-behavior', 'response-time', 'typing-pattern',
      'virtual-camera', 'virtual-device', 'browser-fingerprint', 'extension-detection',
      'devtools-detection', 'screen-recording', 'multi-tab', 'network-anomaly',
      'sandbox-vm', 'hardware-spoofing'
    ];

    if (!validSystems.includes(systemId)) {
      return NextResponse.json(
        { error: `Invalid systemId. Must be one of: ${validSystems.join(', ')}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Initialize performance analyzer
    const performanceAnalyzer = new PerformanceAnalyzer();

    // Execute performance benchmark based on system type
    let metrics: PerformanceMetrics;
    
    try {
      metrics = await executeBenchmark(performanceAnalyzer, systemId, duration);
    } catch (error) {

      console.error(`Benchmark execution failed for ${systemId}:`, error);
      return NextResponse.json(
        { error: `Failed to execute benchmark for ${systemId}: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Compare against benchmarks
    const comparison = performanceAnalyzer.compareAgainstBenchmarks(systemId, metrics);

    // Store benchmark results in database
    const executionId = `benchmark-${systemId}-${Date.now()}`;
    const environment = getEnvironmentInfo(request);

    const benchmarkRecord = new PerformanceBenchmarkRecord({
      executionId,
      systemId,
      timestamp: new Date(),
      metrics,
      benchmarkComparison: comparison,
      environment
    });

    await benchmarkRecord.save();

    const response: BenchmarkSystemResponse = {
      systemId,
      metrics,
      comparison
    };

    return NextResponse.json(response);

  } catch (error) {

    console.error('Error executing performance benchmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Execute benchmark for specific system type
 */
async function executeBenchmark(
  analyzer: PerformanceAnalyzer, 
  systemId: string, 
  duration: number
): Promise<PerformanceMetrics> {
  const metrics: PerformanceMetrics = {};

  // Vision AI systems - measure frame rate and latency
  const visionSystems = [
    'face-detection', 'gaze-tracking', 'head-pose', 'blink-analysis',
    'hand-tracking', 'object-detection', 'face-proximity', 'liveness-detection',
    'micro-gaze', 'lip-movement', 'biometric-recognition'
  ];

  // Audio AI systems - measure latency and CPU
  const audioSystems = [
    'voice-activity', 'ambient-noise', 'audio-spoofing', 'lip-sync'
  ];

  // Behavioral AI systems - measure latency and memory
  const behavioralSystems = [
    'keystroke-dynamics', 'mouse-behavior', 'response-time', 'typing-pattern'
  ];

  // System AI systems - measure latency and CPU
  const systemSystems = [
    'virtual-camera', 'virtual-device', 'browser-fingerprint', 'extension-detection',
    'devtools-detection', 'screen-recording', 'multi-tab', 'network-anomaly',
    'sandbox-vm', 'hardware-spoofing'
  ];

  if (visionSystems.includes(systemId)) {
    // Vision systems: measure frame rate, latency, memory, CPU
    metrics.frameRate = await analyzer.measureFrameRate(systemId, duration);
    metrics.latency = await analyzer.measureLatency(systemId, 100);
    metrics.memory = await analyzer.measureMemoryUsage(systemId, duration);
    metrics.cpu = await analyzer.measureCPUUsage(systemId, duration);
  } else if (audioSystems.includes(systemId)) {
    // Audio systems: measure latency, CPU (no frame rate)
    metrics.latency = await analyzer.measureLatency(systemId, 100);
    metrics.cpu = await analyzer.measureCPUUsage(systemId, duration);
    metrics.memory = await analyzer.measureMemoryUsage(systemId, duration);
  } else if (behavioralSystems.includes(systemId)) {
    // Behavioral systems: measure latency, memory
    metrics.latency = await analyzer.measureLatency(systemId, 50);
    metrics.memory = await analyzer.measureMemoryUsage(systemId, duration);
  } else if (systemSystems.includes(systemId)) {
    // System detection: measure latency, CPU
    metrics.latency = await analyzer.measureLatency(systemId, 20);
    metrics.cpu = await analyzer.measureCPUUsage(systemId, duration);
  }

  return metrics;
}

/**
 * Extract environment information from request
 */
function getEnvironmentInfo(request: NextRequest): EnvironmentInfo {
  const userAgent = request.headers.get('user-agent') || '';
  
  // Parse browser info from user agent
  let browser = 'unknown';
  let browserVersion = 'unknown';
  
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
    const match = userAgent.match(/Edge\/([0-9.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  }

  return {
    nodeVersion: process.version,
    platform: process.platform,
    browser,
    browserVersion,
    dependencies: {
      // Add key dependencies versions
      'next': '16.0.0', // This would be read from package.json in real implementation
      'react': '19.0.0',
      'typescript': '5.0.0'
    }
  };
}
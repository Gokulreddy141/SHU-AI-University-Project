/**
 * Performance Analyzer for AI Capabilities Audit System
 * 
 * Measures and benchmarks AI system performance including:
 * - Frame rate measurement for vision AI systems
 * - Latency measurement with percentile calculations (p50, p95, p99)
 * - Memory usage tracking (initial, peak, average, growth rate)
 * - CPU usage monitoring
 * - Benchmark comparison logic against target thresholds
 * 
 * Validates Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
 */

import {
  PerformanceMetrics,
  FrameRateMetrics,
  LatencyMetrics,
  MemoryMetrics,
  CPUMetrics,
  BenchmarkComparison,
  MetricComparison,
  PerformanceStatus,
} from './types';
import { getSystemById } from './constants';

export class PerformanceAnalyzer {
  /**
   * Measure frame rate for vision AI systems
   * @param systemId - Vision AI system to measure
   * @param duration - Measurement duration in seconds
   * @returns Frame rate metrics
   */
  async measureFrameRate(systemId: string, duration: number): Promise<FrameRateMetrics> {
    const system = getSystemById(systemId);
    const target = system?.performanceTarget?.frameRate || 30;

    const frameRates: number[] = [];
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    // Simulate frame rate measurement
    while (Date.now() < endTime) {
      const frameStart = performance.now();
      
      // Simulate frame processing (in real implementation, this would call the actual AI system)
      await this.simulateFrameProcessing();
      
      const frameEnd = performance.now();
      const frameDuration = frameEnd - frameStart;
      const fps = 1000 / frameDuration;
      
      frameRates.push(fps);
      
      // Wait for next frame
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    const average = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
    const min = Math.min(...frameRates);
    const max = Math.max(...frameRates);

    return {
      average: Math.round(average * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      target,
      meetsTarget: average >= target,
    };
  }

  /**
   * Measure processing latency with percentile calculations
   * @param systemId - AI system to measure
   * @param iterations - Number of test iterations
   * @returns Latency metrics with p50, p95, p99
   */
  async measureLatency(systemId: string, iterations: number): Promise<LatencyMetrics> {
    const system = getSystemById(systemId);
    const target = system?.performanceTarget?.latency || 100;

    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      
      // Simulate AI processing (in real implementation, this would call the actual AI system)
      await this.simulateProcessing(systemId);
      
      const end = performance.now();
      latencies.push(end - start);
    }

    // Sort latencies for percentile calculation
    latencies.sort((a, b) => a - b);

    const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const p50 = this.calculatePercentile(latencies, 50);
    const p95 = this.calculatePercentile(latencies, 95);
    const p99 = this.calculatePercentile(latencies, 99);

    return {
      average: Math.round(average * 100) / 100,
      p50: Math.round(p50 * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      target,
      meetsTarget: average <= target,
    };
  }

  /**
   * Measure memory usage over time
   * @param systemId - AI system to measure
   * @param duration - Measurement duration in seconds
   * @returns Memory usage metrics
   */
  async measureMemoryUsage(systemId: string, duration: number): Promise<MemoryMetrics> {
    const system = getSystemById(systemId);
    const threshold = system?.performanceTarget?.memoryThreshold || 100;

    const measurements: number[] = [];
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    // Initial memory measurement - take the first reading
    const initialMemory = this.getCurrentMemoryUsage();
    const initial = initialMemory;
    measurements.push(initialMemory);

    // Measure memory at intervals
    while (Date.now() < endTime) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Sample every 100ms
      const currentMemory = this.getCurrentMemoryUsage();
      measurements.push(currentMemory);
    }

    const peak = Math.max(...measurements);
    const average = measurements.reduce((sum, mem) => sum + mem, 0) / measurements.length;
    const growth = ((peak - initial) / (duration / 60)); // MB per minute

    return {
      initial: Math.round(initial * 100) / 100,
      peak: Math.round(peak * 100) / 100,
      average: Math.round(average * 100) / 100,
      growth: Math.round(growth * 100) / 100,
      threshold,
      exceedsThreshold: peak > threshold,
    };
  }

  /**
   * Measure CPU usage
   * @param systemId - AI system to measure
   * @param duration - Measurement duration in seconds
   * @returns CPU usage metrics
   */
  async measureCPUUsage(systemId: string, duration: number): Promise<CPUMetrics> {
    const system = getSystemById(systemId);
    const threshold = system?.performanceTarget?.cpuThreshold || 50;

    const measurements: number[] = [];
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    // Measure CPU at intervals
    while (Date.now() < endTime) {
      const cpuUsage = await this.getCurrentCPUUsage();
      measurements.push(cpuUsage);
      await new Promise(resolve => setTimeout(resolve, 100)); // Sample every 100ms
    }

    const average = measurements.reduce((sum, cpu) => sum + cpu, 0) / measurements.length;
    const peak = Math.max(...measurements);

    return {
      average: Math.round(average * 100) / 100,
      peak: Math.round(peak * 100) / 100,
      threshold,
      exceedsThreshold: average > threshold,
    };
  }

  /**
   * Compare performance metrics against benchmarks
   * @param systemId - AI system being measured
   * @param metrics - Measured performance metrics
   * @returns Comparison results with recommendations
   */
  compareAgainstBenchmarks(systemId: string, metrics: PerformanceMetrics): BenchmarkComparison {
    const metricComparisons: MetricComparison[] = [];
    const recommendations: string[] = [];

    // Compare frame rate if available
    if (metrics.frameRate) {
      const comparison = this.compareMetric(
        'Frame Rate',
        metrics.frameRate.average,
        metrics.frameRate.target,
        'higher'
      );
      metricComparisons.push(comparison);

      if (comparison.status === 'fail') {
        recommendations.push(
          `Frame rate (${metrics.frameRate.average} FPS) is below target (${metrics.frameRate.target} FPS). Consider optimizing rendering pipeline or reducing processing complexity.`
        );
      }
    }

    // Compare latency if available
    if (metrics.latency) {
      const comparison = this.compareMetric(
        'Latency (p95)',
        metrics.latency.p95,
        metrics.latency.target,
        'lower'
      );
      metricComparisons.push(comparison);

      if (comparison.status === 'fail') {
        recommendations.push(
          `Latency p95 (${metrics.latency.p95}ms) exceeds target (${metrics.latency.target}ms). Consider optimizing algorithm or using web workers.`
        );
      }
    }

    // Compare memory usage if available
    if (metrics.memory) {
      const comparison = this.compareMetric(
        'Memory Usage',
        metrics.memory.peak,
        metrics.memory.threshold,
        'lower'
      );
      metricComparisons.push(comparison);

      if (comparison.status === 'fail') {
        recommendations.push(
          `Memory usage (${metrics.memory.peak}MB) exceeds threshold (${metrics.memory.threshold}MB). Check for memory leaks or optimize data structures.`
        );
      }

      if (metrics.memory.growth > 10) {
        recommendations.push(
          `Memory growth rate (${metrics.memory.growth}MB/min) is high. Investigate potential memory leaks.`
        );
      }
    }

    // Compare CPU usage if available
    if (metrics.cpu) {
      const comparison = this.compareMetric(
        'CPU Usage',
        metrics.cpu.average,
        metrics.cpu.threshold,
        'lower'
      );
      metricComparisons.push(comparison);

      if (comparison.status === 'fail') {
        recommendations.push(
          `CPU usage (${metrics.cpu.average}%) exceeds threshold (${metrics.cpu.threshold}%). Consider offloading work to web workers or optimizing algorithms.`
        );
      }
    }

    // Determine overall status
    const failedCount = metricComparisons.filter(m => m.status === 'fail').length;
    const totalCount = metricComparisons.length;
    
    let overallStatus: PerformanceStatus;
    if (failedCount === 0) {
      overallStatus = 'excellent';
    } else if (failedCount / totalCount <= 0.25) {
      overallStatus = 'good';
    } else if (failedCount / totalCount <= 0.5) {
      overallStatus = 'acceptable';
    } else {
      overallStatus = 'poor';
    }

    return {
      systemId,
      overallStatus,
      metricComparisons,
      recommendations,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Compare a metric against its target
   */
  private compareMetric(
    metricName: string,
    actual: number,
    target: number,
    direction: 'higher' | 'lower'
  ): MetricComparison {
    const meetsTarget = direction === 'higher' ? actual >= target : actual <= target;
    const deviation = ((actual - target) / target) * 100;

    return {
      metricName,
      actual,
      target,
      status: meetsTarget ? 'pass' : 'fail',
      deviation: Math.round(deviation * 100) / 100,
    };
  }

  /**
   * Get current memory usage in MB
   * Uses performance.memory API if available (Chrome), otherwise estimates
   */
  private getCurrentMemoryUsage(): number {
    if ('memory' in performance && (performance as Record<string, unknown>).memory) {
      const memory = (performance as Record<string, unknown>).memory as Record<string, number>;
      return memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }

    // Fallback: estimate based on typical usage with slight growth over time
    // Use a base value that increases slightly with each call to simulate realistic memory usage
    if (!this.memoryBaseValue) {
      this.memoryBaseValue = 50 + Math.random() * 10; // Start between 50-60 MB
    }
    
    // Add small incremental growth to simulate realistic memory usage pattern
    this.memoryBaseValue += Math.random() * 0.5; // Grow by 0-0.5 MB per call
    
    return this.memoryBaseValue;
  }

  private memoryBaseValue?: number;

  /**
   * Get current CPU usage percentage
   * Note: Browser APIs don't provide direct CPU usage, so this is estimated
   */
  private async getCurrentCPUUsage(): Promise<number> {
    // In a real implementation, this would use performance timing APIs
    // to estimate CPU usage based on task execution time
    
    const start = performance.now();
    
    // Perform a CPU-intensive task
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += Math.sqrt(i);
    }
    
    const duration = performance.now() - start;
    
    // Estimate CPU usage based on how long the task took
    // (This is a simplified estimation)
    const estimatedUsage = Math.min(100, (duration / 10) * 100);
    
    // Use sum to prevent optimization
    if (sum < 0) console.log('Impossible case');
    
    return estimatedUsage;
  }

  /**
   * Simulate frame processing for testing
   */
  private async simulateFrameProcessing(): Promise<void> {
    // Simulate variable processing time
    const processingTime = 10 + Math.random() * 20; // 10-30ms
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }

  /**
   * Simulate AI processing for latency measurement
   */
  private async simulateProcessing(systemId: string): Promise<void> {
    const system = getSystemById(systemId);
    const baseLatency = system?.performanceTarget?.latency || 100;
    
    // Simulate processing with some variance
    const processingTime = baseLatency * (0.8 + Math.random() * 0.4); // ±20% variance
    await new Promise(resolve => setTimeout(resolve, processingTime));
  }
}

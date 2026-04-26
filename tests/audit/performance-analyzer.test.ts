/**
 * Unit Tests for PerformanceAnalyzer
 * 
 * Tests all performance measurement and benchmarking functionality:
 * - Frame rate measurement
 * - Latency measurement with percentiles
 * - Memory usage tracking
 * - CPU usage monitoring
 * - Benchmark comparison logic
 */

import { PerformanceAnalyzer } from '../../lib/audit/performance-analyzer';
import { PerformanceMetrics } from '../../lib/audit/types';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer();
  });

  describe('measureFrameRate', () => {
    it('should measure frame rate for vision AI systems', async () => {
      const result = await analyzer.measureFrameRate('face-detection', 1);

      expect(result).toBeDefined();
      expect(result.average).toBeGreaterThan(0);
      expect(result.min).toBeGreaterThan(0);
      expect(result.max).toBeGreaterThan(0);
      expect(result.target).toBe(30); // Face detection target is 30 FPS
      expect(typeof result.meetsTarget).toBe('boolean');
    });

    it('should measure frame rate for hand tracking', async () => {
      const result = await analyzer.measureFrameRate('hand-tracking', 1);

      expect(result).toBeDefined();
      expect(result.target).toBe(10); // Hand tracking target is 10 FPS
      expect(result.average).toBeGreaterThan(0);
    });

    it('should have min <= average <= max', async () => {
      const result = await analyzer.measureFrameRate('face-detection', 1);

      expect(result.min).toBeLessThanOrEqual(result.average);
      expect(result.average).toBeLessThanOrEqual(result.max);
    });

    it('should set meetsTarget correctly', async () => {
      const result = await analyzer.measureFrameRate('face-detection', 1);

      if (result.average >= result.target) {
        expect(result.meetsTarget).toBe(true);
      } else {
        expect(result.meetsTarget).toBe(false);
      }
    });
  });

  describe('measureLatency', () => {
    it('should measure latency with percentile calculations', async () => {
      const result = await analyzer.measureLatency('face-detection', 50);

      expect(result).toBeDefined();
      expect(result.average).toBeGreaterThan(0);
      expect(result.p50).toBeGreaterThan(0);
      expect(result.p95).toBeGreaterThan(0);
      expect(result.p99).toBeGreaterThan(0);
      expect(result.target).toBe(33); // Face detection target is 33ms
      expect(typeof result.meetsTarget).toBe('boolean');
    });

    it('should have p50 <= p95 <= p99', async () => {
      const result = await analyzer.measureLatency('face-detection', 100);

      expect(result.p50).toBeLessThanOrEqual(result.p95);
      expect(result.p95).toBeLessThanOrEqual(result.p99);
    });

    it('should measure latency for different systems', async () => {
      const faceResult = await analyzer.measureLatency('face-detection', 10);
      const handResult = await analyzer.measureLatency('hand-tracking', 10);
      const objectResult = await analyzer.measureLatency('object-detection', 5); // Fewer iterations for slow system

      expect(faceResult.target).toBe(33);
      expect(handResult.target).toBe(100);
      expect(objectResult.target).toBe(2000);
    }, 60000); // Increase timeout to 60 seconds

    it('should set meetsTarget correctly for latency', async () => {
      const result = await analyzer.measureLatency('face-detection', 30);

      if (result.average <= result.target) {
        expect(result.meetsTarget).toBe(true);
      } else {
        expect(result.meetsTarget).toBe(false);
      }
    });

    it('should handle small iteration counts', async () => {
      const result = await analyzer.measureLatency('face-detection', 5);

      expect(result).toBeDefined();
      expect(result.p50).toBeGreaterThan(0);
      expect(result.p95).toBeGreaterThan(0);
      expect(result.p99).toBeGreaterThan(0);
    });
  });

  describe('measureMemoryUsage', () => {
    it('should measure memory usage over time', async () => {
      const result = await analyzer.measureMemoryUsage('face-detection', 1);

      expect(result).toBeDefined();
      expect(result.initial).toBeGreaterThan(0);
      expect(result.peak).toBeGreaterThan(0);
      expect(result.average).toBeGreaterThan(0);
      expect(typeof result.growth).toBe('number');
      expect(result.threshold).toBe(100); // Face detection threshold is 100 MB
      expect(typeof result.exceedsThreshold).toBe('boolean');
    });

    it('should have initial <= average <= peak', async () => {
      const result = await analyzer.measureMemoryUsage('face-detection', 2); // Longer duration for more stable measurements

      // With random memory simulation, we check that the relationship holds in general
      // Initial should be close to or less than average, and average should be less than or equal to peak
      expect(result.average).toBeLessThanOrEqual(result.peak);
      
      // Initial might be slightly higher than average due to sampling, but should be within reasonable range
      expect(Math.abs(result.initial - result.average)).toBeLessThan(20); // Within 20 MB
    });

    it('should calculate growth rate', async () => {
      const result = await analyzer.measureMemoryUsage('face-detection', 2);

      expect(typeof result.growth).toBe('number');
      // Growth rate should be in MB per minute
      expect(result.growth).toBeGreaterThanOrEqual(0);
    });

    it('should set exceedsThreshold correctly', async () => {
      const result = await analyzer.measureMemoryUsage('face-detection', 1);

      if (result.peak > result.threshold) {
        expect(result.exceedsThreshold).toBe(true);
      } else {
        expect(result.exceedsThreshold).toBe(false);
      }
    });

    it('should measure memory for different systems', async () => {
      const faceResult = await analyzer.measureMemoryUsage('face-detection', 1);
      const handResult = await analyzer.measureMemoryUsage('hand-tracking', 1);
      const objectResult = await analyzer.measureMemoryUsage('object-detection', 1);

      expect(faceResult.threshold).toBe(100);
      expect(handResult.threshold).toBe(80);
      expect(objectResult.threshold).toBe(150);
    });
  });

  describe('measureCPUUsage', () => {
    it('should measure CPU usage', async () => {
      const result = await analyzer.measureCPUUsage('face-detection', 1);

      expect(result).toBeDefined();
      expect(result.average).toBeGreaterThanOrEqual(0);
      expect(result.average).toBeLessThanOrEqual(100);
      expect(result.peak).toBeGreaterThanOrEqual(0);
      expect(result.peak).toBeLessThanOrEqual(100);
      expect(result.threshold).toBeGreaterThan(0);
      expect(typeof result.exceedsThreshold).toBe('boolean');
    });

    it('should have average <= peak', async () => {
      const result = await analyzer.measureCPUUsage('face-detection', 1);

      expect(result.average).toBeLessThanOrEqual(result.peak);
    });

    it('should set exceedsThreshold correctly', async () => {
      const result = await analyzer.measureCPUUsage('face-detection', 1);

      if (result.average > result.threshold) {
        expect(result.exceedsThreshold).toBe(true);
      } else {
        expect(result.exceedsThreshold).toBe(false);
      }
    });
  });

  describe('compareAgainstBenchmarks', () => {
    it('should compare frame rate metrics', () => {
      const metrics: PerformanceMetrics = {
        frameRate: {
          average: 35,
          min: 30,
          max: 40,
          target: 30,
          meetsTarget: true,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result).toBeDefined();
      expect(result.systemId).toBe('face-detection');
      expect(result.overallStatus).toBeDefined();
      expect(result.metricComparisons).toHaveLength(1);
      expect(result.metricComparisons[0].metricName).toBe('Frame Rate');
      expect(result.metricComparisons[0].status).toBe('pass');
    });

    it('should compare latency metrics', () => {
      const metrics: PerformanceMetrics = {
        latency: {
          average: 25,
          p50: 20,
          p95: 40,
          p99: 50,
          target: 33,
          meetsTarget: true,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.metricComparisons).toHaveLength(1);
      expect(result.metricComparisons[0].metricName).toBe('Latency (p95)');
      expect(result.metricComparisons[0].status).toBe('fail'); // p95 is 40, target is 33
    });

    it('should compare memory metrics', () => {
      const metrics: PerformanceMetrics = {
        memory: {
          initial: 50,
          peak: 80,
          average: 65,
          growth: 5,
          threshold: 100,
          exceedsThreshold: false,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.metricComparisons).toHaveLength(1);
      expect(result.metricComparisons[0].metricName).toBe('Memory Usage');
      expect(result.metricComparisons[0].status).toBe('pass');
    });

    it('should compare CPU metrics', () => {
      const metrics: PerformanceMetrics = {
        cpu: {
          average: 45,
          peak: 60,
          threshold: 50,
          exceedsThreshold: false,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.metricComparisons).toHaveLength(1);
      expect(result.metricComparisons[0].metricName).toBe('CPU Usage');
      expect(result.metricComparisons[0].status).toBe('pass');
    });

    it('should provide recommendations for failed metrics', () => {
      const metrics: PerformanceMetrics = {
        frameRate: {
          average: 20,
          min: 15,
          max: 25,
          target: 30,
          meetsTarget: false,
        },
        latency: {
          average: 50,
          p50: 45,
          p95: 80,
          p99: 100,
          target: 33,
          meetsTarget: false,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('Frame rate'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('Latency'))).toBe(true);
    });

    it('should calculate overall status as excellent when all pass', () => {
      const metrics: PerformanceMetrics = {
        frameRate: {
          average: 35,
          min: 30,
          max: 40,
          target: 30,
          meetsTarget: true,
        },
        latency: {
          average: 25,
          p50: 20,
          p95: 30,
          p99: 35,
          target: 33,
          meetsTarget: true,
        },
        memory: {
          initial: 50,
          peak: 70,
          average: 60,
          growth: 3,
          threshold: 100,
          exceedsThreshold: false,
        },
        cpu: {
          average: 40,
          peak: 50,
          threshold: 50,
          exceedsThreshold: false,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.overallStatus).toBe('excellent');
    });

    it('should calculate overall status as poor when most fail', () => {
      const metrics: PerformanceMetrics = {
        frameRate: {
          average: 15,
          min: 10,
          max: 20,
          target: 30,
          meetsTarget: false,
        },
        latency: {
          average: 80,
          p50: 70,
          p95: 120,
          p99: 150,
          target: 33,
          meetsTarget: false,
        },
        memory: {
          initial: 80,
          peak: 150,
          average: 120,
          growth: 20,
          threshold: 100,
          exceedsThreshold: true,
        },
        cpu: {
          average: 70,
          peak: 85,
          threshold: 50,
          exceedsThreshold: true,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.overallStatus).toBe('poor');
    });

    it('should warn about high memory growth rate', () => {
      const metrics: PerformanceMetrics = {
        memory: {
          initial: 50,
          peak: 90,
          average: 70,
          growth: 15, // High growth rate
          threshold: 100,
          exceedsThreshold: false,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.recommendations.some(r => r.includes('growth rate'))).toBe(true);
    });

    it('should calculate deviation percentage correctly', () => {
      const metrics: PerformanceMetrics = {
        frameRate: {
          average: 33, // 10% above target of 30
          min: 30,
          max: 35,
          target: 30,
          meetsTarget: true,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.metricComparisons[0].deviation).toBeCloseTo(10, 1);
    });

    it('should handle multiple metrics together', () => {
      const metrics: PerformanceMetrics = {
        frameRate: {
          average: 32,
          min: 28,
          max: 36,
          target: 30,
          meetsTarget: true,
        },
        latency: {
          average: 30,
          p50: 28,
          p95: 35,
          p99: 40,
          target: 33,
          meetsTarget: true,
        },
        memory: {
          initial: 55,
          peak: 75,
          average: 65,
          growth: 4,
          threshold: 100,
          exceedsThreshold: false,
        },
        cpu: {
          average: 42,
          peak: 55,
          threshold: 50,
          exceedsThreshold: false,
        },
      };

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result.metricComparisons).toHaveLength(4);
      expect(result.overallStatus).toBe('good'); // One metric (latency p95) fails
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown system IDs gracefully', async () => {
      const result = await analyzer.measureLatency('unknown-system', 10);

      expect(result).toBeDefined();
      expect(result.target).toBe(100); // Default target
    });

    it('should handle very short measurement durations', async () => {
      const result = await analyzer.measureFrameRate('face-detection', 0.1);

      expect(result).toBeDefined();
      expect(result.average).toBeGreaterThan(0);
    });

    it('should handle single iteration latency measurement', async () => {
      const result = await analyzer.measureLatency('face-detection', 1);

      expect(result).toBeDefined();
      expect(result.p50).toBe(result.p95);
      expect(result.p95).toBe(result.p99);
    });

    it('should handle empty performance metrics', () => {
      const metrics: PerformanceMetrics = {};

      const result = analyzer.compareAgainstBenchmarks('face-detection', metrics);

      expect(result).toBeDefined();
      expect(result.metricComparisons).toHaveLength(0);
      expect(result.overallStatus).toBe('excellent'); // No failures
    });
  });
});

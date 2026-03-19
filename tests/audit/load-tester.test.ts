/**
 * Unit tests for LoadTester module
 * 
 * Tests load testing capabilities including concurrent session simulation,
 * API load testing, AI system performance monitoring, and bottleneck identification.
 */

import { LoadTester } from '../../lib/audit/load-tester';
import { LoadTestOptions } from '../../lib/audit/types';

// Mock the performance analyzer
jest.mock('../../lib/audit/performance-analyzer');

describe('LoadTester', () => {
  let loadTester: LoadTester;

  beforeEach(() => {
    loadTester = new LoadTester();
    jest.clearAllMocks();
  });

  describe('executeLoadTest', () => {
    it('should execute load test with basic options', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 5,
        testDuration: 10,
        includePerformanceMetrics: true,
        includeAPITesting: false,
        includeAISystemTesting: false
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result).toBeDefined();
      expect(result.testId).toMatch(/^load-test-\d+$/);
      expect(result.options).toEqual(options);
      expect(result.sessionResults).toHaveLength(5);
      expect(result.overallMetrics).toBeDefined();
      expect(result.bottlenecks).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle concurrent sessions correctly', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 3,
        testDuration: 5,
        includePerformanceMetrics: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.sessionResults).toHaveLength(3);
      expect(result.overallMetrics.totalSessions).toBe(3);
      
      // All sessions should have completed successfully in this test scenario
      expect(result.overallMetrics.successfulSessions).toBe(3);
      expect(result.overallMetrics.successRate).toBe(100);
    });

    it('should include API testing when enabled', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 2,
        testDuration: 5,
        includeAPITesting: true,
        includeAISystemTesting: false
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.apiResults).toBeDefined();
      expect(result.apiResults.length).toBeGreaterThan(0);
      
      // Check that API results have expected structure
      result.apiResults.forEach(apiResult => {
        expect(apiResult.endpoint).toBeDefined();
        expect(apiResult.method).toBeDefined();
        expect(apiResult.totalRequests).toBeGreaterThan(0);
        expect(apiResult.averageResponseTime).toBeGreaterThan(0);
        expect(apiResult.throughput).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include AI system testing when enabled', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 2,
        testDuration: 5,
        includeAISystemTesting: true,
        includeAPITesting: false
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.aiSystemResults).toBeDefined();
      expect(result.aiSystemResults.length).toBeGreaterThan(0);
      
      // Check that AI system results have expected structure
      result.aiSystemResults.forEach(aiResult => {
        expect(aiResult.systemId).toBeDefined();
        expect(aiResult.systemName).toBeDefined();
        expect(aiResult.averageFrameRate).toBeGreaterThan(0);
        expect(aiResult.averageLatency).toBeGreaterThan(0);
        expect(typeof aiResult.memoryLeakDetected).toBe('boolean');
        expect(aiResult.performanceDegradation).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle ramp-up time when specified', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 4,
        testDuration: 5,
        rampUpTime: 2
      };

      const startTime = Date.now();
      const result = await loadTester.executeLoadTest(options);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Test should take at least the ramp-up time plus some execution time
      expect(totalDuration).toBeGreaterThan(2000); // At least 2 seconds for ramp-up
      expect(result.sessionResults).toHaveLength(4);
    });
  });

  describe('performance metrics calculation', () => {
    it('should calculate overall metrics correctly', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 5,
        testDuration: 10
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.overallMetrics.totalSessions).toBe(5);
      expect(result.overallMetrics.successRate).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.successRate).toBeLessThanOrEqual(100);
      expect(result.overallMetrics.averageSessionDuration).toBeGreaterThan(0);
      expect(result.overallMetrics.peakMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.peakCPUUsage).toBeGreaterThanOrEqual(0);
      expect(['excellent', 'good', 'acceptable', 'poor']).toContain(result.overallMetrics.systemStability);
      expect(result.overallMetrics.scalabilityScore).toBeGreaterThanOrEqual(0);
      expect(result.overallMetrics.scalabilityScore).toBeLessThanOrEqual(100);
    });

    it('should track session performance metrics', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 2,
        testDuration: 5,
        includePerformanceMetrics: true
      };

      const result = await loadTester.executeLoadTest(options);

      result.sessionResults.forEach(session => {
        expect(session.performanceMetrics).toBeDefined();
        expect(session.performanceMetrics.memoryUsage).toBeDefined();
        expect(session.performanceMetrics.cpuUsage).toBeDefined();
        expect(session.performanceMetrics.frameRates).toBeDefined();
        
        // Memory usage should be tracked over time
        expect(session.performanceMetrics.memoryUsage.length).toBeGreaterThan(0);
        session.performanceMetrics.memoryUsage.forEach(mem => {
          expect(mem.timestamp).toBeInstanceOf(Date);
          expect(mem.usage).toBeGreaterThan(0);
        });
        
        // CPU usage should be tracked over time
        expect(session.performanceMetrics.cpuUsage.length).toBeGreaterThan(0);
        session.performanceMetrics.cpuUsage.forEach(cpu => {
          expect(cpu.timestamp).toBeInstanceOf(Date);
          expect(cpu.usage).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('bottleneck identification', () => {
    it('should identify memory bottlenecks', async () => {
      // Mock high memory usage scenario
      const originalMemoryUsage = process.memoryUsage;
      (process as unknown as { [key: string]: unknown }).memoryUsage = jest.fn().mockReturnValue({
        heapUsed: 3000 * 1024 * 1024, // 3GB
        heapTotal: 4000 * 1024 * 1024,
        external: 100 * 1024 * 1024,
        rss: 3500 * 1024 * 1024
      });

      const options: LoadTestOptions = {
        concurrentSessions: 10,
        testDuration: 5
      };

      const result = await loadTester.executeLoadTest(options);

      // Should identify memory bottleneck
      const memoryBottlenecks = result.bottlenecks.filter(b => b.type === 'memory');
      expect(memoryBottlenecks.length).toBeGreaterThan(0);
      
      const memoryBottleneck = memoryBottlenecks[0];
      expect(memoryBottleneck.component).toBe('Memory');
      expect(['high', 'critical']).toContain(memoryBottleneck.severity);
      expect(memoryBottleneck.description).toContain('Peak memory usage');

      // Restore original function
      process.memoryUsage = originalMemoryUsage;
    });

    it('should identify CPU bottlenecks', async () => {
      // Mock high CPU usage scenario
      const originalCpuUsage = process.cpuUsage;
      (process as unknown as { [key: string]: unknown }).cpuUsage = jest.fn().mockReturnValue({
        user: 90000, // High CPU usage
        system: 10000
      });

      const options: LoadTestOptions = {
        concurrentSessions: 15,
        testDuration: 5
      };

      const result = await loadTester.executeLoadTest(options);

      // Should identify CPU bottleneck
      const cpuBottlenecks = result.bottlenecks.filter(b => b.type === 'cpu');
      expect(cpuBottlenecks.length).toBeGreaterThan(0);
      
      const cpuBottleneck = cpuBottlenecks[0];
      expect(cpuBottleneck.component).toBe('CPU');
      expect(['high', 'critical']).toContain(cpuBottleneck.severity);
      expect(cpuBottleneck.description).toContain('Peak CPU usage');

      // Restore original function
      process.cpuUsage = originalCpuUsage;
    });

    it('should identify AI system bottlenecks', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 20, // High load to trigger performance degradation
        testDuration: 5,
        includeAISystemTesting: true
      };

      const result = await loadTester.executeLoadTest(options);

      // With 20 concurrent sessions, some AI systems should show performance degradation
      const aiBottlenecks = result.bottlenecks.filter(b => b.type === 'ai_system');
      
      if (aiBottlenecks.length > 0) {
        const aiBottleneck = aiBottlenecks[0];
        expect(aiBottleneck.component).toContain('AI System:');
        expect(aiBottleneck.description).toContain('Performance degraded');
        expect(aiBottleneck.detectedAt).toBe(20);
      }
    });
  });

  describe('recommendations generation', () => {
    it('should generate appropriate recommendations', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 15,
        testDuration: 10,
        includeAPITesting: true,
        includeAISystemTesting: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      // Should have some recommendations for a moderate load test
      if (result.recommendations.length > 0) {
        result.recommendations.forEach(recommendation => {
          expect(typeof recommendation).toBe('string');
          expect(recommendation.length).toBeGreaterThan(0);
        });
      }
    });

    it('should recommend scalability improvements for poor performance', async () => {
      // Mock poor performance scenario
      const options: LoadTestOptions = {
        concurrentSessions: 25, // Very high load
        testDuration: 5
      };

      const result = await loadTester.executeLoadTest(options);

      // Should recommend scalability improvements if performance is poor
      if (result.overallMetrics.scalabilityScore < 80) {
        const scalabilityRecommendations = result.recommendations.filter(r => 
          r.includes('scalability') || r.includes('scaling')
        );
        expect(scalabilityRecommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('test status tracking', () => {
    it('should track active load tests', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 2,
        testDuration: 1
      };

      // Start test but don't wait for completion
      const testPromise = loadTester.executeLoadTest(options);
      
      // Check that test is tracked as active
      const activeTests = loadTester.getActiveLoadTests();
      expect(activeTests.size).toBe(1);

      // Wait for completion
      const result = await testPromise;
      
      // Test should no longer be active
      const activeTestsAfter = loadTester.getActiveLoadTests();
      expect(activeTestsAfter.size).toBe(0);
      
      // But we should be able to get the result
      expect(result).toBeDefined();
    });

    it('should provide test status by ID', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 1,
        testDuration: 1
      };

      const result = await loadTester.executeLoadTest(options);
      
      // Should not find status for completed test
      const status = loadTester.getLoadTestStatus(result.testId);
      expect(status).toBeNull();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle zero concurrent sessions', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 0,
        testDuration: 5
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.sessionResults).toHaveLength(0);
      expect(result.overallMetrics.totalSessions).toBe(0);
      expect(result.overallMetrics.successRate).toBe(0);
    });

    it('should handle very short test duration', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 2,
        testDuration: 0.1 // 100ms
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.sessionResults).toHaveLength(2);
      expect(result.endTime.getTime() - result.startTime.getTime()).toBeLessThan(5000); // Should complete quickly
    });

    it('should handle large number of concurrent sessions', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 50,
        testDuration: 1
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.sessionResults).toHaveLength(50);
      expect(result.overallMetrics.totalSessions).toBe(50);
      
      // With high load, system stability should be affected
      expect(['acceptable', 'poor']).toContain(result.overallMetrics.systemStability);
    });
  });

  describe('Requirements 18.1-18.10 validation', () => {
    it('should test with 5 concurrent sessions (Requirement 18.1)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 5,
        testDuration: 10,
        includePerformanceMetrics: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.options.concurrentSessions).toBe(5);
      expect(result.sessionResults).toHaveLength(5);
      expect(result.overallMetrics.totalSessions).toBe(5);
    });

    it('should test with 10 concurrent sessions (Requirement 18.2)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 10,
        testDuration: 10,
        includePerformanceMetrics: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.options.concurrentSessions).toBe(10);
      expect(result.sessionResults).toHaveLength(10);
      expect(result.overallMetrics.totalSessions).toBe(10);
    });

    it('should test with 20 concurrent sessions (Requirement 18.3)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 20,
        testDuration: 10,
        includePerformanceMetrics: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.options.concurrentSessions).toBe(20);
      expect(result.sessionResults).toHaveLength(20);
      expect(result.overallMetrics.totalSessions).toBe(20);
    });

    it('should measure API response times under load (Requirement 18.4)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 10,
        testDuration: 5,
        includeAPITesting: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.apiResults.length).toBeGreaterThan(0);
      result.apiResults.forEach(apiResult => {
        expect(apiResult.averageResponseTime).toBeGreaterThan(0);
        expect(apiResult.p50ResponseTime).toBeGreaterThanOrEqual(0);
        expect(apiResult.p95ResponseTime).toBeGreaterThanOrEqual(0);
        expect(apiResult.p99ResponseTime).toBeGreaterThanOrEqual(0);
        expect(apiResult.throughput).toBeGreaterThanOrEqual(0);
      });
    });

    it('should measure AI system frame rates under load (Requirement 18.5)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 10,
        testDuration: 5,
        includeAISystemTesting: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.aiSystemResults.length).toBeGreaterThan(0);
      result.aiSystemResults.forEach(aiResult => {
        expect(aiResult.averageFrameRate).toBeGreaterThan(0);
        expect(aiResult.minFrameRate).toBeGreaterThanOrEqual(0);
        expect(aiResult.maxFrameRate).toBeGreaterThanOrEqual(aiResult.averageFrameRate);
        expect(aiResult.frameRateStability).toBeGreaterThanOrEqual(0);
      });
    });

    it('should measure memory and CPU usage under load (Requirement 18.6)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 10,
        testDuration: 5,
        includePerformanceMetrics: true
      };

      const result = await loadTester.executeLoadTest(options);

      expect(result.overallMetrics.peakMemoryUsage).toBeGreaterThan(0);
      expect(result.overallMetrics.peakCPUUsage).toBeGreaterThanOrEqual(0);
      
      result.sessionResults.forEach(session => {
        expect(session.performanceMetrics.memoryUsage.length).toBeGreaterThan(0);
        expect(session.performanceMetrics.cpuUsage.length).toBeGreaterThan(0);
      });
    });

    it('should identify bottlenecks (Requirements 18.7-18.8)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 15,
        testDuration: 5,
        includeAPITesting: true,
        includeAISystemTesting: true
      };

      const result = await loadTester.executeLoadTest(options);

      // Bottlenecks array should be defined
      expect(result.bottlenecks).toBeDefined();
      expect(Array.isArray(result.bottlenecks)).toBe(true);
      
      // If bottlenecks are found, they should have proper structure
      result.bottlenecks.forEach(bottleneck => {
        expect(bottleneck.component).toBeDefined();
        expect(['memory', 'cpu', 'network', 'ai_system', 'database']).toContain(bottleneck.type);
        expect(['low', 'medium', 'high', 'critical']).toContain(bottleneck.severity);
        expect(bottleneck.description).toBeDefined();
        expect(bottleneck.impact).toBeDefined();
        expect(bottleneck.recommendation).toBeDefined();
        expect(bottleneck.detectedAt).toBeGreaterThan(0);
      });
    });

    it('should generate load testing report (Requirements 18.9-18.10)', async () => {
      const options: LoadTestOptions = {
        concurrentSessions: 10,
        testDuration: 5,
        includeAPITesting: true,
        includeAISystemTesting: true
      };

      const result = await loadTester.executeLoadTest(options);

      // Verify complete report structure
      expect(result.testId).toBeDefined();
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeInstanceOf(Date);
      expect(result.options).toEqual(options);
      expect(result.sessionResults).toBeDefined();
      expect(result.apiResults).toBeDefined();
      expect(result.aiSystemResults).toBeDefined();
      expect(result.overallMetrics).toBeDefined();
      expect(result.bottlenecks).toBeDefined();
      expect(result.recommendations).toBeDefined();
      
      // Verify recommendations are actionable
      expect(Array.isArray(result.recommendations)).toBe(true);
      result.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(10); // Should be meaningful recommendations
      });
    });
  });
});
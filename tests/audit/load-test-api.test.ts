/**
 * Integration tests for Load Testing API endpoints
 * 
 * Tests the load testing API endpoints for proper request handling,
 * validation, and response formatting.
 */

import { POST, GET } from '../../app/api/audit/load-test/route';
import { NextRequest } from 'next/server';
import { LoadTestResult, LoadTestOptions } from '../../lib/audit/types';

// Mock the LoadTester
jest.mock('../../lib/audit/load-tester', () => {
  return {
    LoadTester: jest.fn().mockImplementation(() => ({
      executeLoadTest: jest.fn().mockImplementation(async (options: LoadTestOptions): Promise<LoadTestResult> => {
        // Create a mock result that matches the expected structure
        return {
          testId: `load-test-${Date.now()}`,
          startTime: new Date(),
          endTime: new Date(),
          options,
          sessionResults: Array.from({ length: options.concurrentSessions }, (_, i) => ({
            sessionId: `session-${i}`,
            startTime: new Date(),
            endTime: new Date(),
            duration: 1000,
            status: 'completed' as const,
            errors: [],
            performanceMetrics: {
              memoryUsage: [{ timestamp: new Date(), usage: 100 }],
              cpuUsage: [{ timestamp: new Date(), usage: 50 }],
              networkLatency: 25,
              frameRates: []
            }
          })),
          apiResults: options.includeAPITesting ? [{
            endpoint: '/api/test',
            method: 'GET',
            totalRequests: 10,
            successfulRequests: 10,
            failedRequests: 0,
            averageResponseTime: 100,
            p50ResponseTime: 95,
            p95ResponseTime: 150,
            p99ResponseTime: 200,
            throughput: 10,
            errorRate: 0,
            errors: []
          }] : [],
          aiSystemResults: options.includeAISystemTesting ? [{
            systemId: 'face-detection',
            systemName: 'Face Detection',
            averageFrameRate: 25,
            minFrameRate: 20,
            maxFrameRate: 30,
            frameRateStability: 0.1,
            averageLatency: 50,
            maxLatency: 100,
            memoryLeakDetected: false,
            performanceDegradation: 5
          }] : [],
          overallMetrics: {
            totalSessions: options.concurrentSessions,
            successfulSessions: options.concurrentSessions,
            failedSessions: 0,
            successRate: 100,
            averageSessionDuration: 1000,
            peakMemoryUsage: 150,
            peakCPUUsage: 75,
            systemStability: 'excellent' as const,
            scalabilityScore: 95
          },
          bottlenecks: [],
          recommendations: ['Optimize memory usage', 'Consider horizontal scaling']
        };
      }),
      getActiveLoadTests: jest.fn().mockReturnValue(new Map()),
      getLoadTestStatus: jest.fn().mockReturnValue(null)
    }))
  };
});

describe('/api/audit/load-test', () => {
  describe('POST /api/audit/load-test', () => {
    it('should execute load test with valid options', async () => {
      const requestBody = {
        concurrentSessions: 10,
        testDuration: 30,
        includePerformanceMetrics: true,
        includeAPITesting: true,
        includeAISystemTesting: true
      };

      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.testId).toBeDefined();
      expect(data.result.options.concurrentSessions).toBe(10);
    });

    it('should use default values for missing options', async () => {
      const requestBody = {}; // Empty body

      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.options.concurrentSessions).toBe(5); // Default value
      expect(data.result.options.testDuration).toBe(30); // Default value
    });

    it('should validate concurrent sessions count', async () => {
      const requestBody = {
        concurrentSessions: 15, // Invalid value
        testDuration: 30
      };

      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid concurrent sessions count');
      expect(data.validValues).toEqual([5, 10, 20]);
    });

    it('should validate test duration', async () => {
      const requestBody = {
        concurrentSessions: 10,
        testDuration: 500 // Too long
      };

      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Test duration must be between 5 and 300 seconds');
      expect(data.provided).toBe(500);
    });

    it('should validate minimum test duration', async () => {
      const requestBody = {
        concurrentSessions: 5,
        testDuration: 2 // Too short
      };

      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Test duration must be between 5 and 300 seconds');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      // Should handle malformed JSON gracefully by using defaults
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.result.options.concurrentSessions).toBe(5); // Default value
    });

    it('should accept valid concurrent session values', async () => {
      const validSessions = [5, 10, 20];

      for (const sessions of validSessions) {
        const requestBody = {
          concurrentSessions: sessions,
          testDuration: 10
        };

        const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.result.options.concurrentSessions).toBe(sessions);
      }
    });

    it('should handle optional parameters correctly', async () => {
      const requestBody = {
        concurrentSessions: 10,
        testDuration: 20,
        rampUpTime: 5,
        includePerformanceMetrics: false,
        includeAPITesting: false,
        includeAISystemTesting: false
      };

      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.rampUpTime).toBe(5);
      expect(data.result.options.includePerformanceMetrics).toBe(false);
      expect(data.result.options.includeAPITesting).toBe(false);
      expect(data.result.options.includeAISystemTesting).toBe(false);
    });
  });

  describe('GET /api/audit/load-test', () => {
    it('should return load testing information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.info).toBeDefined();
      
      // Check supported concurrent sessions
      expect(data.info.supportedConcurrentSessions).toEqual([5, 10, 20]);
      
      // Check duration limits
      expect(data.info.minTestDuration).toBe(5);
      expect(data.info.maxTestDuration).toBe(300);
      
      // Check features
      expect(Array.isArray(data.info.features)).toBe(true);
      expect(data.info.features.length).toBeGreaterThan(0);
      
      // Check requirements
      expect(Array.isArray(data.info.requirements)).toBe(true);
      expect(data.info.requirements.length).toBe(8); // Should have 8 requirements (18.1-18.10)
      
      // Verify specific requirements are listed
      const requirementTexts = data.info.requirements.join(' ');
      expect(requirementTexts).toContain('18.1');
      expect(requirementTexts).toContain('18.2');
      expect(requirementTexts).toContain('18.3');
      expect(requirementTexts).toContain('5 concurrent sessions');
      expect(requirementTexts).toContain('10 concurrent sessions');
      expect(requirementTexts).toContain('20 concurrent sessions');
      
      // Check active tests count
      expect(typeof data.info.activeTests).toBe('number');
      expect(data.info.activeTests).toBeGreaterThanOrEqual(0);
    });

    it('should include all expected features', async () => {
      const response = await GET();
      const data = await response.json();

      const expectedFeatures = [
        'Concurrent session simulation',
        'API response time measurement',
        'AI system frame rate monitoring',
        'Memory and CPU usage tracking',
        'Bottleneck identification',
        'Performance recommendations'
      ];

      expectedFeatures.forEach(feature => {
        expect(data.info.features).toContain(feature);
      });
    });

    it('should include all requirements validation', async () => {
      const response = await GET();
      const data = await response.json();

      const expectedRequirements = [
        '18.1: Test with 5 concurrent sessions',
        '18.2: Test with 10 concurrent sessions',
        '18.3: Test with 20 concurrent sessions',
        '18.4: Measure API response times under load',
        '18.5: Measure AI system frame rates under load',
        '18.6: Measure memory and CPU usage under load',
        '18.7-18.8: Identify performance bottlenecks',
        '18.9-18.10: Generate load testing reports'
      ];

      expectedRequirements.forEach(requirement => {
        expect(data.info.requirements).toContain(requirement);
      });
    });
  });

  describe('Requirements 18.1-18.10 API validation', () => {
    it('should support 5 concurrent sessions (Requirement 18.1)', async () => {
      const requestBody = { concurrentSessions: 5, testDuration: 10 };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.concurrentSessions).toBe(5);
    });

    it('should support 10 concurrent sessions (Requirement 18.2)', async () => {
      const requestBody = { concurrentSessions: 10, testDuration: 10 };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.concurrentSessions).toBe(10);
    });

    it('should support 20 concurrent sessions (Requirement 18.3)', async () => {
      const requestBody = { concurrentSessions: 20, testDuration: 10 };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.concurrentSessions).toBe(20);
    });

    it('should enable API testing (Requirement 18.4)', async () => {
      const requestBody = { 
        concurrentSessions: 10, 
        testDuration: 10,
        includeAPITesting: true 
      };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.includeAPITesting).toBe(true);
      expect(data.result.apiResults).toBeDefined();
    });

    it('should enable AI system testing (Requirement 18.5)', async () => {
      const requestBody = { 
        concurrentSessions: 10, 
        testDuration: 10,
        includeAISystemTesting: true 
      };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.includeAISystemTesting).toBe(true);
      expect(data.result.aiSystemResults).toBeDefined();
    });

    it('should enable performance metrics (Requirement 18.6)', async () => {
      const requestBody = { 
        concurrentSessions: 10, 
        testDuration: 10,
        includePerformanceMetrics: true 
      };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.options.includePerformanceMetrics).toBe(true);
      expect(data.result.overallMetrics).toBeDefined();
      expect(data.result.overallMetrics.peakMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(data.result.overallMetrics.peakCPUUsage).toBeGreaterThanOrEqual(0);
    });

    it('should identify bottlenecks (Requirements 18.7-18.8)', async () => {
      const requestBody = { 
        concurrentSessions: 20, // High load to trigger bottlenecks
        testDuration: 10
      };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.bottlenecks).toBeDefined();
      expect(Array.isArray(data.result.bottlenecks)).toBe(true);
    });

    it('should generate recommendations (Requirements 18.9-18.10)', async () => {
      const requestBody = { 
        concurrentSessions: 10, // Use valid value instead of 15
        testDuration: 10
      };
      const request = new NextRequest('http://localhost:3000/api/audit/load-test', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result.recommendations).toBeDefined();
      expect(Array.isArray(data.result.recommendations)).toBe(true);
    });
  });
});
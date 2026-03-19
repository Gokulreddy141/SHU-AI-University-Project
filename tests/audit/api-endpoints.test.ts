/**
 * Tests for Audit API Endpoints
 * 
 * Tests all four audit API endpoints:
 * - POST /api/audit/execute
 * - GET /api/audit/status/:executionId
 * - GET /api/audit/results/:executionId
 * - GET /api/audit/history
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the audit engine orchestrator
jest.mock('@/lib/audit/audit-engine-orchestrator', () => ({
  AuditEngineOrchestrator: jest.fn<() => unknown>().mockImplementation(() => ({
    executeFullAudit: jest.fn<() => Promise<unknown>>().mockResolvedValue({
      executionId: 'test-execution-id',
      status: 'completed',
      results: {
        executionId: 'test-execution-id',
        timestamp: new Date(),
        duration: 30,
        overallStatus: 'pass',
        categoryResults: [],
        summary: {
          totalSystems: 29,
          systemsPassed: 25,
          systemsFailed: 2,
          systemsWarning: 2,
          passRate: 86.2,
          criticalIssues: [],
          recommendations: [],
        },
      }
    }),
  })),
}));

// Mock database operations
jest.mock('@/lib/audit/db-operations', () => ({
  createAuditExecutionRecord: jest.fn<() => Promise<unknown>>().mockResolvedValue({ _id: 'mock-id' }),
  updateAuditExecutionRecord: jest.fn<() => Promise<unknown>>().mockResolvedValue({ _id: 'mock-id' }),
  getAuditExecutionRecord: jest.fn<() => Promise<unknown>>(),
  getAuditExecutionHistory: jest.fn<() => Promise<unknown>>(),
  getAuditStatistics: jest.fn<() => Promise<unknown>>().mockResolvedValue({
    totalExecutions: 10,
    completedExecutions: 8,
    failedExecutions: 1,
    runningExecutions: 1,
    totalSystems: 29,
    systemsByCategory: {
      vision: 11,
      audio: 4,
      behavioral: 4,
      system: 10,
    },
    averagePassRate: 85.5,
  }),
}));

// Mock API utilities
jest.mock('@/lib/apiUtils', () => ({
  handleApiError: jest.fn().mockImplementation(() => {
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

describe('Audit API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/audit/execute', () => {
    it('should start audit execution with default options', async () => {
      const { POST } = await import('@/app/api/audit/execute/route');
      
      const request = new Request('http://localhost/api/audit/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('executionId');
      expect(data).toHaveProperty('status', 'started');
      expect(data).toHaveProperty('estimatedDuration');
      expect(data.executionId).toMatch(/^audit-\d+-[a-z0-9]+$/);
    });

    it('should start audit execution with custom options', async () => {
      const { POST } = await import('@/app/api/audit/execute/route');
      
      const request = new Request('http://localhost/api/audit/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: {
            categories: ['vision', 'audio'],
            includePerformance: false,
            includeFalsePositiveAnalysis: false,
            concurrency: 2,
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('executionId');
      expect(data).toHaveProperty('status', 'started');
      expect(data.estimatedDuration).toBeLessThan(100); // Should be shorter with fewer options
    });

    it('should reject invalid categories', async () => {
      const { POST } = await import('@/app/api/audit/execute/route');
      
      const request = new Request('http://localhost/api/audit/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: {
            categories: ['invalid-category'],
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Invalid categories provided');
      expect(data).toHaveProperty('invalidCategories', ['invalid-category']);
    });

    it('should reject invalid concurrency values', async () => {
      const { POST } = await import('@/app/api/audit/execute/route');
      
      const request = new Request('http://localhost/api/audit/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: {
            concurrency: 15, // Too high
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Concurrency must be between 1 and 10');
    });
  });

  describe('GET /api/audit/status/:executionId', () => {
    it('should return status for running audit', async () => {
      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        executionId: 'test-execution-id',
        startTime: new Date(Date.now() - 10000), // 10 seconds ago
        status: 'running',
        auditOptions: {
          categories: ['vision', 'audio'],
          includePerformance: true,
        },
        triggeredBy: 'api',
      });

      const { GET } = await import('@/app/api/audit/status/[executionId]/route');
      
      const request = new Request('http://localhost/api/audit/status/test-execution-id');
      const response = await GET(request, { params: Promise.resolve({ executionId: 'test-execution-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('executionId', 'test-execution-id');
      expect(data.status).toHaveProperty('isRunning', true);
      expect(data.status).toHaveProperty('currentPhase', 'executing');
      expect(data.status.progress).toBeGreaterThan(0);
    });

    it('should return status for completed audit', async () => {
      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        executionId: 'test-execution-id',
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(Date.now() - 30000),
        status: 'completed',
        auditOptions: { categories: ['vision'] },
        triggeredBy: 'api',
        results: { summary: { totalSystems: 11 } },
      });

      const { GET } = await import('@/app/api/audit/status/[executionId]/route');
      
      const request = new Request('http://localhost/api/audit/status/test-execution-id');
      const response = await GET(request, { params: Promise.resolve({ executionId: 'test-execution-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toHaveProperty('isRunning', false);
      expect(data.status).toHaveProperty('currentPhase', 'completed');
      expect(data.status).toHaveProperty('progress', 100);
      expect(data).toHaveProperty('partialResults');
    });

    it('should return 404 for non-existent execution', async () => {
      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock<() => Promise<unknown>>).mockResolvedValue(null);

      const { GET } = await import('@/app/api/audit/status/[executionId]/route');
      
      const request = new Request('http://localhost/api/audit/status/non-existent-id');
      const response = await GET(request, { params: Promise.resolve({ executionId: 'non-existent-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message', 'Audit execution not found');
    });
  });

  describe('GET /api/audit/results/:executionId', () => {
    it('should return complete results for completed audit', async () => {
      const mockResults = {
        executionId: 'test-execution-id',
        timestamp: new Date(),
        duration: 45,
        overallStatus: 'pass',
        categoryResults: [
          {
            category: 'vision',
            status: 'pass',
            totalSystems: 11,
            systemsPassed: 10,
            systemsFailed: 1,
            systemsWarning: 0,
          },
        ],
        summary: {
          totalSystems: 11,
          systemsPassed: 10,
          systemsFailed: 1,
          systemsWarning: 0,
          passRate: 90.9,
          criticalIssues: ['Face detection system failed validation'],
          recommendations: ['Update MediaPipe version'],
        },
      };

      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        executionId: 'test-execution-id',
        status: 'completed',
        results: mockResults,
        auditOptions: { categories: ['vision'] },
        triggeredBy: 'api',
        environment: { nodeVersion: 'v18.0.0' },
      });

      const { GET } = await import('@/app/api/audit/results/[executionId]/route');
      
      const request = new Request('http://localhost/api/audit/results/test-execution-id');
      const response = await GET(request, { params: Promise.resolve({ executionId: 'test-execution-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('executionId', 'test-execution-id');
      expect(data).toHaveProperty('results');
      expect(data.results.executionId).toBe(mockResults.executionId);
      expect(data.results.overallStatus).toBe(mockResults.overallStatus);
      expect(data.results.summary).toEqual(mockResults.summary);
      expect(data).toHaveProperty('metadata');
    });

    it('should return 202 for running audit', async () => {
      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        executionId: 'test-execution-id',
        status: 'running',
        startTime: new Date(),
      });

      const { GET } = await import('@/app/api/audit/results/[executionId]/route');
      
      const request = new Request('http://localhost/api/audit/results/test-execution-id');
      const response = await GET(request, { params: Promise.resolve({ executionId: 'test-execution-id' }) });
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('still running');
    });

    it('should return summary format when requested', async () => {
      const mockResults = {
        executionId: 'test-execution-id',
        timestamp: new Date(),
        duration: 45,
        overallStatus: 'pass',
        categoryResults: [
          {
            category: 'vision',
            status: 'pass',
            totalSystems: 11,
            systemsPassed: 10,
            systemsFailed: 1,
            systemsWarning: 0,
          },
        ],
        summary: {
          totalSystems: 11,
          systemsPassed: 10,
          systemsFailed: 1,
          systemsWarning: 0,
          passRate: 90.9,
          criticalIssues: [],
          recommendations: [],
        },
      };

      const { getAuditExecutionRecord } = await import('@/lib/audit/db-operations');
      (getAuditExecutionRecord as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        executionId: 'test-execution-id',
        status: 'completed',
        results: mockResults,
      });

      const { GET } = await import('@/app/api/audit/results/[executionId]/route');
      
      const request = new Request('http://localhost/api/audit/results/test-execution-id?format=summary');
      const response = await GET(request, { params: Promise.resolve({ executionId: 'test-execution-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('executionId');
      expect(data).toHaveProperty('summary');
      expect(data).toHaveProperty('categoryStats');
      expect(data.categoryStats[0]).toHaveProperty('passRate', 91); // Rounded
    });
  });

  describe('GET /api/audit/history', () => {
    it('should return paginated audit history', async () => {
      const { getAuditExecutionHistory } = await import('@/lib/audit/db-operations');
      (getAuditExecutionHistory as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        records: [
          {
            executionId: 'execution-1',
            startTime: new Date(Date.now() - 3600000),
            endTime: new Date(Date.now() - 3500000),
            status: 'completed',
            triggeredBy: 'api',
            auditOptions: { categories: ['vision'] },
            results: {
              summary: {
                totalSystems: 11,
                systemsPassed: 10,
                systemsFailed: 1,
                systemsWarning: 0,
                passRate: 90.9,
              },
              overallStatus: 'pass',
            },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });

      const { GET } = await import('@/app/api/audit/history/route');
      
      const request = new Request('http://localhost/api/audit/history');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('executions');
      expect(data).toHaveProperty('pagination');
      expect(data.executions).toHaveLength(1);
      expect(data.executions[0]).toHaveProperty('executionId', 'execution-1');
      expect(data.executions[0]).toHaveProperty('summary');
      expect(data.pagination).toHaveProperty('total', 1);
    });

    it('should include statistics when requested', async () => {
      const { getAuditExecutionHistory } = await import('@/lib/audit/db-operations');
      (getAuditExecutionHistory as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        records: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });

      const { GET } = await import('@/app/api/audit/history/route');
      
      const request = new Request('http://localhost/api/audit/history?includeStats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('statistics');
      expect(data.statistics).toHaveProperty('totalExecutions', 10);
      expect(data.statistics).toHaveProperty('averagePassRate', 85.5);
    });

    it('should validate query parameters', async () => {
      const { GET } = await import('@/app/api/audit/history/route');
      
      const request = new Request('http://localhost/api/audit/history?page=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message', 'Page must be >= 1');
    });

    it('should filter by status', async () => {
      const { getAuditExecutionHistory } = await import('@/lib/audit/db-operations');
      (getAuditExecutionHistory as jest.Mock<() => Promise<unknown>>).mockResolvedValue({
        records: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });

      const { GET } = await import('@/app/api/audit/history/route');
      
      const request = new Request('http://localhost/api/audit/history?status=completed');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(getAuditExecutionHistory).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ status: 'completed' })
      );
    });
  });
});
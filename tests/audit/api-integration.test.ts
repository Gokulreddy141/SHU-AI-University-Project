/**
 * Integration Tests for Audit API Endpoints
 * 
 * Tests the API endpoints with actual database operations
 * (using test database or mocked database operations)
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock the database connection to prevent actual database operations during tests
jest.mock('@/lib/db', () => ({
  __esModule: true,
  // @ts-expect-error - Mock return value type
  default: jest.fn().mockResolvedValue(true as any),
}));

// Mock the models to prevent actual database operations
jest.mock('@/models/AuditExecutionRecord', () => {
  const mockModel: any = jest.fn().mockImplementation((data: any) => ({
    ...(data || {}),
    _id: 'mock-id',
    // @ts-expect-error - Mock return value type
    save: jest.fn().mockResolvedValue(true as any),
  }));
  
  mockModel.create = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findOneAndUpdate = jest.fn();
  mockModel.find = jest.fn();
  mockModel.countDocuments = jest.fn();
  mockModel.deleteMany = jest.fn();
  mockModel.distinct = jest.fn();
  
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/models/SystemValidationRecord', () => {
  const mockModel: any = jest.fn().mockImplementation((data: any) => ({
    ...(data || {}),
    _id: 'mock-id',
    // @ts-expect-error - Mock return value type
    save: jest.fn().mockResolvedValue(true as any),
  }));
  
  mockModel.create = jest.fn();
  mockModel.find = jest.fn();
  mockModel.distinct = jest.fn();
  mockModel.deleteMany = jest.fn();
  
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/models/PerformanceBenchmarkRecord', () => {
  const mockModel: any = jest.fn().mockImplementation((data: any) => ({
    ...(data || {}),
    _id: 'mock-id',
    // @ts-expect-error - Mock return value type
    save: jest.fn().mockResolvedValue(true as any),
  }));
  
  mockModel.create = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.deleteMany = jest.fn();
  
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/models/EnhancementRecommendationRecord', () => {
  const mockModel: any = jest.fn().mockImplementation((data: any) => ({
    ...(data || {}),
    _id: 'mock-id',
    // @ts-expect-error - Mock return value type
    save: jest.fn().mockResolvedValue(true as any),
  }));
  
  mockModel.create = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.findOneAndUpdate = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findOneAndDelete = jest.fn();
  
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/models/CompatibilityTestRecord', () => {
  const mockModel: any = jest.fn().mockImplementation((data: any) => ({
    ...(data || {}),
    _id: 'mock-id',
    // @ts-expect-error - Mock return value type
    save: jest.fn().mockResolvedValue(true as any),
  }));
  
  mockModel.create = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.deleteMany = jest.fn();
  
  return {
    __esModule: true,
    default: mockModel,
  };
});

describe('Audit API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test environment - note: NODE_ENV is read-only in some environments
  });

  afterAll(async () => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('Full Audit Workflow', () => {
    it('should complete full audit workflow: execute -> status -> results', async () => {
      // Mock database responses
      const AuditExecutionRecord = (await import('@/models/AuditExecutionRecord')).default;
      const mockExecutionRecord = {
        _id: 'mock-id',
        executionId: 'test-workflow-execution',
        startTime: new Date(),
        status: 'running',
        auditOptions: {
          categories: ['vision'],
          includePerformance: true,
        },
        triggeredBy: 'api',
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
        },
        // @ts-expect-error - Mock return value type
        save: jest.fn().mockResolvedValue(true as any),
      };

      // Mock the constructor and static methods
      (AuditExecutionRecord as any).mockImplementation(() => mockExecutionRecord);
      (AuditExecutionRecord.findOne as any).mockResolvedValue(mockExecutionRecord);
      (AuditExecutionRecord.findOneAndUpdate as any).mockResolvedValue({
        ...mockExecutionRecord,
        status: 'completed',
        endTime: new Date(),
        results: {
          executionId: 'test-workflow-execution',
          overallStatus: 'pass',
          summary: {
            totalSystems: 11,
            systemsPassed: 10,
            systemsFailed: 1,
            systemsWarning: 0,
            passRate: 90.9,
          },
        },
      });

      // Step 1: Execute audit
      const { POST: executePost } = await import('@/app/api/audit/execute/route');
      const executeRequest = new Request('http://localhost/api/audit/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: {
            categories: ['vision'],
            includePerformance: true,
            includeFalsePositiveAnalysis: false,
            includeEnhancementRecommendations: false,
          },
        }),
      });

      const executeResponse = await executePost(executeRequest);
      const executeData = await executeResponse.json();

      expect(executeResponse.status).toBe(201);
      expect(executeData).toHaveProperty('executionId');
      expect(executeData).toHaveProperty('status', 'started');

      const executionId = executeData.executionId;

      // Step 2: Check status (running)
      const { GET: statusGet } = await import('@/app/api/audit/status/[executionId]/route');
      const statusRequest = new Request(`http://localhost/api/audit/status/${executionId}`);
      const statusResponse = await statusGet(statusRequest, { params: Promise.resolve({ executionId }) });
      const statusData = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(statusData.status).toHaveProperty('isRunning', true);

      // Step 3: Simulate completion and check results
      // Update mock to return completed status
      (AuditExecutionRecord.findOne as any).mockResolvedValue({
        ...mockExecutionRecord,
        status: 'completed',
        endTime: new Date(),
        results: {
          executionId,
          overallStatus: 'pass',
          summary: {
            totalSystems: 11,
            systemsPassed: 10,
            systemsFailed: 1,
            systemsWarning: 0,
            passRate: 90.9,
          },
        },
      });

      const { GET: resultsGet } = await import('@/app/api/audit/results/[executionId]/route');
      const resultsRequest = new Request(`http://localhost/api/audit/results/${executionId}`);
      const resultsResponse = await resultsGet(resultsRequest, { params: Promise.resolve({ executionId }) });
      const resultsData = await resultsResponse.json();

      expect(resultsResponse.status).toBe(200);
      expect(resultsData).toHaveProperty('executionId', executionId);
      expect(resultsData).toHaveProperty('results');
      expect(resultsData.results).toHaveProperty('overallStatus', 'pass');
    });

    it('should handle audit execution failure gracefully', async () => {
      const AuditExecutionRecord = (await import('@/models/AuditExecutionRecord')).default;
      
      // Mock failed execution
      (AuditExecutionRecord.findOne as any).mockResolvedValue({
        executionId: 'failed-execution',
        status: 'failed',
        startTime: new Date(Date.now() - 60000),
        endTime: new Date(Date.now() - 30000),
      });

      const { GET: resultsGet } = await import('@/app/api/audit/results/[executionId]/route');
      const resultsRequest = new Request('http://localhost/api/audit/results/failed-execution');
      const resultsResponse = await resultsGet(resultsRequest, { params: Promise.resolve({ executionId: 'failed-execution' }) });
      const resultsData = await resultsResponse.json();

      expect(resultsResponse.status).toBe(500);
      expect(resultsData).toHaveProperty('message', 'Audit execution failed');
    });
  });

  describe('Audit History Management', () => {
    it('should retrieve audit history with proper pagination', async () => {
      const AuditExecutionRecord = (await import('@/models/AuditExecutionRecord')).default;
      
      // Mock history data
      const mockHistoryRecords = [
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
        {
          executionId: 'execution-2',
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 7100000),
          status: 'completed',
          triggeredBy: 'api',
          auditOptions: { categories: ['audio'] },
          results: {
            summary: {
              totalSystems: 4,
              systemsPassed: 4,
              systemsFailed: 0,
              systemsWarning: 0,
              passRate: 100,
            },
            overallStatus: 'pass',
          },
        },
      ];

      (AuditExecutionRecord.find as any).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            // @ts-expect-error - Mock return value type
            limit: jest.fn().mockResolvedValue(mockHistoryRecords),
          }),
        }),
      });
      (AuditExecutionRecord.countDocuments as any).mockResolvedValue(2);

      const { GET: historyGet } = await import('@/app/api/audit/history/route');
      const historyRequest = new Request('http://localhost/api/audit/history?page=1&pageSize=10');
      const historyResponse = await historyGet(historyRequest);
      const historyData = await historyResponse.json();

      expect(historyResponse.status).toBe(200);
      expect(historyData).toHaveProperty('executions');
      expect(historyData.executions).toHaveLength(2);
      expect(historyData).toHaveProperty('pagination');
      expect(historyData.pagination).toHaveProperty('total', 2);
      expect(historyData.pagination).toHaveProperty('totalPages', 1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      const AuditExecutionRecord = (await import('@/models/AuditExecutionRecord')).default;
      (AuditExecutionRecord as any).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const { POST: executePost } = await import('@/app/api/audit/execute/route');
      const executeRequest = new Request('http://localhost/api/audit/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const executeResponse = await executePost(executeRequest);
      
      expect(executeResponse.status).toBe(500);
    });

    it('should validate request parameters properly', async () => {
      const { GET: statusGet } = await import('@/app/api/audit/status/[executionId]/route');
      const statusRequest = new Request('http://localhost/api/audit/status/');
      const statusResponse = await statusGet(statusRequest, { params: Promise.resolve({ executionId: '' }) });
      const statusData = await statusResponse.json();

      expect(statusResponse.status).toBe(400);
      expect(statusData).toHaveProperty('message', 'Execution ID is required');
    });
  });

  describe('API Response Formats', () => {
    it('should support different result formats', async () => {
      const AuditExecutionRecord = (await import('@/models/AuditExecutionRecord')).default;
      
      (AuditExecutionRecord.findOne as any).mockResolvedValue({
        executionId: 'format-test',
        status: 'completed',
        results: {
          executionId: 'format-test',
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
          },
        },
      });

      // Test summary format
      const { GET: resultsGet } = await import('@/app/api/audit/results/[executionId]/route');
      const summaryRequest = new Request('http://localhost/api/audit/results/format-test?format=summary');
      const summaryResponse = await resultsGet(summaryRequest, { params: Promise.resolve({ executionId: 'format-test' }) });
      const summaryData = await summaryResponse.json();

      expect(summaryResponse.status).toBe(200);
      expect(summaryData).toHaveProperty('summary');
      expect(summaryData).toHaveProperty('categoryStats');
      expect(summaryData.categoryStats[0]).toHaveProperty('passRate', 91); // Rounded

      // Test category filter
      const categoryRequest = new Request('http://localhost/api/audit/results/format-test?category=vision');
      const categoryResponse = await resultsGet(categoryRequest, { params: Promise.resolve({ executionId: 'format-test' }) });
      const categoryData = await categoryResponse.json();

      expect(categoryResponse.status).toBe(200);
      expect(categoryData.results.categoryResults).toHaveLength(1);
      expect(categoryData.results.categoryResults[0].category).toBe('vision');
    });
  });
});
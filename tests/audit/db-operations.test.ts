/**
 * Database Operations Tests for AI Capabilities Audit System
 * 
 * Tests CRUD operations and queries for audit records, validation results,
 * performance metrics, and enhancement recommendations.
 */

import {
  createAuditExecutionRecord,
  updateAuditExecutionRecord,
  getAuditExecutionRecord,
  getAuditExecutionHistory,
  createSystemValidationRecord,
  getSystemValidationRecords,
  createPerformanceBenchmarkRecord,
  getPerformanceBenchmarkHistory,
  createEnhancementRecommendation,
  getEnhancementRecommendations,
  createCompatibilityTestRecord,
  getCompatibilityTestRecords,
  getAuditStatistics,
} from '@/lib/audit/db-operations';
import {
  AuditExecutionRecordData,
  SystemValidationRecordData,
  PerformanceBenchmarkRecordData,
  EnhancementRecommendationRecordData,
  CompatibilityTestRecordData,
} from '@/lib/audit/types';

// Mock database connection for testing
jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

// Mock mongoose models
const mockSave = jest.fn().mockResolvedValue({ _id: 'mock-id' });

jest.mock('@/models/AuditExecutionRecord', () => {
  const MockModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
  MockModel.findOne = jest.fn().mockResolvedValue({ executionId: 'test-exec-001' });
  MockModel.findOneAndUpdate = jest.fn().mockResolvedValue({ executionId: 'test-exec-001' });
  MockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    }),
  });
  MockModel.countDocuments = jest.fn().mockResolvedValue(0);
  MockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  return { __esModule: true, default: MockModel };
});

jest.mock('@/models/SystemValidationRecord', () => {
  const MockModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
  MockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([]),
  });
  MockModel.countDocuments = jest.fn().mockResolvedValue(0);
  MockModel.distinct = jest.fn().mockResolvedValue([]);
  MockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  return { __esModule: true, default: MockModel };
});

jest.mock('@/models/PerformanceBenchmarkRecord', () => {
  const MockModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
  MockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([]),
  });
  MockModel.findOne = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue({ systemId: 'test-system' }),
  });
  MockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  return { __esModule: true, default: MockModel };
});

jest.mock('@/models/EnhancementRecommendationRecord', () => {
  const MockModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
  MockModel.findOne = jest.fn().mockResolvedValue({ enhancementId: 'test-enh-001' });
  MockModel.findOneAndUpdate = jest.fn().mockResolvedValue({ enhancementId: 'test-enh-001' });
  MockModel.findOneAndDelete = jest.fn().mockResolvedValue({ enhancementId: 'test-enh-001' });
  MockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([]),
  });
  return { __esModule: true, default: MockModel };
});

jest.mock('@/models/CompatibilityTestRecord', () => {
  const MockModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));
  MockModel.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue([]),
  });
  MockModel.findOne = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue({ browser: 'Chrome' }),
  });
  MockModel.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 0 });
  return { __esModule: true, default: MockModel };
});

describe('Database Operations', () => {
  describe('Audit Execution Record Operations', () => {
    test('should create audit execution record', async () => {
      const data: AuditExecutionRecordData = {
        executionId: 'test-exec-001',
        startTime: new Date(),
        status: 'running',
        auditOptions: {
          categories: ['vision', 'audio'],
          includePerformance: true,
        },
        triggeredBy: 'test-user',
        environment: {
          nodeVersion: '18.0.0',
          platform: 'linux',
          dependencies: {},
        },
      };

      const result = await createAuditExecutionRecord(data);
      expect(result).toBeDefined();
    });

    test('should update audit execution record', async () => {
      const updates = { status: 'completed' as const, endTime: new Date() };
      const result = await updateAuditExecutionRecord('test-exec-001', updates);
      expect(result).toBeDefined();
    });

    test('should get audit execution record', async () => {
      const result = await getAuditExecutionRecord('test-exec-001');
      expect(result).toBeDefined();
    });

    test('should get audit execution history', async () => {
      const result = await getAuditExecutionHistory(1, 10);
      expect(result).toHaveProperty('records');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
    });
  });

  describe('System Validation Record Operations', () => {
    test('should create system validation record', async () => {
      const data: SystemValidationRecordData = {
        executionId: 'test-exec-001',
        systemId: 'face-detection',
        systemName: 'Face Detection',
        category: 'vision',
        timestamp: new Date(),
        status: 'pass',
        testResults: [
          {
            testName: 'Face detection initialization',
            status: 'pass',
            duration: 100,
          },
        ],
      };

      const result = await createSystemValidationRecord(data);
      expect(result).toBeDefined();
    });

    test('should get system validation records', async () => {
      const result = await getSystemValidationRecords('test-exec-001');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Performance Benchmark Record Operations', () => {
    test('should create performance benchmark record', async () => {
      const data: PerformanceBenchmarkRecordData = {
        executionId: 'test-exec-001',
        systemId: 'face-detection',
        timestamp: new Date(),
        metrics: {
          frameRate: {
            average: 30,
            min: 25,
            max: 35,
            target: 30,
            meetsTarget: true,
          },
        },
        benchmarkComparison: {
          systemId: 'face-detection',
          overallStatus: 'excellent',
          metricComparisons: [],
          recommendations: [],
        },
        environment: {
          nodeVersion: '18.0.0',
          platform: 'linux',
          dependencies: {},
        },
      };

      const result = await createPerformanceBenchmarkRecord(data);
      expect(result).toBeDefined();
    });

    test('should get performance benchmark history', async () => {
      const result = await getPerformanceBenchmarkHistory('face-detection');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Enhancement Recommendation Operations', () => {
    test('should create enhancement recommendation', async () => {
      const data: EnhancementRecommendationRecordData = {
        enhancementId: 'enh-001',
        name: 'Emotion Detection',
        category: 'vision',
        description: 'Add emotion detection using face-api.js',
        priority: 8,
        implementationEffort: 'medium',
        demonstrationValue: 'high',
        status: 'proposed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await createEnhancementRecommendation(data);
      expect(result).toBeDefined();
    });

    test('should get enhancement recommendations', async () => {
      const result = await getEnhancementRecommendations();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Compatibility Test Record Operations', () => {
    test('should create compatibility test record', async () => {
      const data: CompatibilityTestRecordData = {
        executionId: 'test-exec-001',
        browser: 'Chrome',
        browserVersion: '120.0',
        platform: 'Windows',
        timestamp: new Date(),
        systemCompatibility: [
          {
            systemId: 'face-detection',
            supported: true,
            testResults: [],
          },
        ],
        overallCompatibility: 95,
      };

      const result = await createCompatibilityTestRecord(data);
      expect(result).toBeDefined();
    });

    test('should get compatibility test records', async () => {
      const result = await getCompatibilityTestRecords('test-exec-001');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('should get audit statistics', async () => {
      const result = await getAuditStatistics();
      expect(result).toHaveProperty('totalExecutions');
      expect(result).toHaveProperty('completedExecutions');
      expect(result).toHaveProperty('failedExecutions');
      expect(result).toHaveProperty('runningExecutions');
      expect(result).toHaveProperty('totalSystems');
      expect(result).toHaveProperty('systemsByCategory');
      expect(result).toHaveProperty('averagePassRate');
    });
  });
});
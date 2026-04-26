/**
 * Infrastructure Tests for AI Capabilities Audit System
 * 
 * Tests core data models, types, and database operations.
 */

import {
  AICategory,
  ValidationStatus,
  AuditExecutionRecordData,
  SystemValidationRecordData,
  PerformanceBenchmarkRecordData,
  EnhancementRecommendationRecordData,
  CompatibilityTestRecordData,
} from '@/lib/audit/types';
import {
  AI_SYSTEMS,
  SYSTEMS_BY_CATEGORY,
  getSystemById,
  getSystemsByCategory,
  getAllSystemIds,
  getSystemCount,
  getCategorySystemCount,
  DEFAULT_PERFORMANCE_TARGETS,
  VIOLATION_SEVERITY_WEIGHTS,
} from '@/lib/audit/constants';

describe('Audit System Infrastructure', () => {
  describe('AI Systems Registry', () => {
    test('should have 29+ AI detection systems defined', () => {
      expect(AI_SYSTEMS.length).toBeGreaterThanOrEqual(29);
    });

    test('should have 11 Vision AI systems', () => {
      const visionSystems = SYSTEMS_BY_CATEGORY.vision;
      expect(visionSystems.length).toBe(11);
    });

    test('should have 4 Audio AI systems', () => {
      const audioSystems = SYSTEMS_BY_CATEGORY.audio;
      expect(audioSystems.length).toBe(4);
    });

    test('should have 4 Behavioral AI systems', () => {
      const behavioralSystems = SYSTEMS_BY_CATEGORY.behavioral;
      expect(behavioralSystems.length).toBe(4);
    });

    test('should have 10 System AI systems', () => {
      const systemSystems = SYSTEMS_BY_CATEGORY.system;
      expect(systemSystems.length).toBe(10);
    });

    test('should retrieve system by ID', () => {
      const system = getSystemById('face-detection');
      expect(system).toBeDefined();
      expect(system?.name).toBe('Face Detection');
      expect(system?.category).toBe('vision');
    });

    test('should retrieve systems by category', () => {
      const visionSystems = getSystemsByCategory('vision');
      expect(visionSystems.length).toBe(11);
      expect(visionSystems.every((s) => s.category === 'vision')).toBe(true);
    });

    test('should get all system IDs', () => {
      const systemIds = getAllSystemIds();
      expect(systemIds.length).toBe(AI_SYSTEMS.length);
      expect(systemIds).toContain('face-detection');
      expect(systemIds).toContain('voice-activity');
    });

    test('should get correct system counts', () => {
      expect(getSystemCount()).toBe(AI_SYSTEMS.length);
      expect(getCategorySystemCount('vision')).toBe(11);
      expect(getCategorySystemCount('audio')).toBe(4);
      expect(getCategorySystemCount('behavioral')).toBe(4);
      expect(getCategorySystemCount('system')).toBe(10);
    });

    test('all systems should have required properties', () => {
      AI_SYSTEMS.forEach((system) => {
        expect(system.id).toBeDefined();
        expect(system.name).toBeDefined();
        expect(system.category).toBeDefined();
        expect(system.description).toBeDefined();
        expect(system.technology).toBeDefined();
        expect(['vision', 'audio', 'behavioral', 'system']).toContain(
          system.category
        );
      });
    });

    test('all system IDs should be unique', () => {
      const ids = AI_SYSTEMS.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Performance Targets', () => {
    test('should have performance targets for all categories', () => {
      expect(DEFAULT_PERFORMANCE_TARGETS.vision).toBeDefined();
      expect(DEFAULT_PERFORMANCE_TARGETS.audio).toBeDefined();
      expect(DEFAULT_PERFORMANCE_TARGETS.behavioral).toBeDefined();
      expect(DEFAULT_PERFORMANCE_TARGETS.system).toBeDefined();
    });

    test('vision systems should have 30 FPS target', () => {
      expect(DEFAULT_PERFORMANCE_TARGETS.vision.frameRate).toBe(30);
    });

    test('audio systems should have 60 FPS target', () => {
      expect(DEFAULT_PERFORMANCE_TARGETS.audio.frameRate).toBe(60);
    });

    test('all performance targets should have valid values', () => {
      Object.values(DEFAULT_PERFORMANCE_TARGETS).forEach((target) => {
        if ('frameRate' in target && target.frameRate) expect(target.frameRate).toBeGreaterThan(0);
        if ('latency' in target && target.latency) expect(target.latency).toBeGreaterThan(0);
        if ('memoryThreshold' in target && target.memoryThreshold) expect(target.memoryThreshold).toBeGreaterThan(0);
        if ('cpuThreshold' in target && target.cpuThreshold) expect(target.cpuThreshold).toBeGreaterThan(0);
      });
    });
  });

  describe('Violation Severity Weights', () => {
    test('should have severity weights defined', () => {
      expect(Object.keys(VIOLATION_SEVERITY_WEIGHTS).length).toBeGreaterThan(0);
    });

    test('high severity violations should have weights 30-50', () => {
      expect(VIOLATION_SEVERITY_WEIGHTS.FACE_MISMATCH).toBe(50);
      expect(VIOLATION_SEVERITY_WEIGHTS.VIRTUAL_CAMERA).toBe(40);
      expect(VIOLATION_SEVERITY_WEIGHTS.SCREEN_RECORDING_DETECTED).toBe(40);
    });

    test('medium severity violations should have weights 10-25', () => {
      expect(VIOLATION_SEVERITY_WEIGHTS.LIP_SYNC_MISMATCH).toBe(25);
      expect(VIOLATION_SEVERITY_WEIGHTS.PHONE_DETECTED).toBe(25);
      expect(VIOLATION_SEVERITY_WEIGHTS.UNAUTHORIZED_MATERIAL).toBe(20);
    });

    test('low severity violations should have weights 2-10', () => {
      expect(VIOLATION_SEVERITY_WEIGHTS.LOOKING_AWAY).toBe(5);
      expect(VIOLATION_SEVERITY_WEIGHTS.TAB_SWITCH).toBe(5);
      expect(VIOLATION_SEVERITY_WEIGHTS.WINDOW_BLUR).toBe(3);
    });

    test('all weights should be positive numbers', () => {
      Object.values(VIOLATION_SEVERITY_WEIGHTS).forEach((weight) => {
        expect(weight).toBeGreaterThan(0);
        expect(weight).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Type Definitions', () => {
    test('should create valid AuditExecutionRecordData', () => {
      const record: AuditExecutionRecordData = {
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

      expect(record.executionId).toBe('test-exec-001');
      expect(record.status).toBe('running');
      expect(record.auditOptions.categories).toContain('vision');
    });

    test('should create valid SystemValidationRecordData', () => {
      const record: SystemValidationRecordData = {
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

      expect(record.systemId).toBe('face-detection');
      expect(record.status).toBe('pass');
      expect(record.testResults.length).toBe(1);
    });

    test('should create valid PerformanceBenchmarkRecordData', () => {
      const record: PerformanceBenchmarkRecordData = {
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

      expect(record.systemId).toBe('face-detection');
      expect(record.metrics.frameRate?.average).toBe(30);
      expect(record.benchmarkComparison.overallStatus).toBe('excellent');
    });

    test('should create valid EnhancementRecommendationRecordData', () => {
      const record: EnhancementRecommendationRecordData = {
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

      expect(record.enhancementId).toBe('enh-001');
      expect(record.category).toBe('vision');
      expect(record.priority).toBe(8);
      expect(record.status).toBe('proposed');
    });

    test('should create valid CompatibilityTestRecordData', () => {
      const record: CompatibilityTestRecordData = {
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

      expect(record.browser).toBe('Chrome');
      expect(record.overallCompatibility).toBe(95);
      expect(record.systemCompatibility.length).toBe(1);
    });
  });

  describe('Type Enums', () => {
    test('AICategory should have correct values', () => {
      const categories: AICategory[] = ['vision', 'audio', 'behavioral', 'system'];
      categories.forEach((category) => {
        expect(['vision', 'audio', 'behavioral', 'system']).toContain(category);
      });
    });

    test('ValidationStatus should have correct values', () => {
      const statuses: ValidationStatus[] = ['pass', 'fail', 'warning'];
      statuses.forEach((status) => {
        expect(['pass', 'fail', 'warning']).toContain(status);
      });
    });
  });
});

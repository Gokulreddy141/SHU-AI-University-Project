/**
 * Enhancement API Integration Tests
 * 
 * Tests for the Enhancement Recommendations API endpoints
 * used by the dashboard.
 */

import { NextRequest } from 'next/server';
import { GET as getEnhancements } from '@/app/api/audit/enhancements/route';
import { GET as getImplementationGuide } from '@/app/api/audit/enhancements/[enhancementId]/guide/route';
import { POST as updateEnhancementStatus } from '@/app/api/audit/enhancements/[enhancementId]/status/route';

// Mock the EnhancementRecommender
jest.mock('@/lib/audit/enhancement-recommender', () => ({
  EnhancementRecommender: jest.fn().mockImplementation(() => ({
    recommendEnhancements: jest.fn().mockResolvedValue([
      {
        id: 'emotion-detection',
        name: 'Emotion Detection',
        category: 'vision',
        description: 'Detect candidate emotions using facial expressions',
        implementationEffort: 'medium',
        demonstrationValue: 'high',
        requiredLibraries: ['face-api.js', '@tensorflow/tfjs'],
        estimatedHours: 16,
        prerequisites: ['MediaPipe FaceMesh integration'],
      },
    ]),
    prioritizeEnhancements: jest.fn().mockImplementation((enhancements) => 
      enhancements.map((e: any) => ({
        ...e,
        priority: 9,
        priorityRationale: 'High priority: High demonstration value with manageable effort',
      }))
    ),
    generateRoadmap: jest.fn().mockResolvedValue({
      phases: [
        {
          phaseName: 'Phase 1: Quick Wins',
          enhancements: [],
          estimatedDuration: '16 hours',
          dependencies: [],
        },
      ],
      totalEstimatedHours: 16,
      recommendedSequence: ['Emotion Detection'],
    }),
    generateImplementationGuide: jest.fn().mockResolvedValue({
      enhancementId: 'emotion-detection',
      enhancementName: 'Emotion Detection',
      overview: 'Implement real-time emotion detection using face-api.js',
      technicalApproach: 'Use face-api.js with pre-trained emotion recognition models',
      requiredDependencies: [
        {
          name: 'face-api.js',
          version: '^0.22.2',
          purpose: 'Facial expression recognition',
          installCommand: 'npm install face-api.js',
        },
      ],
      codeExamples: [
        {
          title: 'Initialize Emotion Detection',
          description: 'Load face-api.js models',
          language: 'typescript',
          code: 'import * as faceapi from "face-api.js";',
        },
      ],
      integrationPoints: [
        {
          component: 'hooks/useEmotionDetection.ts',
          modificationType: 'new_file' as const,
          description: 'Create new React hook for emotion detection',
        },
      ],
      testingStrategy: 'Test with various facial expressions',
      estimatedTimeline: '2-3 days (16 hours)',
    }),
  })),
}));

// Mock the EnhancementRecommendationRecord model
jest.mock('@/models/EnhancementRecommendationRecord', () => {
  const mockEnhancementRecord = {
    enhancementId: 'emotion-detection',
    status: 'proposed',
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(true),
  };

  return {
    __esModule: true,
    default: {
      findOne: jest.fn().mockResolvedValue(mockEnhancementRecord),
    },
    EnhancementRecommendationRecord: {
      findOne: jest.fn().mockResolvedValue(mockEnhancementRecord),
    },
  };
});

describe('Enhancement API Integration', () => {
  describe('GET /api/audit/enhancements', () => {
    test('should return enhancement recommendations and roadmap', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/enhancements');
      const response = await getEnhancements(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('enhancements');
      expect(data.data).toHaveProperty('roadmap');
      expect(data.data).toHaveProperty('metadata');

      // Check enhancements structure
      expect(Array.isArray(data.data.enhancements)).toBe(true);
      expect(data.data.enhancements[0]).toHaveProperty('id');
      expect(data.data.enhancements[0]).toHaveProperty('name');
      expect(data.data.enhancements[0]).toHaveProperty('category');
      expect(data.data.enhancements[0]).toHaveProperty('priority');
      expect(data.data.enhancements[0]).toHaveProperty('priorityRationale');

      // Check roadmap structure
      expect(data.data.roadmap).toHaveProperty('phases');
      expect(data.data.roadmap).toHaveProperty('totalEstimatedHours');
      expect(data.data.roadmap).toHaveProperty('recommendedSequence');

      // Check metadata
      expect(data.data.metadata).toHaveProperty('totalEnhancements');
      expect(data.data.metadata).toHaveProperty('categories');
      expect(data.data.metadata).toHaveProperty('totalEstimatedHours');
      expect(data.data.metadata).toHaveProperty('generatedAt');
    });

    test('should filter enhancements by category', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/enhancements?category=vision');
      const response = await getEnhancements(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.enhancements.every((e: any) => e.category === 'vision')).toBe(true);
    });

    test('should filter enhancements by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/enhancements?status=proposed');
      const response = await getEnhancements(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Since we're mocking, all enhancements should be returned for 'proposed' status
      expect(Array.isArray(data.data.enhancements)).toBe(true);
    });
  });

  describe('GET /api/audit/enhancements/:enhancementId/guide', () => {
    test('should return implementation guide for valid enhancement', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/enhancements/emotion-detection/guide');
      const response = await getImplementationGuide(request, { 
        params: Promise.resolve({ enhancementId: 'emotion-detection' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('guide');
      expect(data.data).toHaveProperty('metadata');

      // Check guide structure
      const guide = data.data.guide;
      expect(guide).toHaveProperty('enhancementId');
      expect(guide).toHaveProperty('enhancementName');
      expect(guide).toHaveProperty('overview');
      expect(guide).toHaveProperty('technicalApproach');
      expect(guide).toHaveProperty('requiredDependencies');
      expect(guide).toHaveProperty('codeExamples');
      expect(guide).toHaveProperty('integrationPoints');
      expect(guide).toHaveProperty('testingStrategy');
      expect(guide).toHaveProperty('estimatedTimeline');

      // Check dependencies structure
      expect(Array.isArray(guide.requiredDependencies)).toBe(true);
      if (guide.requiredDependencies.length > 0) {
        const dep = guide.requiredDependencies[0];
        expect(dep).toHaveProperty('name');
        expect(dep).toHaveProperty('version');
        expect(dep).toHaveProperty('purpose');
        expect(dep).toHaveProperty('installCommand');
      }

      // Check code examples structure
      expect(Array.isArray(guide.codeExamples)).toBe(true);
      if (guide.codeExamples.length > 0) {
        const example = guide.codeExamples[0];
        expect(example).toHaveProperty('title');
        expect(example).toHaveProperty('description');
        expect(example).toHaveProperty('language');
        expect(example).toHaveProperty('code');
      }

      // Check integration points structure
      expect(Array.isArray(guide.integrationPoints)).toBe(true);
      if (guide.integrationPoints.length > 0) {
        const point = guide.integrationPoints[0];
        expect(point).toHaveProperty('component');
        expect(point).toHaveProperty('modificationType');
        expect(point).toHaveProperty('description');
      }

      // Check metadata
      expect(data.data.metadata).toHaveProperty('enhancementId');
      expect(data.data.metadata).toHaveProperty('generatedAt');
      expect(data.data.metadata).toHaveProperty('totalDependencies');
      expect(data.data.metadata).toHaveProperty('totalCodeExamples');
      expect(data.data.metadata).toHaveProperty('totalIntegrationPoints');
    });

    test('should return 400 for missing enhancement ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/audit/enhancements//guide');
      const response = await getImplementationGuide(request, { 
        params: Promise.resolve({ enhancementId: '' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Enhancement ID is required');
    });
  });

  describe('POST /api/audit/enhancements/:enhancementId/status', () => {
    test('should update enhancement status successfully', async () => {
      const requestBody = {
        status: 'approved',
        notes: 'Approved for implementation in next sprint',
      };

      const request = new NextRequest('http://localhost:3000/api/audit/enhancements/emotion-detection/status', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await updateEnhancementStatus(request, { 
        params: Promise.resolve({ enhancementId: 'emotion-detection' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('enhancementId');
      expect(data.data).toHaveProperty('newStatus');
      expect(data.data.newStatus).toBe('approved');
      expect(data.message).toContain('Enhancement status updated');
    });

    test('should return 400 for missing status', async () => {
      const requestBody = {
        notes: 'Some notes',
      };

      const request = new NextRequest('http://localhost:3000/api/audit/enhancements/emotion-detection/status', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await updateEnhancementStatus(request, { 
        params: Promise.resolve({ enhancementId: 'emotion-detection' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Status is required');
    });

    test('should return 400 for invalid status', async () => {
      const requestBody = {
        status: 'invalid_status',
      };

      const request = new NextRequest('http://localhost:3000/api/audit/enhancements/emotion-detection/status', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await updateEnhancementStatus(request, { 
        params: Promise.resolve({ enhancementId: 'emotion-detection' }) 
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid status');
    });

    test('should validate all valid status values', async () => {
      const validStatuses = ['proposed', 'approved', 'in_progress', 'completed', 'rejected'];
      
      for (const status of validStatuses) {
        const requestBody = { status };
        const request = new NextRequest('http://localhost:3000/api/audit/enhancements/emotion-detection/status', {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const response = await updateEnhancementStatus(request, { 
          params: Promise.resolve({ enhancementId: 'emotion-detection' }) 
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.newStatus).toBe(status);
      }
    });
  });
});
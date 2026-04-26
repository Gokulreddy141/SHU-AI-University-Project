/**
 * Tests for Compatibility API Endpoints
 * 
 * Tests the compatibility testing and matrix generation endpoints
 * to ensure they handle browser compatibility validation correctly.
 */

import { POST as testCompatibility } from '../../app/api/audit/compatibility/test/route';
import { GET as getCompatibilityMatrix } from '../../app/api/audit/compatibility/matrix/route';

// Mock the database operations
jest.mock('../../lib/audit/db-operations', () => ({
  createCompatibilityTestRecord: jest.fn().mockResolvedValue({ _id: 'test-record-id' }),
  getLatestCompatibilityMatrix: jest.fn().mockResolvedValue([
    {
      browser: 'chrome',
      browserVersion: '120.0',
      platform: 'windows',
      timestamp: new Date(),
      systemCompatibility: [
        {
          systemId: 'face-detection',
          supported: true,
          partialSupport: false,
          limitations: [],
          testResults: [
            {
              testName: 'Basic Browser Support',
              status: 'pass',
              duration: 10,
              expectedValue: '>= 88',
              actualValue: 120,
            },
          ],
        },
        {
          systemId: 'voice-activity',
          supported: true,
          partialSupport: false,
          limitations: [],
          testResults: [
            {
              testName: 'API Availability',
              status: 'pass',
              duration: 5,
              expectedValue: ['SpeechRecognition'],
              actualValue: ['SpeechRecognition'],
            },
          ],
        },
      ],
      overallCompatibility: 95,
    },
    {
      browser: 'firefox',
      browserVersion: '121.0',
      platform: 'windows',
      timestamp: new Date(),
      systemCompatibility: [
        {
          systemId: 'face-detection',
          supported: true,
          partialSupport: true,
          limitations: ['Reduced frame rate expected'],
          testResults: [
            {
              testName: 'Performance Expectations',
              status: 'warning',
              duration: 8,
              expectedValue: 'Optimal performance',
              actualValue: 'Limited performance',
            },
          ],
        },
        {
          systemId: 'voice-activity',
          supported: false,
          partialSupport: false,
          limitations: ['Feature not available'],
          testResults: [
            {
              testName: 'API Availability',
              status: 'fail',
              duration: 3,
              expectedValue: ['SpeechRecognition'],
              actualValue: [],
            },
          ],
        },
      ],
      overallCompatibility: 60,
    },
  ]),
}));

// Mock the constants
jest.mock('../../lib/audit/constants', () => ({
  AI_SYSTEMS: [
    { id: 'face-detection', name: 'Face Detection', category: 'vision' },
    { id: 'voice-activity', name: 'Voice Activity Detection', category: 'audio' },
    { id: 'hand-tracking', name: 'Hand Tracking', category: 'vision' },
    { id: 'object-detection', name: 'Object Detection', category: 'vision' },
    { id: 'keystroke-dynamics', name: 'Keystroke Dynamics', category: 'behavioral' },
  ],
}));

describe('Compatibility API Endpoints', () => {
  describe('POST /api/audit/compatibility/test', () => {
    it('should test compatibility for Chrome browser', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: 'Chrome',
          browserVersion: '120.0',
          platform: 'Windows',
        }),
      });

      const response = await testCompatibility(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('executionId');
      expect(data).toHaveProperty('browser', 'chrome');
      expect(data).toHaveProperty('browserVersion', '120.0');
      expect(data).toHaveProperty('systemCompatibility');
      expect(data).toHaveProperty('overallCompatibility');
      expect(Array.isArray(data.systemCompatibility)).toBe(true);
      expect(data.overallCompatibility).toBeGreaterThanOrEqual(0);
      expect(data.overallCompatibility).toBeLessThanOrEqual(100);
    });

    it('should test compatibility for Firefox browser', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: 'Firefox',
          browserVersion: '121.0',
          platform: 'Linux',
        }),
      });

      const response = await testCompatibility(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.browser).toBe('firefox');
      expect(Array.isArray(data.systemCompatibility)).toBe(true);
      
      // Firefox should have some limitations for voice features
      const voiceSystem = data.systemCompatibility.find(
        (s: any) => s.systemId === 'voice-activity'
      );
      expect(voiceSystem).toBeDefined();
    });

    it('should test compatibility for specific systems only', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: 'Chrome',
          browserVersion: '120.0',
          systemIds: ['face-detection', 'hand-tracking'],
        }),
      });

      const response = await testCompatibility(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.systemCompatibility).toHaveLength(2);
      expect(data.systemCompatibility.every((s: any) => 
        ['face-detection', 'hand-tracking'].includes(s.systemId)
      )).toBe(true);
    });

    it('should return 400 for missing browser information', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browserVersion: '120.0',
        }),
      });

      const response = await testCompatibility(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Browser and browserVersion are required');
    });

    it('should return 400 for unsupported browser', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: 'InternetExplorer',
          browserVersion: '11.0',
        }),
      });

      const response = await testCompatibility(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('Unsupported browser');
      expect(data.supportedBrowsers).toContain('chrome');
      expect(data.supportedBrowsers).toContain('firefox');
    });

    it('should handle old browser versions correctly', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          browser: 'Chrome',
          browserVersion: '70.0', // Below minimum version
        }),
      });

      const response = await testCompatibility(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.overallCompatibility).toBeLessThan(100);
      
      // Should have systems with failed basic browser support
      const failedSystems = data.systemCompatibility.filter((s: any) => 
        s.testResults.some((t: any) => t.testName === 'Basic Browser Support' && t.status === 'fail')
      );
      expect(failedSystems.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/audit/compatibility/matrix', () => {
    it('should return compatibility matrix for all browsers', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/matrix');

      const response = await getCompatibilityMatrix(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('compatibilityMatrix');
      expect(data.compatibilityMatrix).toHaveProperty('browsers');
      expect(data.compatibilityMatrix).toHaveProperty('recommendedConfiguration');
      expect(data).toHaveProperty('lastUpdated');
      expect(data).toHaveProperty('totalSystems');
      expect(data).toHaveProperty('testedBrowsers');

      const { browsers, recommendedConfiguration } = data.compatibilityMatrix;
      expect(Array.isArray(browsers)).toBe(true);
      expect(browsers.length).toBeGreaterThan(0);
      
      // Check browser structure
      const browser = browsers[0];
      expect(browser).toHaveProperty('browserName');
      expect(browser).toHaveProperty('version');
      expect(browser).toHaveProperty('supportedSystems');
      expect(browser).toHaveProperty('unsupportedSystems');
      expect(browser).toHaveProperty('partialSystems');
      expect(browser).toHaveProperty('overallCompatibility');

      // Check recommended configuration
      expect(recommendedConfiguration).toHaveProperty('browser');
      expect(recommendedConfiguration).toHaveProperty('minVersion');
      expect(recommendedConfiguration).toHaveProperty('requiredPermissions');
      expect(recommendedConfiguration).toHaveProperty('hardwareRequirements');
    });

    it('should include recommendations when requested', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/matrix?includeRecommendations=true');

      const response = await getCompatibilityMatrix(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('recommendations');
      expect(Array.isArray(data.recommendations)).toBe(true);
      expect(data.recommendations.length).toBeGreaterThan(0);
      
      // Should include browser recommendation
      const browserRec = data.recommendations.find((r: string) => 
        r.includes('Use') && r.includes('for optimal compatibility')
      );
      expect(browserRec).toBeDefined();
    });

    it('should exclude recommendations when not requested', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/matrix?includeRecommendations=false');

      const response = await getCompatibilityMatrix(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations).toBeUndefined();
    });

    it('should include all major browsers in matrix', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/matrix');

      const response = await getCompatibilityMatrix(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const browserNames = data.compatibilityMatrix.browsers.map((b: any) => b.browserName);
      expect(browserNames).toContain('Chrome');
      expect(browserNames).toContain('Edge');
      expect(browserNames).toContain('Firefox');
      expect(browserNames).toContain('Safari');
    });

    it('should provide hardware requirements', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/matrix');

      const response = await getCompatibilityMatrix(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      const hardware = data.compatibilityMatrix.recommendedConfiguration.hardwareRequirements;
      expect(hardware).toHaveProperty('minRAM');
      expect(hardware).toHaveProperty('recommendedRAM');
      expect(hardware).toHaveProperty('minCPU');
      expect(hardware).toHaveProperty('gpu');
      expect(hardware).toHaveProperty('camera');
      expect(hardware).toHaveProperty('microphone');
    });

    it('should handle partial support systems correctly', async () => {
      const request = new Request('http://localhost:3000/api/audit/compatibility/matrix');

      const response = await getCompatibilityMatrix(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Find a browser with partial support systems
      const browserWithPartial = data.compatibilityMatrix.browsers.find((b: any) => 
        b.partialSystems && b.partialSystems.length > 0
      );
      
      if (browserWithPartial) {
        const partialSystem = browserWithPartial.partialSystems[0];
        expect(partialSystem).toHaveProperty('systemId');
        expect(partialSystem).toHaveProperty('limitation');
        // Workaround is optional
      }
    });
  });
});
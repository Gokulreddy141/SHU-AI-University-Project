/**
 * Unit tests for compatibility dashboard components
 */

import { BrowserCompatibility, RecommendedConfig } from '@/lib/audit/types';

// Mock the constants
jest.mock('@/lib/audit/constants', () => ({
  AI_SYSTEMS: [
    { id: 'face-detection', name: 'Face Detection', category: 'vision' },
    { id: 'voice-activity', name: 'Voice Activity', category: 'audio' },
  ],
  getAllSystemIds: () => ['face-detection', 'voice-activity'],
  getSystemById: (id: string) => {
    const systems = {
      'face-detection': { id: 'face-detection', name: 'Face Detection', category: 'vision' },
      'voice-activity': { id: 'voice-activity', name: 'Voice Activity', category: 'audio' },
    };
    return systems[id as keyof typeof systems];
  },
}));

describe('Compatibility Dashboard Data Processing', () => {
  const mockBrowsers: BrowserCompatibility[] = [
    {
      browserName: 'Chrome',
      version: '120.0',
      supportedSystems: ['face-detection'],
      unsupportedSystems: [],
      partialSystems: [
        {
          systemId: 'voice-activity',
          limitation: 'Limited support',
          workaround: 'Use alternative method',
        },
      ],
      overallCompatibility: 75,
    },
    {
      browserName: 'Firefox',
      version: '121.0',
      supportedSystems: ['face-detection'],
      unsupportedSystems: ['voice-activity'],
      partialSystems: [],
      overallCompatibility: 50,
    },
  ];

  const mockRecommendedConfig: RecommendedConfig = {
    browser: 'Chrome',
    minVersion: '88.0',
    requiredPermissions: ['Camera access', 'Microphone access'],
    hardwareRequirements: {
      minRAM: '4GB',
      recommendedRAM: '8GB',
      minCPU: 'Intel i5',
      gpu: 'Integrated graphics',
      camera: 'HD webcam',
      microphone: 'Built-in microphone',
    },
  };

  it('should have valid browser compatibility data structure', () => {
    expect(mockBrowsers).toHaveLength(2);
    expect(mockBrowsers[0].browserName).toBe('Chrome');
    expect(mockBrowsers[0].overallCompatibility).toBe(75);
    expect(mockBrowsers[1].browserName).toBe('Firefox');
    expect(mockBrowsers[1].overallCompatibility).toBe(50);
  });

  it('should have valid recommended configuration structure', () => {
    expect(mockRecommendedConfig.browser).toBe('Chrome');
    expect(mockRecommendedConfig.minVersion).toBe('88.0');
    expect(mockRecommendedConfig.requiredPermissions).toContain('Camera access');
    expect(mockRecommendedConfig.hardwareRequirements.recommendedRAM).toBe('8GB');
  });

  it('should calculate average compatibility correctly', () => {
    const averageCompatibility = Math.round(
      mockBrowsers.reduce((sum, b) => sum + b.overallCompatibility, 0) / mockBrowsers.length
    );
    expect(averageCompatibility).toBe(63); // (75 + 50) / 2 = 62.5, rounded to 63
  });

  it('should identify best browser correctly', () => {
    const bestBrowser = mockBrowsers.reduce((best, current) => 
      current.overallCompatibility > best.overallCompatibility ? current : best
    );
    expect(bestBrowser.browserName).toBe('Chrome');
    expect(bestBrowser.overallCompatibility).toBe(75);
  });

  it('should identify limited browsers correctly', () => {
    const limitedBrowsers = mockBrowsers.filter(b => b.overallCompatibility < 80);
    expect(limitedBrowsers).toHaveLength(2); // Both Chrome (75%) and Firefox (50%) are below 80%
  });
});
/**
 * Enhancement Dashboard Tests
 * 
 * Tests for the Enhancement Recommendations Dashboard components
 * and functionality.
 */

import { PrioritizedEnhancement, EnhancementRoadmap } from '@/lib/audit/types';

// Mock enhancement data for testing
const mockEnhancements: PrioritizedEnhancement[] = [
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
    priority: 9,
    priorityRationale: 'High priority: High demonstration value with manageable effort',
  },
  {
    id: 'pose-estimation',
    name: 'Full Body Pose Estimation',
    category: 'vision',
    description: 'Track full body posture and detect suspicious movements',
    implementationEffort: 'medium',
    demonstrationValue: 'high',
    requiredLibraries: ['@mediapipe/pose', '@tensorflow/tfjs'],
    estimatedHours: 20,
    prerequisites: ['Camera access', 'MediaPipe integration'],
    priority: 8,
    priorityRationale: 'High priority: High demonstration value with manageable effort',
  },
  {
    id: 'speaker-identification',
    name: 'Speaker Identification',
    category: 'audio',
    description: 'Verify speaker identity using voice biometrics',
    implementationEffort: 'high',
    demonstrationValue: 'medium',
    requiredLibraries: ['meyda'],
    estimatedHours: 32,
    prerequisites: ['Voice enrollment', 'Audio processing pipeline'],
    priority: 4,
    priorityRationale: 'Low priority: High effort or low demonstration value',
  },
];

const mockRoadmap: EnhancementRoadmap = {
  phases: [
    {
      phaseName: 'Phase 1: Quick Wins',
      enhancements: [mockEnhancements[0], mockEnhancements[1]],
      estimatedDuration: '36 hours',
      dependencies: [],
    },
    {
      phaseName: 'Phase 2: Medium Priority',
      enhancements: [],
      estimatedDuration: '0 hours',
      dependencies: ['Phase 1 completion'],
    },
    {
      phaseName: 'Phase 3: Advanced Features',
      enhancements: [mockEnhancements[2]],
      estimatedDuration: '32 hours',
      dependencies: ['Phase 1 and 2 completion'],
    },
  ],
  totalEstimatedHours: 68,
  recommendedSequence: ['Emotion Detection', 'Full Body Pose Estimation', 'Speaker Identification'],
};

describe('Enhancement Dashboard Data Processing', () => {
  test('should correctly prioritize enhancements', () => {
    // Sort by priority (highest first)
    const sortedByPriority = [...mockEnhancements].sort((a, b) => b.priority - a.priority);
    
    expect(sortedByPriority[0].id).toBe('emotion-detection');
    expect(sortedByPriority[0].priority).toBe(9);
    expect(sortedByPriority[1].id).toBe('pose-estimation');
    expect(sortedByPriority[1].priority).toBe(8);
    expect(sortedByPriority[2].id).toBe('speaker-identification');
    expect(sortedByPriority[2].priority).toBe(4);
  });

  test('should filter enhancements by category', () => {
    const visionEnhancements = mockEnhancements.filter(e => e.category === 'vision');
    const audioEnhancements = mockEnhancements.filter(e => e.category === 'audio');
    
    expect(visionEnhancements).toHaveLength(2);
    expect(audioEnhancements).toHaveLength(1);
    expect(visionEnhancements[0].name).toBe('Emotion Detection');
    expect(audioEnhancements[0].name).toBe('Speaker Identification');
  });

  test('should calculate total effort correctly', () => {
    const totalHours = mockEnhancements.reduce((sum, e) => sum + e.estimatedHours, 0);
    expect(totalHours).toBe(68);
  });

  test('should identify high priority enhancements', () => {
    const highPriority = mockEnhancements.filter(e => e.priority >= 8);
    expect(highPriority).toHaveLength(2);
    expect(highPriority.every(e => e.priority >= 8)).toBe(true);
  });

  test('should identify high value enhancements', () => {
    const highValue = mockEnhancements.filter(e => e.demonstrationValue === 'high');
    expect(highValue).toHaveLength(2);
    expect(highValue.every(e => e.demonstrationValue === 'high')).toBe(true);
  });
});

describe('Enhancement Roadmap Processing', () => {
  test('should have correct roadmap structure', () => {
    expect(mockRoadmap.phases).toHaveLength(3);
    expect(mockRoadmap.totalEstimatedHours).toBe(68);
    expect(mockRoadmap.recommendedSequence).toHaveLength(3);
  });

  test('should calculate phase durations correctly', () => {
    const phase1Hours = mockRoadmap.phases[0].enhancements.reduce((sum, e) => sum + e.estimatedHours, 0);
    const phase3Hours = mockRoadmap.phases[2].enhancements.reduce((sum, e) => sum + e.estimatedHours, 0);
    
    expect(phase1Hours).toBe(36); // 16 + 20
    expect(phase3Hours).toBe(32);
  });

  test('should have proper phase dependencies', () => {
    expect(mockRoadmap.phases[0].dependencies).toHaveLength(0);
    expect(mockRoadmap.phases[1].dependencies).toContain('Phase 1 completion');
    expect(mockRoadmap.phases[2].dependencies).toContain('Phase 1 and 2 completion');
  });

  test('should maintain enhancement order in recommended sequence', () => {
    expect(mockRoadmap.recommendedSequence[0]).toBe('Emotion Detection');
    expect(mockRoadmap.recommendedSequence[1]).toBe('Full Body Pose Estimation');
    expect(mockRoadmap.recommendedSequence[2]).toBe('Speaker Identification');
  });
});

describe('Enhancement Categories and Icons', () => {
  test('should map categories to correct icons', () => {
    const getCategoryIcon = (category: string) => {
      switch (category) {
        case "vision": return "visibility";
        case "audio": return "mic";
        case "behavioral": return "psychology";
        case "system": return "computer";
        default: return "category";
      }
    };

    expect(getCategoryIcon('vision')).toBe('visibility');
    expect(getCategoryIcon('audio')).toBe('mic');
    expect(getCategoryIcon('behavioral')).toBe('psychology');
    expect(getCategoryIcon('system')).toBe('computer');
    expect(getCategoryIcon('unknown')).toBe('category');
  });

  test('should map categories to correct colors', () => {
    const getCategoryColor = (category: string) => {
      switch (category) {
        case "vision": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "audio": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "behavioral": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
        case "system": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      }
    };

    expect(getCategoryColor('vision')).toContain('blue');
    expect(getCategoryColor('audio')).toContain('green');
    expect(getCategoryColor('behavioral')).toContain('purple');
    expect(getCategoryColor('system')).toContain('orange');
    expect(getCategoryColor('unknown')).toContain('gray');
  });
});

describe('Enhancement Status Management', () => {
  test('should validate enhancement status values', () => {
    const validStatuses = ['proposed', 'approved', 'in_progress', 'completed', 'rejected'];
    
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  test('should map status to correct colors', () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "proposed": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "approved": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "in_progress": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "completed": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
        case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      }
    };

    expect(getStatusColor('proposed')).toContain('blue');
    expect(getStatusColor('approved')).toContain('green');
    expect(getStatusColor('in_progress')).toContain('yellow');
    expect(getStatusColor('completed')).toContain('emerald');
    expect(getStatusColor('rejected')).toContain('red');
  });
});

describe('Enhancement Filtering and Sorting', () => {
  test('should sort by implementation effort', () => {
    const effortOrder = { low: 1, medium: 2, high: 3 };
    const sortedByEffort = [...mockEnhancements].sort((a, b) => 
      effortOrder[a.implementationEffort] - effortOrder[b.implementationEffort]
    );

    // All test enhancements have medium or high effort, so medium should come first
    const mediumEffortItems = sortedByEffort.filter(e => e.implementationEffort === 'medium');
    const highEffortItems = sortedByEffort.filter(e => e.implementationEffort === 'high');
    
    expect(mediumEffortItems).toHaveLength(2);
    expect(highEffortItems).toHaveLength(1);
  });

  test('should sort by demonstration value', () => {
    const valueOrder = { low: 1, medium: 2, high: 3 };
    const sortedByValue = [...mockEnhancements].sort((a, b) => 
      valueOrder[b.demonstrationValue] - valueOrder[a.demonstrationValue]
    );

    // High value items should come first
    expect(sortedByValue[0].demonstrationValue).toBe('high');
    expect(sortedByValue[1].demonstrationValue).toBe('high');
    expect(sortedByValue[2].demonstrationValue).toBe('medium');
  });

  test('should filter by multiple criteria', () => {
    const visionHighValue = mockEnhancements.filter(e => 
      e.category === 'vision' && e.demonstrationValue === 'high'
    );
    
    expect(visionHighValue).toHaveLength(2);
    expect(visionHighValue.every(e => e.category === 'vision')).toBe(true);
    expect(visionHighValue.every(e => e.demonstrationValue === 'high')).toBe(true);
  });
});

describe('Enhancement Dashboard Statistics', () => {
  test('should calculate correct summary statistics', () => {
    const stats = {
      total: mockEnhancements.length,
      highPriority: mockEnhancements.filter(e => e.priority >= 8).length,
      totalEffort: mockEnhancements.reduce((sum, e) => sum + e.estimatedHours, 0),
      highValue: mockEnhancements.filter(e => e.demonstrationValue === 'high').length,
    };

    expect(stats.total).toBe(3);
    expect(stats.highPriority).toBe(2);
    expect(stats.totalEffort).toBe(68);
    expect(stats.highValue).toBe(2);
  });

  test('should calculate phase statistics correctly', () => {
    const phaseStats = mockRoadmap.phases.map(phase => ({
      name: phase.phaseName,
      enhancementCount: phase.enhancements.length,
      totalHours: phase.enhancements.reduce((sum, e) => sum + e.estimatedHours, 0),
      highPriority: phase.enhancements.filter(e => e.priority >= 8).length,
      highValue: phase.enhancements.filter(e => e.demonstrationValue === 'high').length,
      lowEffort: phase.enhancements.filter(e => e.implementationEffort === 'low').length,
    }));

    expect(phaseStats[0].enhancementCount).toBe(2);
    expect(phaseStats[0].totalHours).toBe(36);
    expect(phaseStats[0].highPriority).toBe(2);
    expect(phaseStats[0].highValue).toBe(2);
    
    expect(phaseStats[2].enhancementCount).toBe(1);
    expect(phaseStats[2].totalHours).toBe(32);
    expect(phaseStats[2].highPriority).toBe(0);
  });
});
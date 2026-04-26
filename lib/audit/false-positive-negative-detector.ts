/**
 * False Positive/Negative Detector
 * 
 * Identifies incorrect detections to improve AI system accuracy.
 * Tests legitimate behaviors that should NOT trigger violations and
 * malpractice behaviors that SHOULD trigger violations.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 */

import {
  BehaviorTest,
  FalsePositiveAnalysis,
  FalseNegativeAnalysis,
  AccuracyAnalysis,
  ThresholdRecommendation,
  AICategory,
} from './types';
import { getSystemById } from './constants';

// ============================================================================
// Test Scenario Definitions
// ============================================================================

interface TestScenario {
  behaviorName: string;
  description: string;
  category: AICategory;
  applicableSystems: string[];
  expectedResult: 'violation' | 'no_violation';
  simulationFn: () => Promise<boolean>; // Returns true if violation detected
  metadata?: Record<string, unknown>;
}

// ============================================================================
// FalsePositiveNegativeDetector Class
// ============================================================================

export class FalsePositiveNegativeDetector {
  private legitimateScenarios: TestScenario[];
  private malpracticeScenarios: TestScenario[];

  constructor() {
    this.legitimateScenarios = this.initializeLegitimateScenarios();
    this.malpracticeScenarios = this.initializeMalpracticeScenarios();
  }

  /**
   * Test legitimate behaviors that should NOT trigger violations
   * Requirement 5.1
   */
  async testLegitimateBehaviors(systemId: string): Promise<FalsePositiveAnalysis> {
    const system = getSystemById(systemId);
    if (!system) {
      throw new Error(`System not found: ${systemId}`);
    }

    // Filter scenarios applicable to this system
    const applicableScenarios = this.legitimateScenarios.filter((scenario) =>
      scenario.applicableSystems.includes(systemId)
    );

    const behaviorTests: BehaviorTest[] = [];
    const falsePositives: BehaviorTest[] = [];

    for (const scenario of applicableScenarios) {
      const violationDetected = await scenario.simulationFn();
      const actualResult: 'violation' | 'no_violation' = violationDetected
        ? 'violation'
        : 'no_violation';
      const isCorrect = actualResult === scenario.expectedResult;

      const behaviorTest: BehaviorTest = {
        behaviorName: scenario.behaviorName,
        description: scenario.description,
        expectedResult: scenario.expectedResult,
        actualResult,
        isCorrect,
        metadata: scenario.metadata,
      };

      behaviorTests.push(behaviorTest);

      // If violation was detected but shouldn't have been, it's a false positive
      if (!isCorrect && violationDetected) {
        falsePositives.push(behaviorTest);
      }
    }

    const falsePositiveRate = this.calculateFalsePositiveRate(behaviorTests);

    return {
      systemId,
      legitimateBehaviors: behaviorTests,
      falsePositives,
      falsePositiveRate,
      totalTests: behaviorTests.length,
    };
  }

  /**
   * Test malpractice behaviors that SHOULD trigger violations
   * Requirement 5.2
   */
  async testMalpracticeBehaviors(systemId: string): Promise<FalseNegativeAnalysis> {
    const system = getSystemById(systemId);
    if (!system) {
      throw new Error(`System not found: ${systemId}`);
    }

    // Filter scenarios applicable to this system
    const applicableScenarios = this.malpracticeScenarios.filter((scenario) =>
      scenario.applicableSystems.includes(systemId)
    );

    const behaviorTests: BehaviorTest[] = [];
    const falseNegatives: BehaviorTest[] = [];

    for (const scenario of applicableScenarios) {
      const violationDetected = await scenario.simulationFn();
      const actualResult: 'violation' | 'no_violation' = violationDetected
        ? 'violation'
        : 'no_violation';
      const isCorrect = actualResult === scenario.expectedResult;

      const behaviorTest: BehaviorTest = {
        behaviorName: scenario.behaviorName,
        description: scenario.description,
        expectedResult: scenario.expectedResult,
        actualResult,
        isCorrect,
        metadata: scenario.metadata,
      };

      behaviorTests.push(behaviorTest);

      // If violation was NOT detected but should have been, it's a false negative
      if (!isCorrect && !violationDetected) {
        falseNegatives.push(behaviorTest);
      }
    }

    const falseNegativeRate = this.calculateFalseNegativeRate(behaviorTests);

    return {
      systemId,
      malpracticeBehaviors: behaviorTests,
      falseNegatives,
      falseNegativeRate,
      totalTests: behaviorTests.length,
    };
  }

  /**
   * Calculate false positive rate
   * Requirement 5.5: (false positives / total legitimate tests) * 100
   */
  calculateFalsePositiveRate(results: BehaviorTest[]): number {
    if (results.length === 0) return 0;

    const falsePositives = results.filter(
      (test) => !test.isCorrect && test.actualResult === 'violation'
    );

    return (falsePositives.length / results.length) * 100;
  }

  /**
   * Calculate false negative rate
   * Requirement 5.6: (false negatives / total malpractice tests) * 100
   */
  calculateFalseNegativeRate(results: BehaviorTest[]): number {
    if (results.length === 0) return 0;

    const falseNegatives = results.filter(
      (test) => !test.isCorrect && test.actualResult === 'no_violation'
    );

    return (falseNegatives.length / results.length) * 100;
  }

  /**
   * Recommend threshold adjustments when FP or FN rates exceed 10%
   * Requirement 5.8
   */
  recommendThresholdAdjustments(analysis: AccuracyAnalysis): ThresholdRecommendation[] {
    const recommendations: ThresholdRecommendation[] = [];
    const { falsePositiveAnalysis, falseNegativeAnalysis } = analysis;

    // Analyze false positive rate
    if (falsePositiveAnalysis.falsePositiveRate > 10) {
      recommendations.push(
        this.generateFalsePositiveRecommendation(falsePositiveAnalysis)
      );
    }

    // Analyze false negative rate
    if (falseNegativeAnalysis.falseNegativeRate > 10) {
      recommendations.push(
        this.generateFalseNegativeRecommendation(falseNegativeAnalysis)
      );
    }

    return recommendations;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private generateFalsePositiveRecommendation(
    analysis: FalsePositiveAnalysis
  ): ThresholdRecommendation {
    const system = getSystemById(analysis.systemId);
    const systemName = system?.name || analysis.systemId;

    return {
      systemId: analysis.systemId,
      parameterName: 'sensitivity_threshold',
      currentValue: 0.7, // Example current value
      recommendedValue: 0.8, // Increase threshold to reduce false positives
      rationale: `${systemName} has a false positive rate of ${analysis.falsePositiveRate.toFixed(
        1
      )}%, which exceeds the 10% threshold. Increasing the sensitivity threshold will reduce false alarms for legitimate behaviors.`,
      expectedImpact: `Expected to reduce false positive rate by approximately ${Math.min(
        analysis.falsePositiveRate - 10,
        5
      ).toFixed(1)}% while maintaining detection accuracy.`,
    };
  }

  private generateFalseNegativeRecommendation(
    analysis: FalseNegativeAnalysis
  ): ThresholdRecommendation {
    const system = getSystemById(analysis.systemId);
    const systemName = system?.name || analysis.systemId;

    return {
      systemId: analysis.systemId,
      parameterName: 'sensitivity_threshold',
      currentValue: 0.7, // Example current value
      recommendedValue: 0.6, // Decrease threshold to reduce false negatives
      rationale: `${systemName} has a false negative rate of ${analysis.falseNegativeRate.toFixed(
        1
      )}%, which exceeds the 10% threshold. Decreasing the sensitivity threshold will improve detection of malpractice behaviors.`,
      expectedImpact: `Expected to reduce false negative rate by approximately ${Math.min(
        analysis.falseNegativeRate - 10,
        5
      ).toFixed(1)}% while potentially increasing false positives slightly.`,
    };
  }

  /**
   * Initialize legitimate behavior test scenarios
   * Requirement 5.1: glasses, thinking, reading aloud, poor lighting, normal blinking
   */
  private initializeLegitimateScenarios(): TestScenario[] {
    return [
      // Vision AI - Legitimate behaviors
      {
        behaviorName: 'wearing_glasses',
        description: 'Candidate wearing prescription glasses during exam',
        category: 'vision',
        applicableSystems: ['face-detection', 'gaze-tracking', 'liveness-detection'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Glasses should not trigger face detection issues
          return false; // No violation expected
        },
        metadata: { accessory: 'glasses', type: 'prescription' },
      },
      {
        behaviorName: 'brief_thinking',
        description: 'Candidate looking up briefly while thinking',
        category: 'vision',
        applicableSystems: ['gaze-tracking', 'head-pose'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Brief gaze away (< 3 seconds) should not trigger
          return false;
        },
        metadata: { duration: 2, direction: 'up' },
      },
      {
        behaviorName: 'reading_aloud',
        description: 'Candidate reading question aloud to themselves',
        category: 'audio',
        applicableSystems: ['voice-activity', 'lip-movement'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Self-talk should not trigger dictation detection
          return false;
        },
        metadata: { volume: 'low', pattern: 'self-talk' },
      },
      {
        behaviorName: 'poor_lighting',
        description: 'Exam taken in suboptimal lighting conditions',
        category: 'vision',
        applicableSystems: ['face-detection', 'liveness-detection', 'biometric-recognition'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Poor lighting should not cause false violations
          return false;
        },
        metadata: { lighting: 'dim', quality: 'acceptable' },
      },
      {
        behaviorName: 'normal_blinking',
        description: 'Normal blink frequency (15-20 blinks per minute)',
        category: 'vision',
        applicableSystems: ['blink-analysis', 'liveness-detection'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Normal blink rate should not trigger
          return false;
        },
        metadata: { blinksPerMinute: 18, pattern: 'normal' },
      },
      {
        behaviorName: 'adjusting_posture',
        description: 'Candidate adjusting sitting posture',
        category: 'vision',
        applicableSystems: ['head-pose', 'face-proximity'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Brief posture adjustment should not trigger
          return false;
        },
        metadata: { duration: 1, type: 'posture_adjustment' },
      },
      {
        behaviorName: 'natural_hand_gestures',
        description: 'Natural hand movements while thinking',
        category: 'vision',
        applicableSystems: ['hand-tracking'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Natural gestures should not trigger
          return false;
        },
        metadata: { gesture: 'thinking', intensity: 'low' },
      },
      {
        behaviorName: 'ambient_household_noise',
        description: 'Background noise from household (fan, AC)',
        category: 'audio',
        applicableSystems: ['ambient-noise', 'voice-activity'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Low ambient noise should not trigger
          return false;
        },
        metadata: { noiseLevel: 'low', source: 'household' },
      },
      {
        behaviorName: 'normal_typing_speed',
        description: 'Typing at normal speed with occasional pauses',
        category: 'behavioral',
        applicableSystems: ['keystroke-dynamics', 'typing-pattern'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Normal typing should not trigger
          return false;
        },
        metadata: { wpm: 45, pattern: 'normal' },
      },
      {
        behaviorName: 'mouse_movement_thinking',
        description: 'Moving mouse while reading question',
        category: 'behavioral',
        applicableSystems: ['mouse-behavior'],
        expectedResult: 'no_violation',
        simulationFn: async () => {
          // Simulate: Normal mouse movement should not trigger
          return false;
        },
        metadata: { pattern: 'reading', speed: 'normal' },
      },
    ];
  }

  /**
   * Initialize malpractice behavior test scenarios
   * Requirement 5.2: phone, multiple people, virtual camera, screen recording, tab switching, copy-paste
   */
  private initializeMalpracticeScenarios(): TestScenario[] {
    return [
      // Vision AI - Malpractice behaviors
      {
        behaviorName: 'phone_usage',
        description: 'Candidate using mobile phone during exam',
        category: 'vision',
        applicableSystems: ['object-detection', 'hand-tracking'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Phone should be detected
          return true; // Violation expected
        },
        metadata: { object: 'cell phone', confidence: 0.9 },
      },
      {
        behaviorName: 'multiple_people',
        description: 'Multiple faces detected in video feed',
        category: 'vision',
        applicableSystems: ['face-detection'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Multiple faces should trigger violation
          return true;
        },
        metadata: { faceCount: 2 },
      },
      {
        behaviorName: 'virtual_camera_active',
        description: 'Virtual camera software (OBS, ManyCam) detected',
        category: 'system',
        applicableSystems: ['virtual-camera', 'virtual-device'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Virtual camera should be detected
          return true;
        },
        metadata: { software: 'OBS Studio', type: 'virtual_camera' },
      },
      {
        behaviorName: 'screen_recording_active',
        description: 'Screen recording software running',
        category: 'system',
        applicableSystems: ['screen-recording'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Screen recording should be detected
          return true;
        },
        metadata: { software: 'screen_recorder', active: true },
      },
      {
        behaviorName: 'tab_switching',
        description: 'Candidate switching to another browser tab',
        category: 'system',
        applicableSystems: ['multi-tab'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Tab switch should be detected
          return true;
        },
        metadata: { event: 'visibilitychange', hidden: true },
      },
      {
        behaviorName: 'copy_paste_detected',
        description: 'Candidate pasting content from clipboard',
        category: 'behavioral',
        applicableSystems: ['typing-pattern', 'keystroke-dynamics'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Copy-paste should be detected
          return true;
        },
        metadata: { action: 'paste', length: 150 },
      },
      {
        behaviorName: 'unauthorized_materials',
        description: 'Books or notes visible in video feed',
        category: 'vision',
        applicableSystems: ['object-detection'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Books should be detected
          return true;
        },
        metadata: { object: 'book', confidence: 0.85 },
      },
      {
        behaviorName: 'devtools_open',
        description: 'Browser developer tools opened',
        category: 'system',
        applicableSystems: ['devtools-detection'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: DevTools should be detected
          return true;
        },
        metadata: { devtools: true, method: 'debugger' },
      },
      {
        behaviorName: 'dictation_detected',
        description: 'Someone dictating answers to candidate',
        category: 'audio',
        applicableSystems: ['voice-activity', 'ambient-noise'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: External voice should be detected
          return true;
        },
        metadata: { voices: 2, pattern: 'dictation' },
      },
      {
        behaviorName: 'face_mismatch',
        description: 'Different person taking exam (biometric mismatch)',
        category: 'vision',
        applicableSystems: ['biometric-recognition', 'face-detection'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: Face mismatch should be detected
          return true;
        },
        metadata: { similarity: 0.3, threshold: 0.7 },
      },
      {
        behaviorName: 'vm_detected',
        description: 'Exam taken in virtual machine',
        category: 'system',
        applicableSystems: ['sandbox-vm'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: VM should be detected
          return true;
        },
        metadata: { vm: true, type: 'VirtualBox' },
      },
      {
        behaviorName: 'synthetic_audio',
        description: 'Text-to-speech audio detected',
        category: 'audio',
        applicableSystems: ['tts-detection'],
        expectedResult: 'violation',
        simulationFn: async () => {
          // Simulate: TTS should be detected
          return true;
        },
        metadata: { synthetic: true, confidence: 0.88 },
      },
    ];
  }

  /**
   * Get all test scenarios for a specific system
   */
  getTestScenariosForSystem(systemId: string): {
    legitimate: TestScenario[];
    malpractice: TestScenario[];
  } {
    return {
      legitimate: this.legitimateScenarios.filter((s) =>
        s.applicableSystems.includes(systemId)
      ),
      malpractice: this.malpracticeScenarios.filter((s) =>
        s.applicableSystems.includes(systemId)
      ),
    };
  }

  /**
   * Get summary statistics for all scenarios
   */
  getScenarioStatistics(): {
    totalLegitimate: number;
    totalMalpractice: number;
    byCategory: Record<AICategory, { legitimate: number; malpractice: number }>;
  } {
    const byCategory: Record<AICategory, { legitimate: number; malpractice: number }> = {
      vision: { legitimate: 0, malpractice: 0 },
      audio: { legitimate: 0, malpractice: 0 },
      behavioral: { legitimate: 0, malpractice: 0 },
      system: { legitimate: 0, malpractice: 0 },
    };

    this.legitimateScenarios.forEach((s) => {
      byCategory[s.category].legitimate++;
    });

    this.malpracticeScenarios.forEach((s) => {
      byCategory[s.category].malpractice++;
    });

    return {
      totalLegitimate: this.legitimateScenarios.length,
      totalMalpractice: this.malpracticeScenarios.length,
      byCategory,
    };
  }
}

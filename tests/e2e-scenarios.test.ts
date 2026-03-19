/**
 * End-to-End Scenario Tests
 * Simulates complete exam scenarios with multiple AI detections
 */

import { calculateIntegrityScore, IntegrityViolationSummary } from '../lib/integrity';

describe('E2E: Complete Exam Scenarios', () => {
  
  test('Scenario: Clean exam - honest student', async () => {
    const violations: IntegrityViolationSummary = {
      lookingAway: 2, // Brief thinking
      multipleFaces: 0,
      noFace: 0,
      lipSyncMismatch: 0,
      faceMismatch: 0,
      tabSwitch: 0,
      copyPaste: 0,
    };
    
    const score = calculateIntegrityScore(violations);
    expect(score).toBeGreaterThan(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('Scenario: Phone usage detected', async () => {
    const violations: IntegrityViolationSummary = {
      lookingAway: 5,
      multipleFaces: 0,
      noFace: 0,
      lipSyncMismatch: 0,
      faceMismatch: 0,
      tabSwitch: 0,
      copyPaste: 0,
      phoneDetected: 1,
      handGestureAnomaly: 1,
      headPoseAnomaly: 3,
    };
    
    const score = calculateIntegrityScore(violations);
    expect(score).toBeLessThan(50);
  });

  test('Scenario: Virtual camera blocked', async () => {
    const violations: IntegrityViolationSummary = {
      lookingAway: 0,
      multipleFaces: 0,
      noFace: 0,
      lipSyncMismatch: 0,
      faceMismatch: 0,
      tabSwitch: 0,
      copyPaste: 0,
      virtualCamera: 1,
    };
    
    const score = calculateIntegrityScore(violations);
    expect(score).toBe(50);
  });
});

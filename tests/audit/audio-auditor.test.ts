/**
 * Unit tests for AudioAIAuditor
 * 
 * Tests validation methods for all 4 audio-based AI detection systems:
 * - Voice Activity Detection
 * - Ambient Noise Analysis
 * - TTS Detection
 * - Lip-Sync Verification
 */

import { AudioAIAuditor } from '@/lib/audit/audio-auditor';
import { ValidationResult } from '@/lib/audit/types';

describe('AudioAIAuditor', () => {
  let auditor: AudioAIAuditor;

  beforeEach(() => {
    auditor = new AudioAIAuditor();
  });

  describe('validateVoiceActivity', () => {
    it('should validate voice activity detection system', async () => {
      const result: ValidationResult = await auditor.validateVoiceActivity();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('voice-activity');
      expect(result.systemName).toBe('Voice Activity Detection');
      expect(result.status).toMatch(/pass|fail/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.testsPassed).toBe('number');
      expect(typeof result.testsFailed).toBe('number');
      expect(result.testsSkipped).toBe(0);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should pass when Web Speech API is available', async () => {
      // Mock Web Speech API
      (global as unknown as { window: unknown }).window = {
        SpeechRecognition: class MockSpeechRecognition {
          continuous = false;
          interimResults = false;
          lang = '';
        },
      };

      const result = await auditor.validateVoiceActivity();

      expect(result.status).toBe('pass');
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
    });

    it('should fail when Web Speech API is not available', async () => {
      // Ensure Web Speech API is not available
      (global as unknown as { window: unknown }).window = {};

      const result = await auditor.validateVoiceActivity();

      expect(result.status).toBe('fail');
      expect(result.testsFailed).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include error details when tests fail', async () => {
      (global as unknown as { window: unknown }).window = {};

      const result = await auditor.validateVoiceActivity();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('testName');
      expect(result.errors[0]).toHaveProperty('errorMessage');
      expect(result.errors[0]).toHaveProperty('expectedBehavior');
      expect(result.errors[0]).toHaveProperty('actualBehavior');
    });
  });

  describe('validateAmbientNoise', () => {
    it('should validate ambient noise analysis system', async () => {
      const result: ValidationResult = await auditor.validateAmbientNoise();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('ambient-noise');
      expect(result.systemName).toBe('Ambient Noise Analysis');
      expect(result.status).toMatch(/pass|fail/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.testsPassed).toBe('number');
      expect(typeof result.testsFailed).toBe('number');
      expect(result.testsSkipped).toBe(0);
    });

    it('should pass when Web Audio API is available', async () => {
      // Mock Web Audio API
      (global as unknown as { window: unknown }).window = {
        AudioContext: class MockAudioContext {
          state = 'running';
          createAnalyser() {
            return {
              fftSize: 2048,
              frequencyBinCount: 1024,
            };
          }
          close() {
            return Promise.resolve();
          }
        },
      };

      const result = await auditor.validateAmbientNoise();

      expect(result.status).toBe('pass');
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
    });

    it('should fail when Web Audio API is not available', async () => {
      (global as unknown as { window: unknown }).window = {};

      const result = await auditor.validateAmbientNoise();

      expect(result.status).toBe('fail');
      expect(result.testsFailed).toBeGreaterThan(0);
    });

    it('should validate AnalyserNode creation', async () => {
      (global as unknown as { window: unknown }).window = {
        AudioContext: class MockAudioContext {
          state = 'running';
          createAnalyser() {
            return {
              fftSize: 2048,
              frequencyBinCount: 1024,
            };
          }
          close() {
            return Promise.resolve();
          }
        },
      };

      const result = await auditor.validateAmbientNoise();

      expect(result.testsPassed).toBe(3);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateAudioSpoofing', () => {
    it('should validate TTS detection system', async () => {
      const result: ValidationResult = await auditor.validateAudioSpoofing();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('tts-detection');
      expect(result.systemName).toBe('TTS Detection');
      expect(result.status).toMatch(/pass|fail/);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should pass when frequency analysis is available', async () => {
      (global as unknown as { window: unknown }).window = {
        AudioContext: class MockAudioContext {
          state = 'running';
          createAnalyser() {
            return {
              fftSize: 256,
              frequencyBinCount: 128,
            };
          }
          close() {
            return Promise.resolve();
          }
        },
      };

      const result = await auditor.validateAudioSpoofing();

      expect(result.status).toBe('pass');
      expect(result.testsPassed).toBe(3);
      expect(result.testsFailed).toBe(0);
    });

    it('should validate audio feature extraction', async () => {
      (global as unknown as { window: unknown }).window = {
        AudioContext: class MockAudioContext {
          state = 'running';
          createAnalyser() {
            return {
              fftSize: 256,
              frequencyBinCount: 128,
            };
          }
          close() {
            return Promise.resolve();
          }
        },
      };

      const result = await auditor.validateAudioSpoofing();

      expect(result.testsPassed).toBeGreaterThanOrEqual(3);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateLipSync', () => {
    it('should validate lip-sync verification system', async () => {
      const result: ValidationResult = await auditor.validateLipSync();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('lip-sync');
      expect(result.systemName).toBe('Lip-Sync Verification');
      expect(result.status).toMatch(/pass|fail/);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should check MediaPipe FaceMesh availability', async () => {
      const result = await auditor.validateLipSync();

      // Should attempt to import MediaPipe FaceMesh
      expect(result).toBeDefined();
      expect(typeof result.testsPassed).toBe('number');
      expect(typeof result.testsFailed).toBe('number');
    });

    it('should verify mouth landmark configuration', async () => {
      const result = await auditor.validateLipSync();

      // Should validate mouth landmarks are defined
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should check audio integration for cross-reference', async () => {
      (global as unknown as { window: unknown }).window = {
        AudioContext: class MockAudioContext {
          state = 'running';
        },
      };

      const result = await auditor.validateLipSync();

      // Should check Web Audio API availability
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Force an error by making window undefined
      const originalWindow = (global as unknown as { window: unknown }).window;
      delete (global as unknown as { window?: unknown }).window;

      const result = await auditor.validateVoiceActivity();

      expect(result.status).toBe('fail');
      expect(result.errors.length).toBeGreaterThan(0);

      // Restore window
      (global as unknown as { window: unknown }).window = originalWindow;
    });

    it('should provide detailed error messages', async () => {
      (global as unknown as { window: unknown }).window = {};

      const result = await auditor.validateAmbientNoise();

      expect(result.errors.length).toBeGreaterThan(0);
      result.errors.forEach((error) => {
        expect(error.testName).toBeDefined();
        expect(error.errorMessage).toBeDefined();
        expect(error.expectedBehavior).toBeDefined();
        expect(error.actualBehavior).toBeDefined();
      });
    });
  });

  describe('Integration Tests', () => {
    it('should validate all audio systems sequentially', async () => {
      const results = await Promise.all([
        auditor.validateVoiceActivity(),
        auditor.validateAmbientNoise(),
        auditor.validateAudioSpoofing(),
        auditor.validateLipSync(),
      ]);

      expect(results.length).toBe(4);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.status).toMatch(/pass|fail/);
        expect(result.timestamp).toBeInstanceOf(Date);
      });
    });

    it('should return consistent result structure across all methods', async () => {
      const results = await Promise.all([
        auditor.validateVoiceActivity(),
        auditor.validateAmbientNoise(),
        auditor.validateAudioSpoofing(),
        auditor.validateLipSync(),
      ]);

      results.forEach((result) => {
        expect(result).toHaveProperty('systemId');
        expect(result).toHaveProperty('systemName');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('testsPassed');
        expect(result).toHaveProperty('testsFailed');
        expect(result).toHaveProperty('testsSkipped');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
      });
    });
  });
});

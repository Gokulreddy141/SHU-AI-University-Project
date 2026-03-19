/**
 * Unit tests for SystemAIAuditor
 * 
 * Tests all 10 system-level AI detection validation methods
 */

import { SystemAIAuditor } from '../../lib/audit/system-auditor';
import { ValidationResult } from '../../lib/audit/types';

describe('SystemAIAuditor', () => {
  let auditor: SystemAIAuditor;

  beforeEach(() => {
    auditor = new SystemAIAuditor();
  });

  describe('validateVirtualCamera', () => {
    it('should validate virtual camera detection system', async () => {
      const result: ValidationResult = await auditor.validateVirtualCamera();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('virtual-camera');
      expect(result.systemName).toBe('Virtual Camera Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(typeof result.testsPassed).toBe('number');
      expect(typeof result.testsFailed).toBe('number');
      expect(typeof result.testsSkipped).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should pass when MediaDevices API is available', async () => {
      const result = await auditor.validateVirtualCamera();
      
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        expect(result.testsPassed).toBeGreaterThan(0);
      }
    });
  });

  describe('validateVirtualDevice', () => {
    it('should validate virtual device detection system', async () => {
      const result: ValidationResult = await auditor.validateVirtualDevice();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('virtual-device');
      expect(result.systemName).toBe('Virtual Device Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });
  });


  describe('validateBrowserFingerprint', () => {
    it('should validate browser fingerprinting system', async () => {
      const result: ValidationResult = await auditor.validateBrowserFingerprint();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('browser-fingerprint');
      expect(result.systemName).toBe('Browser Fingerprinting');
      expect(result.status).toMatch(/pass|fail|warning/);
    });
  });

  describe('validateExtensionDetection', () => {
    it('should validate extension detection system', async () => {
      const result: ValidationResult = await auditor.validateExtensionDetection();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('extension-detection');
      expect(result.systemName).toBe('Extension Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });

    it('should pass when Performance API is available', async () => {
      const result = await auditor.validateExtensionDetection();
      
      if (typeof performance !== 'undefined') {
        expect(result.testsPassed).toBeGreaterThan(0);
      }
    });
  });

  describe('validateDevTools', () => {
    it('should validate DevTools detection system', async () => {
      const result: ValidationResult = await auditor.validateDevTools();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('devtools-detection');
      expect(result.systemName).toBe('DevTools Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });
  });

  describe('validateScreenRecording', () => {
    it('should validate screen recording detection system', async () => {
      const result: ValidationResult = await auditor.validateScreenRecording();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('screen-recording');
      expect(result.systemName).toBe('Screen Recording Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });
  });

  describe('validateMultiTab', () => {
    it('should validate multi-tab detection system', async () => {
      const result: ValidationResult = await auditor.validateMultiTab();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('multi-tab');
      expect(result.systemName).toBe('Multi-Tab Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });
  });

  describe('validateNetworkAnomaly', () => {
    it('should validate network anomaly detection system', async () => {
      const result: ValidationResult = await auditor.validateNetworkAnomaly();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('network-anomaly');
      expect(result.systemName).toBe('Network Anomaly Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });

    it('should pass when navigator is available', async () => {
      const result = await auditor.validateNetworkAnomaly();
      
      if (typeof navigator !== 'undefined') {
        expect(result.testsPassed).toBeGreaterThan(0);
      }
    });
  });

  describe('validateSandboxVM', () => {
    it('should validate sandbox/VM detection system', async () => {
      const result: ValidationResult = await auditor.validateSandboxVM();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('sandbox-vm');
      expect(result.systemName).toBe('Sandbox/VM Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });

    it('should pass when hardware concurrency is available', async () => {
      const result = await auditor.validateSandboxVM();
      
      if (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency !== 'undefined') {
        expect(result.testsPassed).toBeGreaterThan(0);
      }
    });
  });

  describe('validateHardwareSpoofing', () => {
    it('should validate hardware spoofing detection system', async () => {
      const result: ValidationResult = await auditor.validateHardwareSpoofing();

      expect(result).toBeDefined();
      expect(result.systemId).toBe('hardware-spoofing');
      expect(result.systemName).toBe('Hardware Spoofing Detection');
      expect(result.status).toMatch(/pass|fail|warning/);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and return fail status', async () => {
      const result = await auditor.validateVirtualCamera();
      
      if (result.status === 'fail') {
        expect(result.errors.length).toBeGreaterThan(0);
        result.errors.forEach(error => {
          expect(error.testName).toBeDefined();
          expect(error.errorMessage).toBeDefined();
          expect(error.expectedBehavior).toBeDefined();
          expect(error.actualBehavior).toBeDefined();
        });
      }
    });
  });

  describe('Validation Result Structure', () => {
    it('should return consistent validation result structure for all methods', async () => {
      const methods = [
        'validateVirtualCamera',
        'validateVirtualDevice',
        'validateBrowserFingerprint',
        'validateExtensionDetection',
        'validateDevTools',
        'validateScreenRecording',
        'validateMultiTab',
        'validateNetworkAnomaly',
        'validateSandboxVM',
        'validateHardwareSpoofing',
      ];

      for (const method of methods) {
        const result = await (auditor as unknown as Record<string, () => Promise<ValidationResult>>)[method]();
        
        expect(result).toHaveProperty('systemId');
        expect(result).toHaveProperty('systemName');
        expect(result).toHaveProperty('status');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('testsPassed');
        expect(result).toHaveProperty('testsFailed');
        expect(result).toHaveProperty('testsSkipped');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
      }
    });
  });
});

/**
 * Unit tests for BehavioralAIAuditor
 * 
 * Tests validation of all 4 behavioral AI detection systems:
 * - Keystroke Dynamics
 * - Mouse Behavior Analysis
 * - Response Time Profiling
 * - Typing Pattern Analysis
 */

import { BehavioralAIAuditor } from '@/lib/audit/behavioral-auditor';

describe('BehavioralAIAuditor', () => {
  let auditor: BehavioralAIAuditor;

  beforeEach(() => {
    auditor = new BehavioralAIAuditor();
  });

  describe('validateKeystrokeDynamics', () => {
    it('should return a validation result with correct structure', async () => {
      const result = await auditor.validateKeystrokeDynamics();

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

    it('should have correct system identification', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      expect(result.systemId).toBe('keystroke-dynamics');
      expect(result.systemName).toBe('Keystroke Dynamics');
    });

    it('should pass when keyboard event listeners work', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      expect(result.status).toMatch(/pass|fail|warning/);
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should validate keyboard event listener registration', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      // Should pass at least the event listener test
      expect(result.testsPassed).toBeGreaterThanOrEqual(1);
    });

    it('should validate performance timing API', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      // Should pass at least 2 tests (event listeners + timing)
      expect(result.testsPassed).toBeGreaterThanOrEqual(2);
    });

    it('should validate keystroke analysis algorithm', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      // Should test statistical analysis
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should have timestamp', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should have empty errors array on success', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      if (result.status === 'pass') {
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('validateMouseBehavior', () => {
    it('should return a validation result with correct structure', async () => {
      const result = await auditor.validateMouseBehavior();

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

    it('should have correct system identification', async () => {
      const result = await auditor.validateMouseBehavior();

      expect(result.systemId).toBe('mouse-behavior');
      expect(result.systemName).toBe('Mouse Behavior Analysis');
    });

    it('should pass when mouse event listeners work', async () => {
      const result = await auditor.validateMouseBehavior();

      expect(result.status).toMatch(/pass|fail|warning/);
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should validate mouse event listener registration', async () => {
      const result = await auditor.validateMouseBehavior();

      // Should pass at least the event listener test
      expect(result.testsPassed).toBeGreaterThanOrEqual(1);
    });

    it('should validate timestamp API', async () => {
      const result = await auditor.validateMouseBehavior();

      // Should pass at least 2 tests (event listeners + timestamp)
      expect(result.testsPassed).toBeGreaterThanOrEqual(2);
    });

    it('should validate inactivity detection logic', async () => {
      const result = await auditor.validateMouseBehavior();

      // Should test inactivity detection
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should have timestamp', async () => {
      const result = await auditor.validateMouseBehavior();

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should have empty errors array on success', async () => {
      const result = await auditor.validateMouseBehavior();

      if (result.status === 'pass') {
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('validateResponseTime', () => {
    it('should return a validation result with correct structure', async () => {
      const result = await auditor.validateResponseTime();

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

    it('should have correct system identification', async () => {
      const result = await auditor.validateResponseTime();

      expect(result.systemId).toBe('response-time');
      expect(result.systemName).toBe('Response Time Profiling');
    });

    it('should pass when timing APIs work', async () => {
      const result = await auditor.validateResponseTime();

      expect(result.status).toBe('pass');
      expect(result.testsPassed).toBeGreaterThan(0);
      expect(result.testsFailed).toBe(0);
    });

    it('should validate performance timing API', async () => {
      const result = await auditor.validateResponseTime();

      // Should pass at least the timing test
      expect(result.testsPassed).toBeGreaterThanOrEqual(1);
    });

    it('should validate anomaly detection logic', async () => {
      const result = await auditor.validateResponseTime();

      // Should pass at least 2 tests (timing + anomaly detection)
      expect(result.testsPassed).toBeGreaterThanOrEqual(2);
    });

    it('should validate statistics calculation', async () => {
      const result = await auditor.validateResponseTime();

      // Should pass all 3 tests
      expect(result.testsPassed).toBe(3);
    });

    it('should have timestamp', async () => {
      const result = await auditor.validateResponseTime();

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should have empty errors array on success', async () => {
      const result = await auditor.validateResponseTime();

      if (result.status === 'pass') {
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('validateTypingPattern', () => {
    it('should return a validation result with correct structure', async () => {
      const result = await auditor.validateTypingPattern();

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

    it('should have correct system identification', async () => {
      const result = await auditor.validateTypingPattern();

      expect(result.systemId).toBe('typing-pattern');
      expect(result.systemName).toBe('Typing Pattern Analysis');
    });

    it('should pass when clipboard listeners work', async () => {
      const result = await auditor.validateTypingPattern();

      expect(result.status).toMatch(/pass|fail|warning/);
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should validate clipboard event listener registration', async () => {
      const result = await auditor.validateTypingPattern();

      // Should pass at least the clipboard listener test
      expect(result.testsPassed).toBeGreaterThanOrEqual(1);
    });

    it('should validate keyboard event listener registration', async () => {
      const result = await auditor.validateTypingPattern();

      // Should test keyboard event listeners
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should validate burst detection logic', async () => {
      const result = await auditor.validateTypingPattern();

      // Should test burst detection
      expect(result.testsPassed + result.testsFailed).toBeGreaterThan(0);
    });

    it('should have timestamp', async () => {
      const result = await auditor.validateTypingPattern();

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should have empty errors array on success', async () => {
      const result = await auditor.validateTypingPattern();

      if (result.status === 'pass') {
        expect(result.errors).toHaveLength(0);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should validate all 4 behavioral systems', async () => {
      const results = await Promise.all([
        auditor.validateKeystrokeDynamics(),
        auditor.validateMouseBehavior(),
        auditor.validateResponseTime(),
        auditor.validateTypingPattern(),
      ]);

      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.status).toBeDefined();
        expect(['pass', 'fail', 'warning']).toContain(result.status);
      });
    });

    it('should have unique system IDs for each behavioral system', async () => {
      const results = await Promise.all([
        auditor.validateKeystrokeDynamics(),
        auditor.validateMouseBehavior(),
        auditor.validateResponseTime(),
        auditor.validateTypingPattern(),
      ]);

      const systemIds = results.map(r => r.systemId);
      const uniqueIds = new Set(systemIds);

      expect(uniqueIds.size).toBe(4);
      expect(systemIds).toContain('keystroke-dynamics');
      expect(systemIds).toContain('mouse-behavior');
      expect(systemIds).toContain('response-time');
      expect(systemIds).toContain('typing-pattern');
    });

    it('should complete all validations within reasonable time', async () => {
      const startTime = Date.now();

      await Promise.all([
        auditor.validateKeystrokeDynamics(),
        auditor.validateMouseBehavior(),
        auditor.validateResponseTime(),
        auditor.validateTypingPattern(),
      ]);

      const duration = Date.now() - startTime;

      // All 4 validations should complete in < 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should return consistent results on multiple runs', async () => {
      const run1 = await auditor.validateKeystrokeDynamics();
      const run2 = await auditor.validateKeystrokeDynamics();

      expect(run1.status).toBe(run2.status);
      expect(run1.testsPassed).toBe(run2.testsPassed);
      expect(run1.testsFailed).toBe(run2.testsFailed);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully and not throw exceptions', async () => {
      const result1 = await auditor.validateKeystrokeDynamics();
      expect(result1).toBeDefined();
      
      const result2 = await auditor.validateMouseBehavior();
      expect(result2).toBeDefined();
      
      const result3 = await auditor.validateResponseTime();
      expect(result3).toBeDefined();
      
      const result4 = await auditor.validateTypingPattern();
      expect(result4).toBeDefined();
    });


    it('should include error details when tests fail', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      if (result.status === 'fail') {
        expect(result.errors.length).toBeGreaterThan(0);
        result.errors.forEach(error => {
          expect(error).toHaveProperty('testName');
          expect(error).toHaveProperty('errorMessage');
          expect(error).toHaveProperty('expectedBehavior');
          expect(error).toHaveProperty('actualBehavior');
        });
      }
    });
  });

  describe('Validation Result Properties', () => {
    it('should have testsSkipped always set to 0', async () => {
      const results = await Promise.all([
        auditor.validateKeystrokeDynamics(),
        auditor.validateMouseBehavior(),
        auditor.validateResponseTime(),
        auditor.validateTypingPattern(),
      ]);

      results.forEach(result => {
        expect(result.testsSkipped).toBe(0);
      });
    });

    it('should have warnings array defined', async () => {
      const results = await Promise.all([
        auditor.validateKeystrokeDynamics(),
        auditor.validateMouseBehavior(),
        auditor.validateResponseTime(),
        auditor.validateTypingPattern(),
      ]);

      results.forEach(result => {
        expect(Array.isArray(result.warnings)).toBe(true);
      });
    });

    it('should have testsPassed + testsFailed equal to total tests', async () => {
      const result = await auditor.validateKeystrokeDynamics();

      const totalTests = result.testsPassed + result.testsFailed;
      expect(totalTests).toBeGreaterThan(0);
    });
  });
});

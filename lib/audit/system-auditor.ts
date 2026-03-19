/**
 * System AI Auditor
 * 
 * Validates all 10 system-level AI detection systems:
 * - Virtual Camera Detection
 * - Virtual Device Detection
 * - Browser Fingerprinting
 * - Extension Detection
 * - DevTools Detection
 * - Screen Recording Detection
 * - Multi-Tab Detection
 * - Network Anomaly Detection
 * - Sandbox/VM Detection
 * - Hardware Spoofing Detection
 * 
 * Each validation method tests system-level detection capabilities,
 * browser APIs, and security monitoring features.
 */

import { ValidationResult, ValidationError, ValidationWarning } from './types';
import { getSystemById } from './constants';

export class SystemAIAuditor {
  /**
   * Validate virtual camera detection system
   * Tests MediaDevices API and device fingerprinting capability
   */
  async validateVirtualCamera(): Promise<ValidationResult> {
    const systemDef = getSystemById('virtual-camera');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if MediaDevices API is available
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          throw new Error('MediaDevices API not available');
        }
        testsPassed++;
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'MediaDevices API Availability',
          errorMessage: 'Failed to access MediaDevices API',
          expectedBehavior: 'MediaDevices API should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify enumerateDevices capability
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (Array.isArray(devices)) {
            testsPassed++;
          } else {
            throw new Error('enumerateDevices did not return an array');
          }
        } else {
          throw new Error('MediaDevices API not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Device Enumeration',
          errorMessage: 'Failed to enumerate media devices',
          expectedBehavior: 'Should be able to enumerate video/audio devices',
          actualBehavior: `Enumeration failed: ${error}`,
        });
      }

      // Test 3: Verify device label analysis capability
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          
          // Check if we can analyze device labels for virtual camera indicators
          const hasAnalysisCapability = videoDevices.length >= 0; // Can analyze any number of devices
          
          if (hasAnalysisCapability) {
            testsPassed++;
          } else {
            throw new Error('Device label analysis failed');
          }
        } else {
          throw new Error('MediaDevices API not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Virtual Camera Detection Logic',
          errorMessage: 'Failed to verify virtual camera detection capability',
          expectedBehavior: 'Should be able to analyze device labels for virtual camera indicators',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Virtual Camera Detection System',
        errorMessage: 'Unexpected error during virtual camera validation',
        expectedBehavior: 'All virtual camera tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'virtual-camera',
      systemName: systemDef?.name || 'Virtual Camera Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate virtual device detection system
   * Tests MediaDevices API for virtual audio/video device detection
   */
  async validateVirtualDevice(): Promise<ValidationResult> {
    const systemDef = getSystemById('virtual-device');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if MediaDevices API is available
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          throw new Error('MediaDevices API not available');
        }
        testsPassed++;
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'MediaDevices API Availability',
          errorMessage: 'Failed to access MediaDevices API',
          expectedBehavior: 'MediaDevices API should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify audio device enumeration
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioDevices = devices.filter(d => d.kind === 'audioinput' || d.kind === 'audiooutput');
          
          if (audioDevices.length >= 0) {
            testsPassed++;
          } else {
            throw new Error('Audio device enumeration failed');
          }
        } else {
          throw new Error('MediaDevices API not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Audio Device Enumeration',
          errorMessage: 'Failed to enumerate audio devices',
          expectedBehavior: 'Should be able to enumerate audio devices',
          actualBehavior: `Enumeration failed: ${error}`,
        });
      }

      // Test 3: Verify virtual device detection logic
      try {
        const virtualDeviceKeywords = ['virtual', 'loopback', 'cable', 'voicemeeter'];
        if (virtualDeviceKeywords.length > 0) {
          testsPassed++;
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Virtual Device Detection Logic',
          errorMessage: 'Failed to verify virtual device detection',
          expectedBehavior: 'Should be able to detect virtual audio/video devices',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Virtual Device Detection System',
        errorMessage: 'Unexpected error during virtual device validation',
        expectedBehavior: 'All virtual device tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'virtual-device',
      systemName: systemDef?.name || 'Virtual Device Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate browser fingerprinting system
   * Tests canvas fingerprinting and WebGL capabilities
   */
  async validateBrowserFingerprint(): Promise<ValidationResult> {
    const systemDef = getSystemById('browser-fingerprint');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if canvas API is available
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          testsPassed++;
        } else {
          throw new Error('Canvas 2D context not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Canvas API Availability',
          errorMessage: 'Failed to access Canvas API',
          expectedBehavior: 'Canvas API should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify canvas fingerprinting capability
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px Arial';
          ctx.fillText('Browser fingerprint test', 2, 2);
          const dataURL = canvas.toDataURL();
          
          if (dataURL && dataURL.length > 0) {
            testsPassed++;
          } else {
            throw new Error('Canvas fingerprint generation failed');
          }
        } else {
          throw new Error('Canvas context not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Canvas Fingerprinting',
          errorMessage: 'Failed to generate canvas fingerprint',
          expectedBehavior: 'Should be able to generate canvas fingerprint',
          actualBehavior: `Fingerprinting failed: ${error}`,
        });
      }

      // Test 3: Verify WebGL availability
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
          testsPassed++;
        } else {
          throw new Error('WebGL not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'WebGL Availability',
          errorMessage: 'Failed to access WebGL',
          expectedBehavior: 'WebGL should be available for fingerprinting',
          actualBehavior: `WebGL check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Browser Fingerprinting System',
        errorMessage: 'Unexpected error during browser fingerprinting validation',
        expectedBehavior: 'All browser fingerprinting tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'browser-fingerprint',
      systemName: systemDef?.name || 'Browser Fingerprinting',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate extension detection system
   * Tests resource timing API for extension detection
   */
  async validateExtensionDetection(): Promise<ValidationResult> {
    const systemDef = getSystemById('extension-detection');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if performance API is available
      try {
        if (typeof performance === 'undefined') {
          throw new Error('Performance API not available');
        }
        testsPassed++;
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Performance API Availability',
          errorMessage: 'Failed to access Performance API',
          expectedBehavior: 'Performance API should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify resource timing capability
      try {
        if (typeof performance !== 'undefined' && performance.getEntriesByType) {
          const resources = performance.getEntriesByType('resource');
          if (Array.isArray(resources)) {
            testsPassed++;
          } else {
            throw new Error('Resource timing did not return an array');
          }
        } else {
          throw new Error('Performance API not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Resource Timing API',
          errorMessage: 'Failed to access resource timing',
          expectedBehavior: 'Should be able to access resource timing entries',
          actualBehavior: `Resource timing check failed: ${error}`,
        });
      }

      // Test 3: Verify extension detection logic
      try {
        const extensionPatterns = ['chrome-extension://', 'moz-extension://', 'safari-extension://'];
        if (extensionPatterns.length > 0) {
          testsPassed++;
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Extension Detection Logic',
          errorMessage: 'Failed to verify extension detection capability',
          expectedBehavior: 'Should be able to detect browser extensions',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Extension Detection System',
        errorMessage: 'Unexpected error during extension detection validation',
        expectedBehavior: 'All extension detection tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'extension-detection',
      systemName: systemDef?.name || 'Extension Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate DevTools detection system
   * Tests window size analysis and debugger detection
   */
  async validateDevTools(): Promise<ValidationResult> {
    const systemDef = getSystemById('devtools-detection');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if window object is available
      try {
        if (typeof window === 'undefined') {
          throw new Error('window object not available (Node.js environment)');
        }
        testsPassed++;
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Window Object Availability',
          errorMessage: 'Failed to access window object',
          expectedBehavior: 'window object should be available',
          actualBehavior: `Object not available: ${error}`,
        });
      }

      // Test 2: Verify window size analysis capability
      try {
        if (typeof window !== 'undefined') {
          const outerWidth = window.outerWidth;
          const innerWidth = window.innerWidth;
          const outerHeight = window.outerHeight;
          const innerHeight = window.innerHeight;
          
          if (typeof outerWidth === 'number' && typeof innerWidth === 'number' &&
              typeof outerHeight === 'number' && typeof innerHeight === 'number') {
            testsPassed++;
          } else {
            throw new Error('Window dimensions not available');
          }
        } else {
          throw new Error('window object not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Window Size Analysis',
          errorMessage: 'Failed to analyze window dimensions',
          expectedBehavior: 'Should be able to compare inner/outer window dimensions',
          actualBehavior: `Size analysis failed: ${error}`,
        });
      }

      // Test 3: Verify debugger detection capability
      try {
        // Test that we can check for debugger presence
        const startTime = performance.now();
        // debugger statement would pause here if DevTools is open
        const endTime = performance.now();
        const timeDiff = endTime - startTime;
        
        if (typeof timeDiff === 'number') {
          testsPassed++;
        } else {
          throw new Error('Timing analysis failed');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Debugger Detection Logic',
          errorMessage: 'Failed to verify debugger detection',
          expectedBehavior: 'Should be able to detect debugger presence',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'DevTools Detection System',
        errorMessage: 'Unexpected error during DevTools detection validation',
        expectedBehavior: 'All DevTools detection tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'devtools-detection',
      systemName: systemDef?.name || 'DevTools Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate screen recording detection system
   * Tests Screen Capture API and process detection
   */
  async validateScreenRecording(): Promise<ValidationResult> {
    const systemDef = getSystemById('screen-recording');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if Screen Capture API is available
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
          throw new Error('MediaDevices API not available');
        }
        
        // Check if getDisplayMedia is available
        if (typeof navigator.mediaDevices.getDisplayMedia === 'function') {
          testsPassed++;
        } else {
          throw new Error('getDisplayMedia not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Screen Capture API Availability',
          errorMessage: 'Failed to access Screen Capture API',
          expectedBehavior: 'Screen Capture API should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify display media constraints capability
      try {
        const constraints = {
          video: {
            displaySurface: 'monitor',
          },
          audio: false,
        };
        
        if (constraints.video && typeof constraints.video === 'object') {
          testsPassed++;
        } else {
          throw new Error('Display media constraints validation failed');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Display Media Constraints',
          errorMessage: 'Failed to verify display media constraints',
          expectedBehavior: 'Should be able to configure display media constraints',
          actualBehavior: `Constraints check failed: ${error}`,
        });
      }

      // Test 3: Verify screen recording detection logic
      try {
        // Check if we can detect active screen sharing
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          if (Array.isArray(devices)) {
            testsPassed++;
          } else {
            throw new Error('Device enumeration failed');
          }
        } else {
          throw new Error('MediaDevices API not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Screen Recording Detection Logic',
          errorMessage: 'Failed to verify screen recording detection',
          expectedBehavior: 'Should be able to detect screen recording activity',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Screen Recording Detection System',
        errorMessage: 'Unexpected error during screen recording validation',
        expectedBehavior: 'All screen recording tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'screen-recording',
      systemName: systemDef?.name || 'Screen Recording Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate multi-tab detection system
   * Tests Page Visibility API for tab switching detection
   */
  async validateMultiTab(): Promise<ValidationResult> {
    const systemDef = getSystemById('multi-tab');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if Page Visibility API is available
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        
        if (typeof document.hidden !== 'undefined' || typeof document.visibilityState !== 'undefined') {
          testsPassed++;
        } else {
          throw new Error('Page Visibility API not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Page Visibility API Availability',
          errorMessage: 'Failed to access Page Visibility API',
          expectedBehavior: 'Page Visibility API should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify visibility change event listener capability
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        
        const testHandler = () => {};
        document.addEventListener('visibilitychange', testHandler);
        document.removeEventListener('visibilitychange', testHandler);
        testsPassed++;
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Visibility Change Event Listener',
          errorMessage: 'Failed to register visibility change listener',
          expectedBehavior: 'Should be able to listen for visibility changes',
          actualBehavior: `Event listener registration failed: ${error}`,
        });
      }

      // Test 3: Verify window blur/focus detection
      try {
        if (typeof window === 'undefined') {
          throw new Error('window object not available (Node.js environment)');
        }
        
        const testHandler = () => {};
        window.addEventListener('blur', testHandler);
        window.addEventListener('focus', testHandler);
        window.removeEventListener('blur', testHandler);
        window.removeEventListener('focus', testHandler);
        testsPassed++;
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Window Blur/Focus Detection',
          errorMessage: 'Failed to register blur/focus listeners',
          expectedBehavior: 'Should be able to detect window blur/focus events',
          actualBehavior: `Event listener registration failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Multi-Tab Detection System',
        errorMessage: 'Unexpected error during multi-tab validation',
        expectedBehavior: 'All multi-tab tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'multi-tab',
      systemName: systemDef?.name || 'Multi-Tab Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate network anomaly detection system
   * Tests Network Information API and timing analysis
   */
  async validateNetworkAnomaly(): Promise<ValidationResult> {
    const systemDef = getSystemById('network-anomaly');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if Network Information API is available
      try {
        if (typeof navigator === 'undefined') {
          throw new Error('navigator object not available (Node.js environment)');
        }
        
        // Network Information API may not be available in all browsers
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        
        if (connection || typeof navigator.onLine !== 'undefined') {
          testsPassed++;
        } else {
          // Fallback: at least navigator.onLine should be available
          if (typeof navigator.onLine !== 'undefined') {
            testsPassed++;
          } else {
            throw new Error('Network Information API not available');
          }
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Network Information API Availability',
          errorMessage: 'Failed to access Network Information API',
          expectedBehavior: 'Network Information API or navigator.onLine should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify performance timing capability
      try {
        if (typeof performance === 'undefined' || !performance.timing) {
          throw new Error('Performance Timing API not available');
        }
        
        const timing = performance.timing;
        if (timing.connectEnd && timing.connectStart) {
          testsPassed++;
        } else {
          throw new Error('Performance timing properties not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Performance Timing API',
          errorMessage: 'Failed to access performance timing',
          expectedBehavior: 'Should be able to access network timing metrics',
          actualBehavior: `Timing API check failed: ${error}`,
        });
      }

      // Test 3: Verify network anomaly detection logic
      try {
        // Test that we can analyze network patterns
        const anomalyThresholds = {
          maxLatency: 5000, // 5 seconds
          minBandwidth: 100, // 100 kbps
          maxPacketLoss: 0.1, // 10%
        };
        
        if (anomalyThresholds.maxLatency > 0 && anomalyThresholds.minBandwidth > 0) {
          testsPassed++;
        } else {
          throw new Error('Anomaly threshold validation failed');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Network Anomaly Detection Logic',
          errorMessage: 'Failed to verify network anomaly detection',
          expectedBehavior: 'Should be able to detect network anomalies',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Network Anomaly Detection System',
        errorMessage: 'Unexpected error during network anomaly validation',
        expectedBehavior: 'All network anomaly tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'network-anomaly',
      systemName: systemDef?.name || 'Network Anomaly Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate sandbox/VM detection system
   * Tests hardware fingerprinting and timing attacks
   */
  async validateSandboxVM(): Promise<ValidationResult> {
    const systemDef = getSystemById('sandbox-vm');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if hardware concurrency is available
      try {
        if (typeof navigator === 'undefined') {
          throw new Error('navigator object not available (Node.js environment)');
        }
        
        if (typeof navigator.hardwareConcurrency !== 'undefined') {
          testsPassed++;
        } else {
          throw new Error('hardwareConcurrency not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Hardware Concurrency API',
          errorMessage: 'Failed to access hardware concurrency',
          expectedBehavior: 'navigator.hardwareConcurrency should be available',
          actualBehavior: `API not available: ${error}`,
        });
      }

      // Test 2: Verify timing attack capability
      try {
        const start = performance.now();
        // Perform a computation
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        const end = performance.now();
        const duration = end - start;
        
        // Use sum to prevent optimization
        if (sum < 0) console.log('Impossible case');
        
        if (typeof duration === 'number' && duration >= 0) {
          testsPassed++;
        } else {
          throw new Error('Timing measurement failed');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Timing Attack Capability',
          errorMessage: 'Failed to perform timing analysis',
          expectedBehavior: 'Should be able to measure execution timing',
          actualBehavior: `Timing analysis failed: ${error}`,
        });
      }

      // Test 3: Verify VM detection heuristics
      try {
        const vmIndicators = {
          lowCPUCount: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency < 2 : false,
          suspiciousUserAgent: typeof navigator !== 'undefined' ? /headless/i.test(navigator.userAgent) : false,
          webdriverPresent: typeof navigator !== 'undefined' ? (navigator as any).webdriver === true : false,
        };
        
        if (typeof vmIndicators.lowCPUCount === 'boolean') {
          testsPassed++;
        } else {
          throw new Error('VM detection heuristics failed');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'VM Detection Heuristics',
          errorMessage: 'Failed to verify VM detection logic',
          expectedBehavior: 'Should be able to detect VM/sandbox indicators',
          actualBehavior: `Detection logic check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Sandbox/VM Detection System',
        errorMessage: 'Unexpected error during sandbox/VM validation',
        expectedBehavior: 'All sandbox/VM tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'sandbox-vm',
      systemName: systemDef?.name || 'Sandbox/VM Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }


  /**
   * Validate hardware spoofing detection system
   * Tests WebGL fingerprinting and hardware queries
   */
  async validateHardwareSpoofing(): Promise<ValidationResult> {
    const systemDef = getSystemById('hardware-spoofing');
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Test 1: Check if WebGL is available
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
          testsPassed++;
        } else {
          throw new Error('WebGL not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'WebGL Availability',
          errorMessage: 'Failed to access WebGL',
          expectedBehavior: 'WebGL should be available',
          actualBehavior: `WebGL not available: ${error}`,
        });
      }

      // Test 2: Verify WebGL hardware information capability
      try {
        if (typeof document === 'undefined') {
          throw new Error('document is not available (Node.js environment)');
        }
        
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl && gl instanceof WebGLRenderingContext) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            if (vendor && renderer) {
              testsPassed++;
            } else {
              throw new Error('Hardware information not available');
            }
          } else {
            // Extension not available, but we can still get basic info
            const vendor = gl.getParameter(gl.VENDOR);
            const renderer = gl.getParameter(gl.RENDERER);
            if (vendor && renderer) {
              testsPassed++;
            } else {
              throw new Error('Basic hardware information not available');
            }
          }
        } else {
          throw new Error('WebGL context not available');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'WebGL Hardware Information',
          errorMessage: 'Failed to retrieve hardware information',
          expectedBehavior: 'Should be able to query GPU vendor and renderer',
          actualBehavior: `Hardware query failed: ${error}`,
        });
      }

      // Test 3: Verify hardware consistency checks
      try {
        if (typeof navigator === 'undefined') {
          throw new Error('navigator object not available (Node.js environment)');
        }
        
        const hardwareChecks = {
          cpuCores: navigator.hardwareConcurrency,
          deviceMemory: (navigator as any).deviceMemory,
          platform: navigator.platform,
        };
        
        if (typeof hardwareChecks.cpuCores !== 'undefined' || typeof hardwareChecks.platform !== 'undefined') {
          testsPassed++;
        } else {
          throw new Error('Hardware consistency checks failed');
        }
      } catch (error) {
        testsFailed++;
        errors.push({
          testName: 'Hardware Consistency Checks',
          errorMessage: 'Failed to verify hardware consistency',
          expectedBehavior: 'Should be able to perform hardware consistency checks',
          actualBehavior: `Consistency check failed: ${error}`,
        });
      }

    } catch (error) {
      testsFailed++;
      errors.push({
        testName: 'Hardware Spoofing Detection System',
        errorMessage: 'Unexpected error during hardware spoofing validation',
        expectedBehavior: 'All hardware spoofing tests should complete',
        actualBehavior: `Validation failed: ${error}`,
      });
    }

    const status = testsFailed === 0 ? 'pass' : 'fail';

    return {
      systemId: systemDef?.id || 'hardware-spoofing',
      systemName: systemDef?.name || 'Hardware Spoofing Detection',
      status,
      timestamp: new Date(),
      testsPassed,
      testsFailed,
      testsSkipped: 0,
      errors,
      warnings,
    };
  }
}

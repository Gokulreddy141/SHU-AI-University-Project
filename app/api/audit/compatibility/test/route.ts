import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiUtils";
import { SystemCompatibility, TestResult, CompatibilityTestRecordData } from "@/lib/audit/types";
import { createCompatibilityTestRecord } from "@/lib/audit/db-operations";
import { AI_SYSTEMS } from "@/lib/audit/constants";

// POST /api/audit/compatibility/test — Test AI system compatibility for specific browser
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { browser, browserVersion, platform, systemIds } = body;

    // Validate required fields
    if (!browser || !browserVersion) {
      return NextResponse.json(
        { message: "Browser and browserVersion are required" },
        { status: 400 }
      );
    }

    // Validate browser
    const supportedBrowsers = ['chrome', 'edge', 'firefox', 'safari'];
    if (!supportedBrowsers.includes(browser.toLowerCase())) {
      return NextResponse.json(
        { 
          message: "Unsupported browser", 
          supportedBrowsers 
        },
        { status: 400 }
      );
    }

    // Get systems to test (all if not specified)
    const systemsToTest = systemIds || AI_SYSTEMS.map(s => s.id);
    
    // Generate execution ID
    const executionId = `compat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Test compatibility for each system
    const systemCompatibility: SystemCompatibility[] = [];
    
    for (const systemId of systemsToTest) {
      const system = AI_SYSTEMS.find(s => s.id === systemId);
      if (!system) {
        continue; // Skip unknown systems
      }

      const compatibility = await testSystemCompatibility(
        systemId,
        system.name,
        browser.toLowerCase(),
        browserVersion
      );
      
      systemCompatibility.push(compatibility);
    }

    // Calculate overall compatibility percentage
    const supportedCount = systemCompatibility.filter(s => s.supported).length;
    const partialCount = systemCompatibility.filter(s => s.partialSupport && !s.supported).length;
    const overallCompatibility = Math.round(
      ((supportedCount + (partialCount * 0.5)) / systemCompatibility.length) * 100
    );

    // Create compatibility test record
    const recordData: CompatibilityTestRecordData = {
      executionId,
      browser: browser.toLowerCase(),
      browserVersion,
      platform: platform || 'unknown',
      timestamp: new Date(),
      systemCompatibility,
      overallCompatibility,
    };

    await createCompatibilityTestRecord(recordData);

    return NextResponse.json(
      {
        executionId,
        browser: browser.toLowerCase(),
        browserVersion,
        platform: platform || 'unknown',
        systemCompatibility,
        overallCompatibility,
        testedSystems: systemCompatibility.length,
        supportedSystems: supportedCount,
        partialSystems: partialCount,
        unsupportedSystems: systemCompatibility.length - supportedCount - partialCount,
      },
      { status: 200 }
    );

  } catch (error: unknown) {

    console.error('Error testing compatibility:', error);
    return handleApiError(error);
  }
}

/**
 * Test compatibility for a specific AI system
 */
async function testSystemCompatibility(
  systemId: string,
  systemName: string,
  browser: string,
  browserVersion: string
): Promise<SystemCompatibility> {
  const testResults: TestResult[] = [];
  let supported = true;
  let partialSupport = false;
  const limitations: string[] = [];

  // Browser-specific compatibility rules
  const browserRules = getBrowserCompatibilityRules();
  const systemRules = browserRules[systemId] || {};

  // Test basic browser support
  const basicSupport = testBasicBrowserSupport(systemId, browser, browserVersion);
  testResults.push(basicSupport);
  
  if (basicSupport.status === 'fail') {
    supported = false;
    limitations.push(basicSupport.errorMessage || 'Basic browser support failed');
  }

  // Test API availability
  const apiSupport = testAPIAvailability(systemId, browser);
  testResults.push(apiSupport);
  
  if (apiSupport.status === 'fail') {
    supported = false;
    limitations.push(apiSupport.errorMessage || 'Required APIs not available');
  } else if (apiSupport.status === 'warning') {
    partialSupport = true;
    limitations.push(apiSupport.errorMessage || 'Limited API support');
  }

  // Test performance expectations
  const performanceTest = testPerformanceExpectations(systemId, browser);
  testResults.push(performanceTest);
  
  if (performanceTest.status === 'warning') {
    partialSupport = true;
    limitations.push(performanceTest.errorMessage || 'Performance limitations');
  }

  // Apply system-specific rules
  if (systemRules.limitations) {
    limitations.push(...systemRules.limitations);
    if (systemRules.partialSupport) {
      partialSupport = true;
    }
    if (systemRules.unsupported) {
      supported = false;
    }
  }

  return {
    systemId,
    supported: supported && !limitations.some(l => l.includes('not supported')),
    partialSupport: partialSupport || limitations.length > 0,
    limitations: limitations.length > 0 ? limitations : undefined,
    testResults,
  };
}

/**
 * Test basic browser support for AI system
 */
function testBasicBrowserSupport(systemId: string, browser: string, browserVersion: string): TestResult {
  const startTime = Date.now();
  
  // Version parsing helper
  const parseVersion = (version: string): number => {
    const major = parseInt(version.split('.')[0], 10);
    return isNaN(major) ? 0 : major;
  };

  const majorVersion = parseVersion(browserVersion);

  // Minimum version requirements
  const minVersions: Record<string, Record<string, number>> = {
    chrome: { default: 88 },
    edge: { default: 88 },
    firefox: { default: 85 },
    safari: { default: 14 },
  };

  const minVersion = minVersions[browser]?.default || 0;
  const duration = Date.now() - startTime;

  if (majorVersion < minVersion) {
    return {
      testName: 'Basic Browser Support',
      status: 'fail',
      duration,
      errorMessage: `${browser} ${browserVersion} is below minimum required version ${minVersion}`,
      expectedValue: `>= ${minVersion}`,
      actualValue: majorVersion,
    };
  }

  return {
    testName: 'Basic Browser Support',
    status: 'pass',
    duration,
    expectedValue: `>= ${minVersion}`,
    actualValue: majorVersion,
  };
}

/**
 * Test API availability for AI system
 */
function testAPIAvailability(systemId: string, browser: string): TestResult {
  const startTime = Date.now();
  
  // API requirements by system
  const apiRequirements: Record<string, string[]> = {
    'face-detection': ['MediaDevices', 'getUserMedia'],
    'gaze-tracking': ['MediaDevices', 'getUserMedia'],
    'head-pose': ['MediaDevices', 'getUserMedia'],
    'blink-analysis': ['MediaDevices', 'getUserMedia'],
    'hand-tracking': ['MediaDevices', 'getUserMedia'],
    'object-detection': ['MediaDevices', 'getUserMedia'],
    'face-proximity': ['MediaDevices', 'getUserMedia'],
    'liveness-detection': ['MediaDevices', 'getUserMedia'],
    'micro-gaze': ['MediaDevices', 'getUserMedia'],
    'lip-movement': ['MediaDevices', 'getUserMedia'],
    'biometric-recognition': ['MediaDevices', 'getUserMedia'],
    'voice-activity': ['SpeechRecognition', 'webkitSpeechRecognition'],
    'ambient-noise': ['AudioContext', 'webkitAudioContext'],
    'audio-spoofing': ['AudioContext', 'webkitAudioContext'],
    'lip-sync': ['AudioContext', 'webkitAudioContext', 'MediaDevices'],
    'keystroke-dynamics': ['KeyboardEvent'],
    'mouse-behavior': ['MouseEvent'],
    'response-time': ['Performance'],
    'typing-pattern': ['KeyboardEvent'],
    'virtual-camera': ['MediaDevices'],
    'virtual-device': ['Navigator'],
    'browser-fingerprint': ['Navigator'],
    'extension-detection': ['Navigator'],
    'devtools-detection': ['Console'],
    'screen-recording': ['Screen'],
    'multi-tab': ['Document'],
    'network-anomaly': ['Navigator'],
    'sandbox-vm': ['Navigator'],
    'hardware-spoofing': ['Navigator'],
  };

  const requiredAPIs = apiRequirements[systemId] || [];
  const duration = Date.now() - startTime;

  // Browser-specific API availability
  const apiAvailability: Record<string, Record<string, boolean>> = {
    chrome: {
      'MediaDevices': true,
      'getUserMedia': true,
      'SpeechRecognition': true,
      'webkitSpeechRecognition': true,
      'AudioContext': true,
      'webkitAudioContext': true,
      'KeyboardEvent': true,
      'MouseEvent': true,
      'Performance': true,
      'Navigator': true,
      'Console': true,
      'Screen': true,
      'Document': true,
    },
    edge: {
      'MediaDevices': true,
      'getUserMedia': true,
      'SpeechRecognition': true,
      'webkitSpeechRecognition': true,
      'AudioContext': true,
      'webkitAudioContext': true,
      'KeyboardEvent': true,
      'MouseEvent': true,
      'Performance': true,
      'Navigator': true,
      'Console': true,
      'Screen': true,
      'Document': true,
    },
    firefox: {
      'MediaDevices': true,
      'getUserMedia': true,
      'SpeechRecognition': false, // Firefox doesn't support Web Speech API
      'webkitSpeechRecognition': false,
      'AudioContext': true,
      'webkitAudioContext': false,
      'KeyboardEvent': true,
      'MouseEvent': true,
      'Performance': true,
      'Navigator': true,
      'Console': true,
      'Screen': true,
      'Document': true,
    },
    safari: {
      'MediaDevices': true,
      'getUserMedia': true,
      'SpeechRecognition': false, // Safari doesn't support Web Speech API
      'webkitSpeechRecognition': false,
      'AudioContext': true,
      'webkitAudioContext': true,
      'KeyboardEvent': true,
      'MouseEvent': true,
      'Performance': true,
      'Navigator': true,
      'Console': true,
      'Screen': false, // Safari has limited screen API support
      'Document': true,
    },
  };

  const browserAPIs = apiAvailability[browser] || {};
  const unavailableAPIs = requiredAPIs.filter(api => !browserAPIs[api]);
  
  if (unavailableAPIs.length === requiredAPIs.length) {
    return {
      testName: 'API Availability',
      status: 'fail',
      duration,
      errorMessage: `Required APIs not available: ${unavailableAPIs.join(', ')}`,
      expectedValue: requiredAPIs,
      actualValue: requiredAPIs.filter(api => browserAPIs[api]),
    };
  }

  if (unavailableAPIs.length > 0) {
    return {
      testName: 'API Availability',
      status: 'warning',
      duration,
      errorMessage: `Some APIs not available: ${unavailableAPIs.join(', ')}`,
      expectedValue: requiredAPIs,
      actualValue: requiredAPIs.filter(api => browserAPIs[api]),
    };
  }

  return {
    testName: 'API Availability',
    status: 'pass',
    duration,
    expectedValue: requiredAPIs,
    actualValue: requiredAPIs,
  };
}

/**
 * Test performance expectations for AI system
 */
function testPerformanceExpectations(systemId: string, browser: string): TestResult {
  const startTime = Date.now();
  
  // Performance expectations by system and browser
  const performanceRules: Record<string, Record<string, string[]>> = {
    'face-detection': {
      chrome: [],
      edge: [],
      firefox: ['Reduced frame rate expected'],
      safari: ['Reduced frame rate expected'],
    },
    'hand-tracking': {
      chrome: [],
      edge: [],
      firefox: ['Reduced frame rate expected'],
      safari: ['Reduced frame rate expected', 'Limited gesture recognition'],
    },
    'object-detection': {
      chrome: [],
      edge: [],
      firefox: ['Slower inference expected'],
      safari: ['Slower inference expected'],
    },
    'voice-activity': {
      chrome: [],
      edge: [],
      firefox: ['Feature not available'],
      safari: ['Feature not available'],
    },
  };

  const systemRules = performanceRules[systemId] || {};
  const browserRules = systemRules[browser] || [];
  const duration = Date.now() - startTime;

  if (browserRules.length > 0) {
    return {
      testName: 'Performance Expectations',
      status: 'warning',
      duration,
      errorMessage: browserRules.join(', '),
      expectedValue: 'Optimal performance',
      actualValue: 'Limited performance',
    };
  }

  return {
    testName: 'Performance Expectations',
    status: 'pass',
    duration,
    expectedValue: 'Optimal performance',
    actualValue: 'Optimal performance',
  };
}

/**
 * Get browser compatibility rules
 */
function getBrowserCompatibilityRules(): Record<string, { limitations?: string[], partialSupport?: boolean, unsupported?: boolean }> {
  return {
    'voice-activity': {
      limitations: ['Not supported in Firefox and Safari'],
      partialSupport: false,
      unsupported: false,
    },
    'audio-spoofing': {
      limitations: ['Limited detection in Safari'],
      partialSupport: true,
      unsupported: false,
    },
    'screen-recording': {
      limitations: ['Limited detection in Safari'],
      partialSupport: true,
      unsupported: false,
    },
  };
}
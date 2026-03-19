import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiUtils";
import { BrowserCompatibility, RecommendedConfig, HardwareRequirements, CompatibilityData, PartialSupport, SystemCompatibility } from "@/lib/audit/types";
import { getLatestCompatibilityMatrix } from "@/lib/audit/db-operations";
import { AI_SYSTEMS } from "@/lib/audit/constants";

interface CompatibilityResponse {
  compatibilityMatrix: CompatibilityData;
  lastUpdated: Date;
  totalSystems: number;
  testedBrowsers: number;
  recommendations?: string[];
}

interface CompatibilityTestRecord {
  browser: string;
  browserVersion: string;
  systemCompatibility: SystemCompatibility[];
  overallCompatibility: number;
  timestamp: string | Date;
}

// GET /api/audit/compatibility/matrix — Return complete compatibility matrix for all browsers
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeRecommendations = searchParams.get('includeRecommendations') !== 'false';

    // Get latest compatibility test results from database
    const latestTests = await getLatestCompatibilityMatrix();
    
    // Generate comprehensive compatibility matrix
    const browsers = await generateBrowserCompatibilityMatrix(latestTests);
    
    // Generate recommended configuration
    const recommendedConfiguration = generateRecommendedConfiguration();

    const compatibilityData: CompatibilityData = {
      browsers,
      recommendedConfiguration,
    };

    const response: CompatibilityResponse = {
      compatibilityMatrix: compatibilityData,
      lastUpdated: getLastUpdatedTimestamp(latestTests),
      totalSystems: AI_SYSTEMS.length,
      testedBrowsers: browsers.length,
    };

    if (includeRecommendations) {
      response.recommendations = generateCompatibilityRecommendations(browsers);
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error('Error generating compatibility matrix:', error);
    return handleApiError(error);
  }
}

/**
 * Generate browser compatibility matrix from test results
 */
async function generateBrowserCompatibilityMatrix(latestTests: CompatibilityTestRecord[]): Promise<BrowserCompatibility[]> {
  const browsers: BrowserCompatibility[] = [];
  
  // Define all browsers we want to include in the matrix
  const allBrowsers = [
    { name: 'chrome', displayName: 'Chrome', defaultVersion: '120.0' },
    { name: 'edge', displayName: 'Edge', defaultVersion: '120.0' },
    { name: 'firefox', displayName: 'Firefox', defaultVersion: '121.0' },
    { name: 'safari', displayName: 'Safari', defaultVersion: '17.0' },
  ];

  const allSystemIds = AI_SYSTEMS.map(s => s.id);

  for (const browserInfo of allBrowsers) {
    // Find latest test result for this browser
    const testResult = latestTests.find(test => 
      test.browser.toLowerCase() === browserInfo.name.toLowerCase()
    );

    let browserCompatibility: BrowserCompatibility;

    if (testResult) {
      // Use actual test results
      const supportedSystems = testResult.systemCompatibility
        .filter((s) => s.supported)
        .map((s) => s.systemId);
      
      const unsupportedSystems = testResult.systemCompatibility
        .filter((s) => !s.supported && !s.partialSupport)
        .map((s) => s.systemId);
      
      const partialSystems: PartialSupport[] = testResult.systemCompatibility
        .filter((s) => s.partialSupport && !s.supported)
        .map((s) => ({
          systemId: s.systemId,
          limitation: s.limitations?.join(', ') || 'Limited support',
          workaround: generateWorkaround(s.systemId, browserInfo.name),
        }));

      browserCompatibility = {
        browserName: browserInfo.displayName,
        version: testResult.browserVersion as string,
        supportedSystems,
        unsupportedSystems,
        partialSystems,
        overallCompatibility: testResult.overallCompatibility as number,
      };
    } else {
      // Generate theoretical compatibility based on known browser capabilities
      const theoreticalCompatibility = generateTheoreticalCompatibility(
        browserInfo.name,
        browserInfo.defaultVersion,
        allSystemIds
      );
      
      browserCompatibility = {
        browserName: browserInfo.displayName,
        version: browserInfo.defaultVersion,
        supportedSystems: theoreticalCompatibility.supported,
        unsupportedSystems: theoreticalCompatibility.unsupported,
        partialSystems: theoreticalCompatibility.partial as PartialSupport[],
        overallCompatibility: theoreticalCompatibility.overallScore,
      };
    }

    browsers.push(browserCompatibility);
  }

  return browsers;
}

/**
 * Generate theoretical compatibility for browsers without test data
 */
function generateTheoreticalCompatibility(
  browser: string,
  version: string,
  systemIds: string[]
): {
  supported: string[];
  unsupported: string[];
  partial: PartialSupport[];
  overallScore: number;
} {
  const supported: string[] = [];
  const unsupported: string[] = [];
  const partial: PartialSupport[] = [];

  // Browser capability rules
  const browserCapabilities: Record<string, {
    webSpeech: boolean;
    webAudio: boolean;
    mediaDevices: boolean;
    screenCapture: boolean;
    performance: 'high' | 'medium' | 'low';
  }> = {
    chrome: {
      webSpeech: true,
      webAudio: true,
      mediaDevices: true,
      screenCapture: true,
      performance: 'high',
    },
    edge: {
      webSpeech: true,
      webAudio: true,
      mediaDevices: true,
      screenCapture: true,
      performance: 'high',
    },
    firefox: {
      webSpeech: false,
      webAudio: true,
      mediaDevices: true,
      screenCapture: true,
      performance: 'medium',
    },
    safari: {
      webSpeech: false,
      webAudio: true,
      mediaDevices: true,
      screenCapture: false,
      performance: 'medium',
    },
  };

  const capabilities = browserCapabilities[browser] || browserCapabilities.chrome;

  for (const systemId of systemIds) {
    const system = AI_SYSTEMS.find(s => s.id === systemId);
    if (!system) continue;

    // Categorize based on system requirements
    if (systemId.includes('voice') || systemId.includes('speech')) {
      if (capabilities.webSpeech) {
        supported.push(systemId);
      } else {
        unsupported.push(systemId);
      }
    } else if (systemId.includes('audio')) {
      if (capabilities.webAudio) {
        supported.push(systemId);
      } else {
        partial.push({
          systemId,
          limitation: 'Limited audio processing capabilities',
          workaround: generateWorkaround(systemId, browser),
        });
      }
    } else if (systemId.includes('screen') || systemId.includes('recording')) {
      if (capabilities.screenCapture) {
        supported.push(systemId);
      } else {
        partial.push({
          systemId,
          limitation: 'Limited screen capture detection',
          workaround: generateWorkaround(systemId, browser),
        });
      }
    } else if (system.category === 'vision') {
      if (capabilities.mediaDevices) {
        if (capabilities.performance === 'high') {
          supported.push(systemId);
        } else {
          partial.push({
            systemId,
            limitation: 'Reduced frame rate expected',
            workaround: generateWorkaround(systemId, browser),
          });
        }
      } else {
        unsupported.push(systemId);
      }
    } else {
      // Behavioral and basic system detection should work everywhere
      supported.push(systemId);
    }
  }

  const overallScore = Math.round(
    ((supported.length + (partial.length * 0.5)) / systemIds.length) * 100
  );

  return { supported, unsupported, partial, overallScore };
}

/**
 * Generate workaround suggestions for partially supported systems
 */
function generateWorkaround(systemId: string, browser: string): string | undefined {
  const workarounds: Record<string, Record<string, string>> = {
    'voice-activity': {
      firefox: 'Use alternative audio analysis methods',
      safari: 'Use alternative audio analysis methods',
    },
    'audio-spoofing': {
      safari: 'Implement additional audio fingerprinting',
    },
    'screen-recording': {
      safari: 'Use alternative detection methods',
    },
    'face-detection': {
      firefox: 'Consider reducing frame rate targets',
      safari: 'Consider reducing frame rate targets',
    },
    'hand-tracking': {
      firefox: 'Consider reducing frame rate targets',
      safari: 'Consider reducing frame rate targets',
    },
  };

  return workarounds[systemId]?.[browser];
}

/**
 * Generate recommended configuration
 */
function generateRecommendedConfiguration(): RecommendedConfig {
  const hardwareRequirements: HardwareRequirements = {
    minRAM: '4GB',
    recommendedRAM: '8GB',
    minCPU: 'Intel i5 / AMD Ryzen 5 or equivalent',
    gpu: 'Integrated graphics sufficient, dedicated GPU recommended for optimal performance',
    camera: 'HD webcam (720p minimum, 1080p recommended)',
    microphone: 'Built-in or external microphone with noise cancellation',
  };

  return {
    browser: 'Chrome',
    minVersion: '88.0',
    requiredPermissions: [
      'Camera access',
      'Microphone access',
      'Screen sharing (for some features)',
      'Notifications',
    ],
    hardwareRequirements,
  };
}

/**
 * Generate compatibility recommendations
 */
function generateCompatibilityRecommendations(browsers: BrowserCompatibility[]): string[] {
  const recommendations: string[] = [];

  // Find best browser
  const bestBrowser = browsers.reduce((best, current) => 
    current.overallCompatibility > best.overallCompatibility ? current : best
  );

  recommendations.push(
    `Use ${bestBrowser.browserName} ${bestBrowser.version} for optimal compatibility (${bestBrowser.overallCompatibility}% system support)`
  );

  // Find browsers with significant limitations
  const limitedBrowsers = browsers.filter(b => b.overallCompatibility < 80);
  if (limitedBrowsers.length > 0) {
    recommendations.push(
      `Browsers with limitations: ${limitedBrowsers.map(b => `${b.browserName} (${b.overallCompatibility}%)`).join(', ')}`
    );
  }

  // Check for commonly unsupported features
  const allUnsupported = browsers.flatMap(b => b.unsupportedSystems);
  const commonlyUnsupported = findCommonElements(allUnsupported);
  
  if (commonlyUnsupported.length > 0) {
    recommendations.push(
      `Features with broad compatibility issues: ${commonlyUnsupported.join(', ')}`
    );
  }

  // Performance recommendations
  const lowPerformanceBrowsers = browsers.filter(b => 
    b.partialSystems.some(p => p.limitation.includes('frame rate'))
  );
  
  if (lowPerformanceBrowsers.length > 0) {
    recommendations.push(
      `Consider performance optimizations for: ${lowPerformanceBrowsers.map(b => b.browserName).join(', ')}`
    );
  }

  // Hardware recommendations
  recommendations.push(
    'Ensure adequate hardware: 8GB RAM, modern CPU, HD webcam, and stable internet connection'
  );

  return recommendations;
}

/**
 * Find elements that appear in multiple arrays
 */
function findCommonElements(arrays: string[]): string[] {
  const elementCounts = new Map<string, number>();
  
  for (const element of arrays) {
    elementCounts.set(element, (elementCounts.get(element) || 0) + 1);
  }

  return Array.from(elementCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([element]) => element);
}

/**
 * Get the most recent timestamp from test results
 */
function getLastUpdatedTimestamp(latestTests: CompatibilityTestRecord[]): Date {
  if (latestTests.length === 0) {
    return new Date(); // Current time if no tests available
  }

  const timestamps = latestTests.map(test => new Date(test.timestamp as string | number));
  return new Date(Math.max(...timestamps.map(d => d.getTime())));
}
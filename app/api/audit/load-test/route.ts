/**
 * Load Testing API Endpoint
 * 
 * Provides API endpoints for executing load tests and retrieving results.
 * Supports testing with 5, 10, and 20 concurrent sessions as specified
 * in Requirements 18.1-18.10.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LoadTester } from '../../../../lib/audit/load-tester';
import { LoadTestOptions } from '../../../../lib/audit/types';

const loadTester = new LoadTester();

/**
 * POST /api/audit/load-test
 * Execute a load test with specified options
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown = {};
    
    // Handle request body parsing more robustly
    try {
      const requestText = await request.text();
      if (requestText.trim()) {
        body = JSON.parse(requestText);
      }
    } catch (parseError) {
      // If JSON parsing fails, use empty object for defaults
      console.warn('Failed to parse request body, using defaults:', parseError);
      body = {};
    }
    
    // Validate request body
    const options: LoadTestOptions = {
      concurrentSessions: body.concurrentSessions || 5,
      testDuration: body.testDuration || 30,
      rampUpTime: body.rampUpTime,
      includePerformanceMetrics: body.includePerformanceMetrics ?? true,
      includeAPITesting: body.includeAPITesting ?? true,
      includeAISystemTesting: body.includeAISystemTesting ?? true
    };

    // Validate concurrent sessions
    if (![5, 10, 20].includes(options.concurrentSessions)) {
      return NextResponse.json(
        { 
          error: 'Invalid concurrent sessions count. Must be 5, 10, or 20.',
          validValues: [5, 10, 20]
        },
        { status: 400 }
      );
    }

    // Validate test duration
    if (options.testDuration < 5 || options.testDuration > 300) {
      return NextResponse.json(
        { 
          error: 'Test duration must be between 5 and 300 seconds.',
          provided: options.testDuration
        },
        { status: 400 }
      );
    }

    console.log(`Starting load test with ${options.concurrentSessions} concurrent sessions`);

    // Execute load test
    const result = await loadTester.executeLoadTest(options);

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: unknown) {
    console.error('Load test execution failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Load test execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/audit/load-test
 * Get information about load testing capabilities
 */
export async function GET() {
  try {
    const activeTests = loadTester.getActiveLoadTests();
    const activeTestsSize = activeTests ? activeTests.size : 0;
    
    return NextResponse.json({
      success: true,
      info: {
        supportedConcurrentSessions: [5, 10, 20],
        minTestDuration: 5,
        maxTestDuration: 300,
        features: [
          'Concurrent session simulation',
          'API response time measurement',
          'AI system frame rate monitoring',
          'Memory and CPU usage tracking',
          'Bottleneck identification',
          'Performance recommendations'
        ],
        activeTests: activeTestsSize,
        requirements: [
          '18.1: Test with 5 concurrent sessions',
          '18.2: Test with 10 concurrent sessions', 
          '18.3: Test with 20 concurrent sessions',
          '18.4: Measure API response times under load',
          '18.5: Measure AI system frame rates under load',
          '18.6: Measure memory and CPU usage under load',
          '18.7-18.8: Identify performance bottlenecks',
          '18.9-18.10: Generate load testing reports'
        ]
      }
    });

  } catch (error: unknown) {
    console.error('Failed to get load test info:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get load test information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
# PerformanceAnalyzer

## Overview

The `PerformanceAnalyzer` class provides comprehensive performance measurement and benchmarking capabilities for AI detection systems. It measures frame rates, latency with percentile calculations, memory usage, CPU usage, and compares results against target benchmarks.

## Purpose

This analyzer validates that all AI detection systems meet their performance targets as specified in Requirements 4.1-4.10:

- **Face Detection**: 30 FPS target
- **Hand Tracking**: 10 FPS target  
- **Object Detection**: 0.5 FPS target (every 2 seconds)
- **Audio Analysis**: 60 FPS target
- **Latency**: System-specific targets (33ms for vision, 100ms for system, etc.)
- **Memory**: System-specific thresholds
- **CPU**: System-specific thresholds

## Key Features

### 1. Frame Rate Measurement

Measures frames per second (FPS) for vision AI systems:

```typescript
const analyzer = new PerformanceAnalyzer();
const metrics = await analyzer.measureFrameRate('face-detection', 5); // 5 second measurement

console.log(metrics);
// {
//   average: 32.5,
//   min: 28.0,
//   max: 36.0,
//   target: 30,
//   meetsTarget: true
// }
```

### 2. Latency Measurement with Percentiles

Measures processing latency with p50, p95, and p99 percentiles:

```typescript
const metrics = await analyzer.measureLatency('face-detection', 100); // 100 iterations

console.log(metrics);
// {
//   average: 28.5,
//   p50: 27.0,
//   p95: 35.0,
//   p99: 42.0,
//   target: 33,
//   meetsTarget: true
// }
```

**Percentile Interpretation**:
- **p50 (median)**: 50% of requests complete faster than this
- **p95**: 95% of requests complete faster than this (important for user experience)
- **p99**: 99% of requests complete faster than this (catches outliers)

### 3. Memory Usage Tracking

Tracks memory usage over time with growth rate calculation:

```typescript
const metrics = await analyzer.measureMemoryUsage('face-detection', 10); // 10 second measurement

console.log(metrics);
// {
//   initial: 55.2,
//   peak: 78.5,
//   average: 65.3,
//   growth: 4.2, // MB per minute
//   threshold: 100,
//   exceedsThreshold: false
// }
```

**Memory Metrics**:
- **Initial**: Memory usage at start of measurement
- **Peak**: Maximum memory usage during measurement
- **Average**: Average memory usage across all samples
- **Growth**: Rate of memory increase (MB per minute)

### 4. CPU Usage Monitoring

Monitors CPU usage during AI processing:

```typescript
const metrics = await analyzer.measureCPUUsage('face-detection', 5); // 5 second measurement

console.log(metrics);
// {
//   average: 42.5,
//   peak: 58.0,
//   threshold: 50,
//   exceedsThreshold: false
// }
```

### 5. Benchmark Comparison

Compares measured metrics against target benchmarks and provides recommendations:

```typescript
const performanceMetrics = {
  frameRate: await analyzer.measureFrameRate('face-detection', 5),
  latency: await analyzer.measureLatency('face-detection', 100),
  memory: await analyzer.measureMemoryUsage('face-detection', 10),
  cpu: await analyzer.measureCPUUsage('face-detection', 5),
};

const comparison = analyzer.compareAgainstBenchmarks('face-detection', performanceMetrics);

console.log(comparison);
// {
//   systemId: 'face-detection',
//   overallStatus: 'excellent', // 'excellent' | 'good' | 'acceptable' | 'poor'
//   metricComparisons: [
//     {
//       metricName: 'Frame Rate',
//       actual: 32.5,
//       target: 30,
//       status: 'pass',
//       deviation: 8.33
//     },
//     // ... more comparisons
//   ],
//   recommendations: [
//     // Recommendations for failed metrics
//   ]
// }
```

## Performance Targets by System

### Vision AI Systems
- **Face Detection**: 30 FPS, 33ms latency, 100 MB memory
- **Gaze Tracking**: 30 FPS, 33ms latency
- **Head Pose**: 30 FPS, 33ms latency
- **Hand Tracking**: 10 FPS, 100ms latency, 80 MB memory
- **Object Detection**: 0.5 FPS, 2000ms latency, 150 MB memory

### Audio AI Systems
- **Voice Activity**: 60 FPS, 16ms latency
- **Ambient Noise**: 60 FPS, 16ms latency
- **TTS Detection**: 60 FPS, 16ms latency
- **Lip-Sync**: 30 FPS, 33ms latency

### Behavioral AI Systems
- **Keystroke Dynamics**: 10ms latency
- **Mouse Behavior**: 10ms latency
- **Response Time**: 50ms latency
- **Typing Pattern**: 10ms latency

### System AI Systems
- **Virtual Camera**: 100ms latency
- **DevTools Detection**: 50ms latency
- **Browser Fingerprint**: 200ms latency
- **Network Anomaly**: 100ms latency

## Overall Status Calculation

The `compareAgainstBenchmarks` method calculates an overall performance status:

- **Excellent**: All metrics pass
- **Good**: ≤25% of metrics fail
- **Acceptable**: ≤50% of metrics fail
- **Poor**: >50% of metrics fail

## Usage in Audit System

The PerformanceAnalyzer is used by the audit engine to validate performance requirements:

```typescript
import { PerformanceAnalyzer } from './lib/audit';

async function auditSystemPerformance(systemId: string) {
  const analyzer = new PerformanceAnalyzer();
  
  // Measure all metrics
  const frameRate = await analyzer.measureFrameRate(systemId, 5);
  const latency = await analyzer.measureLatency(systemId, 100);
  const memory = await analyzer.measureMemoryUsage(systemId, 10);
  const cpu = await analyzer.measureCPUUsage(systemId, 5);
  
  // Compare against benchmarks
  const comparison = analyzer.compareAgainstBenchmarks(systemId, {
    frameRate,
    latency,
    memory,
    cpu,
  });
  
  // Log results
  console.log(`Performance Status: ${comparison.overallStatus}`);
  
  if (comparison.recommendations.length > 0) {
    console.log('Recommendations:');
    comparison.recommendations.forEach(rec => console.log(`- ${rec}`));
  }
  
  return comparison;
}
```

## Implementation Notes

### Browser API Limitations

- **Memory Measurement**: Uses `performance.memory` API (Chrome only). Falls back to estimation in other browsers.
- **CPU Measurement**: Browsers don't provide direct CPU usage APIs. The implementation uses performance timing to estimate CPU usage.

### Measurement Duration Guidelines

- **Frame Rate**: 5-10 seconds for stable measurements
- **Latency**: 50-100 iterations for accurate percentiles
- **Memory**: 10-30 seconds to capture growth patterns
- **CPU**: 5-10 seconds for average usage

### Performance Overhead

The analyzer itself has minimal overhead:
- Frame rate measurement: ~1-2% CPU overhead
- Latency measurement: Negligible (measures existing operations)
- Memory measurement: ~0.1 MB overhead
- CPU measurement: ~5-10% overhead during measurement

## Testing

Comprehensive unit tests cover:
- All measurement methods
- Percentile calculations
- Benchmark comparisons
- Edge cases (unknown systems, short durations, empty metrics)
- Recommendation generation

Run tests:
```bash
npm test -- tests/audit/performance-analyzer.test.ts
```

## Related Components

- **VisionAuditor**: Uses PerformanceAnalyzer to validate vision AI performance
- **AudioAuditor**: Uses PerformanceAnalyzer to validate audio AI performance
- **SystemAuditor**: Uses PerformanceAnalyzer to validate system AI performance
- **AuditEngine**: Orchestrates performance analysis across all systems

## Requirements Validation

This component validates the following requirements:

- **4.1**: Measure face detection frame rate (30 FPS target)
- **4.2**: Measure hand tracking frame rate (10 FPS target)
- **4.3**: Measure object detection interval (0.5 FPS target)
- **4.4**: Measure audio analysis frame rate (60 FPS target)
- **4.5**: Measure violation logging latency (<100ms)
- **4.6**: Measure integrity score calculation time (<50ms)
- **4.7**: Measure memory usage for each AI system
- **4.8**: Measure CPU usage when all AI systems are active
- **4.9**: Generate performance report comparing actual vs target metrics
- **4.10**: Flag systems that fall below performance targets

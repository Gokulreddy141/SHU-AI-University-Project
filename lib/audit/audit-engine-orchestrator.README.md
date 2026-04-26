# Audit Engine Orchestrator

The Audit Engine Orchestrator is the central coordinator for all AI capabilities audit operations. It manages test execution, progress tracking, result aggregation, and provides a unified interface for running comprehensive audits.

## Features

- **Full Audit Execution**: Validates all 29+ AI detection systems across 4 categories
- **Category-Specific Audits**: Run audits for specific AI categories (Vision, Audio, Behavioral, System)
- **System-Specific Audits**: Test individual AI detection systems
- **Parallel Execution**: Efficient concurrent testing with configurable concurrency
- **Progress Tracking**: Real-time status updates and progress reporting
- **Timeout Mechanisms**: 30-second timeout per test suite to prevent hanging
- **Error Handling**: Graceful failure handling with detailed error reporting
- **Result Aggregation**: Comprehensive reporting with performance, accuracy, and enhancement analysis

## Usage

### Basic Full Audit

```typescript
import { AuditEngineOrchestrator } from './lib/audit/audit-engine-orchestrator';

const orchestrator = new AuditEngineOrchestrator();

// Execute full audit with default options
const report = await orchestrator.executeFullAudit();

console.log(`Audit Status: ${report.overallStatus}`);
console.log(`Systems Passed: ${report.summary.systemsPassed}/${report.summary.totalSystems}`);
console.log(`Pass Rate: ${report.summary.passRate}%`);
```

### Audit with Custom Options

```typescript
const report = await orchestrator.executeFullAudit({
  categories: ['vision', 'audio'], // Only audit Vision and Audio AI
  includePerformance: true,
  includeFalsePositiveAnalysis: true,
  includeEnhancementRecommendations: false,
  concurrency: 4,
});
```

### Category-Specific Audit

```typescript
// Audit only Vision AI systems
const visionResult = await orchestrator.executeCategoryAudit('vision');

console.log(`Vision AI Status: ${visionResult.status}`);
console.log(`Systems Passed: ${visionResult.systemsPassed}/${visionResult.totalSystems}`);
```

### System-Specific Audit

```typescript
// Audit only face detection system
const faceDetectionResult = await orchestrator.executeSystemAudit('face-detection');

console.log(`Face Detection Status: ${faceDetectionResult.status}`);
console.log(`Tests Passed: ${faceDetectionResult.validationResult.testsPassed}`);
console.log(`Tests Failed: ${faceDetectionResult.validationResult.testsFailed}`);
```

### Progress Tracking

```typescript
const orchestrator = new AuditEngineOrchestrator();

// Listen for status updates
orchestrator.on('status:update', (status) => {
  console.log(`Phase: ${status.currentPhase}`);
  console.log(`Progress: ${status.progress}%`);
});

// Listen for system completion
orchestrator.on('system:complete', (result) => {
  console.log(`Completed: ${result.systemName} - ${result.status}`);
});

// Listen for category completion
orchestrator.on('category:complete', (result) => {
  console.log(`Category ${result.category} completed: ${result.status}`);
});

// Listen for audit completion
orchestrator.on('audit:complete', (report) => {
  console.log('Audit completed!');
  console.log(`Overall Status: ${report.overallStatus}`);
});

// Listen for errors
orchestrator.on('audit:error', (error) => {
  console.error('Audit failed:', error);
});

// Start audit
const report = await orchestrator.executeFullAudit();
```

### Get Current Status

```typescript
const orchestrator = new AuditEngineOrchestrator();

// Start audit (non-blocking)
orchestrator.executeFullAudit().then(report => {
  console.log('Audit complete!');
});

// Check status periodically
const interval = setInterval(() => {
  const status = orchestrator.getAuditStatus();
  
  if (!status.isRunning) {
    clearInterval(interval);
    return;
  }
  
  console.log(`Phase: ${status.currentPhase}`);
  console.log(`Progress: ${status.progress}%`);
  console.log(`Estimated Completion: ${status.estimatedCompletion}`);
}, 1000);
```

## Audit Options

### AuditOptions Interface

```typescript
interface AuditOptions {
  // Categories to audit (default: all)
  categories?: AICategory[];
  
  // Include performance benchmarking (default: true)
  includePerformance?: boolean;
  
  // Include false positive/negative analysis (default: true)
  includeFalsePositiveAnalysis?: boolean;
  
  // Include enhancement recommendations (default: true)
  includeEnhancementRecommendations?: boolean;
  
  // Concurrency level for parallel execution (default: 4)
  concurrency?: number;
}
```

### AI Categories

- `'vision'` - Vision AI systems (11 systems)
- `'audio'` - Audio AI systems (4 systems)
- `'behavioral'` - Behavioral AI systems (4 systems)
- `'system'` - System-level detection (10 systems)

## Audit Report Structure

### AuditReport

```typescript
interface AuditReport {
  executionId: string;              // Unique execution identifier
  timestamp: Date;                  // Audit start time
  duration: number;                 // Duration in seconds
  overallStatus: 'pass' | 'fail' | 'warning';
  categoryResults: CategoryAuditResult[];
  performanceAnalysis?: PerformanceAnalysis;
  accuracyAnalysis?: AccuracyAnalysis;
  enhancementRecommendations?: Enhancement[];
  summary: AuditSummary;
}
```

### CategoryAuditResult

```typescript
interface CategoryAuditResult {
  category: AICategory;
  status: 'pass' | 'fail' | 'warning';
  systemResults: SystemAuditResult[];
  totalSystems: number;
  systemsPassed: number;
  systemsFailed: number;
  systemsWarning: number;
}
```

### SystemAuditResult

```typescript
interface SystemAuditResult {
  systemId: string;
  systemName: string;
  status: 'pass' | 'fail' | 'warning';
  validationResult: ValidationResult;
  performanceMetrics?: PerformanceMetrics;
  accuracyMetrics?: AccuracyMetrics;
}
```

### AuditSummary

```typescript
interface AuditSummary {
  totalSystems: number;
  systemsPassed: number;
  systemsFailed: number;
  systemsWarning: number;
  passRate: number;                 // Percentage
  criticalIssues: string[];
  recommendations: string[];
}
```

## Events

The orchestrator extends EventEmitter and emits the following events:

### Status Events

- `'status:update'` - Emitted when audit status changes
  - Payload: `AuditStatus`

### Completion Events

- `'system:complete'` - Emitted when a system audit completes
  - Payload: `SystemAuditResult`
  
- `'category:complete'` - Emitted when a category audit completes
  - Payload: `CategoryAuditResult`
  
- `'audit:complete'` - Emitted when full audit completes
  - Payload: `AuditReport`

### Error Events

- `'system:error'` - Emitted when a system audit fails
  - Payload: `{ systemId: string, error: any }`
  
- `'category:error'` - Emitted when a category audit fails
  - Payload: `{ category: AICategory, error: any }`
  
- `'audit:error'` - Emitted when full audit fails
  - Payload: `Error`
  
- `'performance:error'` - Emitted when performance analysis fails
  - Payload: `{ systemId: string, error: any }`
  
- `'accuracy:error'` - Emitted when accuracy analysis fails
  - Payload: `{ systemId: string, error: any }`
  
- `'enhancement:error'` - Emitted when enhancement analysis fails
  - Payload: `Error`

## Timeout Mechanism

Each test suite has a 30-second timeout to prevent hanging:

- If a system validation exceeds 30 seconds, it will be marked as failed
- The audit will continue with remaining systems
- Timeout errors are captured in the validation result

## Error Handling

The orchestrator implements graceful error handling:

1. **System-Level Failures**: If a single system fails, the audit continues with remaining systems
2. **Category-Level Failures**: If a category fails, the audit continues with remaining categories
3. **Analysis Failures**: If performance/accuracy/enhancement analysis fails, the audit continues without that analysis
4. **Timeout Handling**: Systems that timeout are marked as failed with detailed error messages

## Performance Considerations

- **Concurrency**: Adjust the `concurrency` option based on system resources
- **Selective Audits**: Use category or system-specific audits for faster execution
- **Optional Analyses**: Disable performance/accuracy/enhancement analyses if not needed
- **Progress Tracking**: Use event listeners instead of polling for better performance

## Integration with Database

The orchestrator can be integrated with database operations:

```typescript
import { AuditEngineOrchestrator } from './lib/audit/audit-engine-orchestrator';
import { saveAuditExecution, saveSystemValidation } from './lib/audit/db-operations';

const orchestrator = new AuditEngineOrchestrator();

// Save system results as they complete
orchestrator.on('system:complete', async (result) => {
  await saveSystemValidation({
    executionId: 'current-execution-id',
    systemId: result.systemId,
    systemName: result.systemName,
    category: 'vision', // Determine from system
    timestamp: new Date(),
    status: result.status,
    testResults: [], // Extract from validationResult
  });
});

// Save full audit report
const report = await orchestrator.executeFullAudit();
await saveAuditExecution({
  executionId: report.executionId,
  startTime: report.timestamp,
  endTime: new Date(),
  status: 'completed',
  auditOptions: {},
  results: report,
  triggeredBy: 'user-id',
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    dependencies: {},
  },
});
```

## Requirements Validation

This orchestrator validates the following requirements:

- **Requirement 1.5**: Validates all AI detection systems with pass/fail status and timestamps
- **Requirement 1.6**: Logs specific failure details and error messages for failed systems
- **Requirement 1.7**: Generates comprehensive validation report showing status of all systems
- **Requirement 2.6**: Completes all tests within 30 seconds per test suite
- **Requirement 2.7**: Provides clear pass/fail indicators with detailed error messages

## Example: Complete Audit Workflow

```typescript
import { AuditEngineOrchestrator } from './lib/audit/audit-engine-orchestrator';

async function runCompleteAudit() {
  const orchestrator = new AuditEngineOrchestrator();
  
  // Set up event listeners
  orchestrator.on('status:update', (status) => {
    console.log(`[${status.currentPhase}] ${status.progress}%`);
  });
  
  orchestrator.on('system:complete', (result) => {
    const icon = result.status === 'pass' ? '✓' : '✗';
    console.log(`${icon} ${result.systemName}: ${result.status}`);
  });
  
  orchestrator.on('audit:error', (error) => {
    console.error('Audit failed:', error);
  });
  
  try {
    // Execute full audit
    console.log('Starting comprehensive AI audit...\n');
    
    const report = await orchestrator.executeFullAudit({
      categories: ['vision', 'audio', 'behavioral', 'system'],
      includePerformance: true,
      includeFalsePositiveAnalysis: true,
      includeEnhancementRecommendations: true,
      concurrency: 4,
    });
    
    // Display results
    console.log('\n=== Audit Complete ===');
    console.log(`Overall Status: ${report.overallStatus.toUpperCase()}`);
    console.log(`Duration: ${report.duration.toFixed(2)}s`);
    console.log(`\nSummary:`);
    console.log(`  Total Systems: ${report.summary.totalSystems}`);
    console.log(`  Passed: ${report.summary.systemsPassed}`);
    console.log(`  Failed: ${report.summary.systemsFailed}`);
    console.log(`  Warnings: ${report.summary.systemsWarning}`);
    console.log(`  Pass Rate: ${report.summary.passRate}%`);
    
    if (report.summary.criticalIssues.length > 0) {
      console.log(`\nCritical Issues:`);
      report.summary.criticalIssues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
    
    if (report.performanceAnalysis) {
      console.log(`\nPerformance Score: ${report.performanceAnalysis.performanceData.overallPerformanceScore}/100`);
    }
    
    if (report.enhancementRecommendations && report.enhancementRecommendations.length > 0) {
      console.log(`\nTop Enhancement Recommendations:`);
      report.enhancementRecommendations.slice(0, 3).forEach(enhancement => {
        console.log(`  - ${enhancement.name} (Priority: ${enhancement.priority})`);
      });
    }
    
    return report;
    
  } catch (error) {
    console.error('Audit execution failed:', error);
    throw error;
  }
}

// Run the audit
runCompleteAudit();
```

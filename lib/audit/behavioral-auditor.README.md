# Behavioral AI Auditor

## Overview

The `BehavioralAIAuditor` class validates all 4 behavioral AI detection systems that monitor candidate interaction patterns during examinations. These systems analyze typing behavior, mouse activity, response timing, and clipboard usage to detect anomalies that may indicate malpractice.

## Validated Systems

### 1. Keystroke Dynamics
- **System ID**: `keystroke-dynamics`
- **Technology**: JavaScript event listeners + performance.now()
- **Purpose**: Analyzes typing patterns and rhythm to detect pasted text, automation tools, or identity changes

**Validation Tests**:
- Keyboard event listener registration (keydown, keyup)
- Performance timing API availability
- Statistical analysis algorithms (hold duration variance, coefficient of variation)

### 2. Mouse Behavior Analysis
- **System ID**: `mouse-behavior`
- **Technology**: JavaScript event listeners + Date.now()
- **Purpose**: Detects prolonged inactivity that may indicate alt-tabbing or remote assistance

**Validation Tests**:
- Mouse event listener registration (mousemove, click, scroll)
- Timestamp API availability
- Inactivity detection logic (60-second threshold)

### 3. Response Time Profiling
- **System ID**: `response-time`
- **Technology**: performance.now() timing
- **Purpose**: Tracks time-per-question to detect instant answers (pre-looked-up) or abnormally slow answers (external help)

**Validation Tests**:
- Performance timing API availability
- Anomaly detection logic (instant < 5s, slow > 3min)
- Average response time calculation

### 4. Typing Pattern Analysis
- **System ID**: `typing-pattern`
- **Technology**: JavaScript event listeners (clipboard + keyboard)
- **Purpose**: Detects copy-paste behavior and unusual typing patterns

**Validation Tests**:
- Clipboard event listener registration (paste, copy)
- Keyboard event listener registration
- Burst detection logic (rapid-fire typing < 15ms intervals)

## Usage

```typescript
import { BehavioralAIAuditor } from '@/lib/audit/behavioral-auditor';

const auditor = new BehavioralAIAuditor();

// Validate individual systems
const keystrokeResult = await auditor.validateKeystrokeDynamics();
const mouseResult = await auditor.validateMouseBehavior();
const responseTimeResult = await auditor.validateResponseTime();
const typingPatternResult = await auditor.validateTypingPattern();

// Check results
console.log('Keystroke Dynamics:', keystrokeResult.status); // 'pass' | 'fail' | 'warning'
console.log('Tests Passed:', keystrokeResult.testsPassed);
console.log('Tests Failed:', keystrokeResult.testsFailed);

if (keystrokeResult.errors.length > 0) {
  keystrokeResult.errors.forEach(error => {
    console.error(`${error.testName}: ${error.errorMessage}`);
  });
}
```

## Validation Results

Each validation method returns a `ValidationResult` object:

```typescript
interface ValidationResult {
  systemId: string;           // e.g., 'keystroke-dynamics'
  systemName: string;         // e.g., 'Keystroke Dynamics'
  status: 'pass' | 'fail' | 'warning';
  timestamp: Date;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performanceMetrics?: PerformanceMetrics;
}
```

## Error Handling

All validation methods use try-catch blocks to handle errors gracefully:

- **Test-level errors**: Caught and logged as `ValidationError` objects
- **System-level errors**: Caught and logged with full context
- **No exceptions thrown**: All errors are captured in the result object

## Integration with Audit Engine

The `BehavioralAIAuditor` is used by the `AuditEngineOrchestrator` as part of the comprehensive audit:

```typescript
import { BehavioralAIAuditor } from '@/lib/audit/behavioral-auditor';

const behavioralAuditor = new BehavioralAIAuditor();

// Validate all behavioral systems
const results = await Promise.all([
  behavioralAuditor.validateKeystrokeDynamics(),
  behavioralAuditor.validateMouseBehavior(),
  behavioralAuditor.validateResponseTime(),
  behavioralAuditor.validateTypingPattern(),
]);

// Aggregate results
const categoryResult: CategoryAuditResult = {
  category: 'behavioral',
  status: results.every(r => r.status === 'pass') ? 'pass' : 'fail',
  systemResults: results.map(r => ({
    systemId: r.systemId,
    systemName: r.systemName,
    status: r.status,
    validationResult: r,
  })),
  totalSystems: 4,
  systemsPassed: results.filter(r => r.status === 'pass').length,
  systemsFailed: results.filter(r => r.status === 'fail').length,
  systemsWarning: results.filter(r => r.status === 'warning').length,
};
```

## Testing

Unit tests for the behavioral auditor are located in `tests/audit/behavioral-auditor.test.ts`:

```typescript
describe('BehavioralAIAuditor', () => {
  let auditor: BehavioralAIAuditor;

  beforeEach(() => {
    auditor = new BehavioralAIAuditor();
  });

  test('validateKeystrokeDynamics should pass when event listeners work', async () => {
    const result = await auditor.validateKeystrokeDynamics();
    expect(result.status).toBe('pass');
    expect(result.testsPassed).toBeGreaterThan(0);
  });

  test('validateMouseBehavior should pass when event listeners work', async () => {
    const result = await auditor.validateMouseBehavior();
    expect(result.status).toBe('pass');
    expect(result.testsPassed).toBeGreaterThan(0);
  });

  test('validateResponseTime should pass when timing APIs work', async () => {
    const result = await auditor.validateResponseTime();
    expect(result.status).toBe('pass');
    expect(result.testsPassed).toBeGreaterThan(0);
  });

  test('validateTypingPattern should pass when clipboard listeners work', async () => {
    const result = await auditor.validateTypingPattern();
    expect(result.status).toBe('pass');
    expect(result.testsPassed).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

- **Lightweight validation**: Tests only check API availability and basic logic
- **No actual event simulation**: Tests don't simulate real user interactions
- **Fast execution**: All tests complete in < 100ms
- **No external dependencies**: Uses only browser APIs

## Browser Compatibility

All behavioral AI systems rely on standard browser APIs:

- **Keyboard events**: Supported in all modern browsers
- **Mouse events**: Supported in all modern browsers
- **Clipboard events**: Supported in all modern browsers
- **performance.now()**: Supported in all modern browsers
- **Date.now()**: Supported in all browsers

## Related Files

- `lib/audit/types.ts` - TypeScript interfaces
- `lib/audit/constants.ts` - System definitions and thresholds
- `hooks/useKeystrokeDynamics.ts` - Actual keystroke dynamics implementation
- `hooks/useMouseBehaviorAnalysis.ts` - Actual mouse behavior implementation
- `hooks/useResponseTimeProfiling.ts` - Actual response time implementation
- `tests/audit/behavioral-auditor.test.ts` - Unit tests

## Design Document Reference

This implementation validates **Requirement 1.3** from the design document:

> THE Audit_Engine SHALL validate all 4 Behavioral_AI detection systems (keystroke dynamics, mouse behavior, response time profiling, typing pattern analysis)

Each validation method corresponds to one of the 4 behavioral systems defined in `lib/audit/constants.ts`.

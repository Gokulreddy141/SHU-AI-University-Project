/**
 * Core TypeScript interfaces and types for AI Capabilities Audit System
 * 
 * This file defines all interfaces for the audit engine, category auditors,
 * analyzers, and report generators.
 */

// ============================================================================
// Core Types
// ============================================================================

export type AICategory = 'vision' | 'audio' | 'behavioral' | 'system';

export type ValidationStatus = 'pass' | 'fail' | 'warning';

export type ReportFormat = 'html' | 'pdf' | 'markdown' | 'json';

export type EnhancementEffort = 'low' | 'medium' | 'high';

export type EnhancementValue = 'low' | 'medium' | 'high';

export type EnhancementStatus = 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';

export type PerformanceStatus = 'excellent' | 'good' | 'acceptable' | 'poor';

export type BottleneckSeverity = 'low' | 'medium' | 'high';

// ============================================================================
// Audit Configuration
// ============================================================================

export interface AuditOptions {
  categories?: AICategory[];
  includePerformance?: boolean;
  includeFalsePositiveAnalysis?: boolean;
  includeEnhancementRecommendations?: boolean;
  concurrency?: number;
}

export interface AuditStatus {
  isRunning: boolean;
  currentPhase: string;
  progress: number; // 0-100
  startTime: Date;
  estimatedCompletion?: Date;
}

// ============================================================================
// Validation Results
// ============================================================================

export interface ValidationResult {
  systemId: string;
  systemName: string;
  status: ValidationStatus;
  timestamp: Date;
  testsPassed: number;
  testsFailed: number;
  testsSkipped: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  performanceMetrics?: PerformanceMetrics;
}

export interface ValidationError {
  testName: string;
  errorMessage: string;
  stackTrace?: string;
  expectedBehavior: string;
  actualBehavior: string;
}

export interface ValidationWarning {
  testName: string;
  warningMessage: string;
  recommendation: string;
}

export interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'skipped' | 'warning';
  duration: number;
  errorMessage?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
}

// ============================================================================
// Performance Metrics
// ============================================================================

export interface PerformanceMetrics {
  frameRate?: FrameRateMetrics;
  latency?: LatencyMetrics;
  memory?: MemoryMetrics;
  cpu?: CPUMetrics;
}

export interface FrameRateMetrics {
  average: number; // FPS
  min: number;
  max: number;
  target: number;
  meetsTarget: boolean;
}

export interface LatencyMetrics {
  average: number; // milliseconds
  p50: number;
  p95: number;
  p99: number;
  target: number;
  meetsTarget: boolean;
}

export interface MemoryMetrics {
  initial: number; // MB
  peak: number;
  average: number;
  growth: number; // MB per minute
  threshold: number;
  exceedsThreshold: boolean;
}

export interface CPUMetrics {
  average: number; // percentage
  peak: number;
  threshold: number;
  exceedsThreshold: boolean;
}

export interface BenchmarkComparison {
  systemId: string;
  overallStatus: PerformanceStatus;
  metricComparisons: MetricComparison[];
  recommendations: string[];
}

export interface MetricComparison {
  metricName: string;
  actual: number;
  target: number;
  status: 'pass' | 'fail';
  deviation: number; // percentage
}

export interface Bottleneck {
  systemId: string;
  metricName: string;
  severity: BottleneckSeverity;
  description: string;
  impact: string;
}

// ============================================================================
// Accuracy Analysis
// ============================================================================

export interface AccuracyMetrics {
  falsePositiveRate: number;
  falseNegativeRate: number;
  accuracy: number; // (1 - (FP + FN) / total) * 100
}

export interface FalsePositiveAnalysis {
  systemId: string;
  legitimateBehaviors: BehaviorTest[];
  falsePositives: BehaviorTest[];
  falsePositiveRate: number;
  totalTests: number;
}

export interface FalseNegativeAnalysis {
  systemId: string;
  malpracticeBehaviors: BehaviorTest[];
  falseNegatives: BehaviorTest[];
  falseNegativeRate: number;
  totalTests: number;
}

export interface BehaviorTest {
  behaviorName: string;
  description: string;
  expectedResult: 'violation' | 'no_violation';
  actualResult: 'violation' | 'no_violation';
  isCorrect: boolean;
  metadata?: Record<string, unknown>;
}

export interface AccuracyAnalysis {
  falsePositiveAnalysis: FalsePositiveAnalysis;
  falseNegativeAnalysis: FalseNegativeAnalysis;
}

export interface ThresholdRecommendation {
  systemId: string;
  parameterName: string;
  currentValue: number;
  recommendedValue: number;
  rationale: string;
  expectedImpact: string;
}

// ============================================================================
// Enhancement Recommendations
// ============================================================================

export interface Enhancement {
  id: string;
  name: string;
  category: AICategory;
  description: string;
  implementationEffort: EnhancementEffort;
  demonstrationValue: EnhancementValue;
  requiredLibraries: string[];
  estimatedHours: number;
  prerequisites: string[];
}

export interface PrioritizedEnhancement extends Enhancement {
  priority: number; // 1-10
  priorityRationale: string;
}

export interface ImplementationGuide {
  enhancementId: string;
  enhancementName: string;
  overview: string;
  technicalApproach: string;
  requiredDependencies: Dependency[];
  codeExamples: CodeExample[];
  integrationPoints: IntegrationPoint[];
  testingStrategy: string;
  estimatedTimeline: string;
}

export interface Dependency {
  name: string;
  version: string;
  purpose: string;
  installCommand: string;
}

export interface CodeExample {
  title: string;
  description: string;
  language: string;
  code: string;
}

export interface IntegrationPoint {
  component: string;
  modificationType: 'new_file' | 'modify_existing' | 'new_hook';
  description: string;
}

export interface GapAnalysis {
  currentCapabilities: string[];
  missingCapabilities: string[];
  competitorComparison: CompetitorFeature[];
  opportunityAreas: OpportunityArea[];
}

export interface CompetitorFeature {
  featureName: string;
  competitors: string[];
  implementationComplexity: EnhancementEffort;
  demonstrationValue: EnhancementValue;
}

export interface OpportunityArea {
  category: AICategory;
  description: string;
  potentialFeatures: string[];
  businessValue: string;
}

export interface EnhancementRoadmap {
  phases: RoadmapPhase[];
  totalEstimatedHours: number;
  recommendedSequence: string[];
}

export interface RoadmapPhase {
  phaseName: string;
  enhancements: PrioritizedEnhancement[];
  estimatedDuration: string;
  dependencies: string[];
}

// ============================================================================
// Audit Reports
// ============================================================================

export interface AuditReport {
  executionId: string;
  timestamp: Date;
  duration: number; // seconds
  overallStatus: ValidationStatus;
  categoryResults: CategoryAuditResult[];
  performanceAnalysis?: PerformanceAnalysis;
  accuracyAnalysis?: AccuracyAnalysis;
  enhancementRecommendations?: Enhancement[];
  summary: AuditSummary;
}

export interface CategoryAuditResult {
  category: AICategory;
  status: ValidationStatus;
  systemResults: SystemAuditResult[];
  totalSystems: number;
  systemsPassed: number;
  systemsFailed: number;
  systemsWarning: number;
}

export interface SystemAuditResult {
  systemId: string;
  systemName: string;
  status: ValidationStatus;
  validationResult: ValidationResult;
  performanceMetrics?: PerformanceMetrics;
  accuracyMetrics?: AccuracyMetrics;
}

export interface AuditSummary {
  totalSystems: number;
  systemsPassed: number;
  systemsFailed: number;
  systemsWarning: number;
  passRate: number; // percentage
  criticalIssues: string[];
  recommendations: string[];
}

export interface PerformanceData {
  systemMetrics: Map<string, PerformanceMetrics>;
  benchmarkComparisons: BenchmarkComparison[];
  overallPerformanceScore: number; // 0-100
}

export interface PerformanceAnalysis {
  performanceData: PerformanceData;
  bottlenecks: Bottleneck[];
  optimizationRecommendations: string[];
}

// ============================================================================
// Report Generation
// ============================================================================

export interface GeneratedReport {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  title: string;
  sections: ReportSection[];
  metadata: Record<string, unknown>;
}

export interface ReportSection {
  title: string;
  content: string; // Markdown or HTML
  visualizations?: Visualization[];
}

export interface Visualization {
  type: 'chart' | 'table' | 'matrix' | 'graph';
  title: string;
  data: unknown;
  config: unknown;
}

// ============================================================================
// Compatibility Testing
// ============================================================================

export interface CompatibilityData {
  browsers: BrowserCompatibility[];
  recommendedConfiguration: RecommendedConfig;
}

export interface BrowserCompatibility {
  browserName: string;
  version: string;
  supportedSystems: string[];
  unsupportedSystems: string[];
  partialSystems: PartialSupport[];
  overallCompatibility: number; // percentage
}

export interface PartialSupport {
  systemId: string;
  limitation: string;
  workaround?: string;
}

export interface RecommendedConfig {
  browser: string;
  minVersion: string;
  requiredPermissions: string[];
  hardwareRequirements: HardwareRequirements;
}

export interface HardwareRequirements {
  minRAM: string;
  recommendedRAM: string;
  minCPU: string;
  gpu: string;
  camera: string;
  microphone: string;
}

export interface SystemCompatibility {
  systemId: string;
  supported: boolean;
  partialSupport?: boolean;
  limitations?: string[];
  testResults: TestResult[];
}

// ============================================================================
// E2E Workflow Validation
// ============================================================================

export interface WorkflowValidationResult {
  workflowName: string;
  status: 'pass' | 'fail';
  steps: WorkflowStep[];
  duration: number; // milliseconds
  errors: WorkflowError[];
}

export interface WorkflowStep {
  stepName: string;
  status: 'pass' | 'fail' | 'skipped';
  duration: number;
  description: string;
  errorMessage?: string;
}

export interface WorkflowError {
  step: string;
  errorType: string;
  message: string;
  stackTrace?: string;
}

export interface E2EValidationResult {
  overallStatus: 'pass' | 'fail';
  workflowResults: WorkflowValidationResult[];
  totalDuration: number;
  criticalFailures: string[];
  recommendations: string[];
}

// ============================================================================
// Environment Information
// ============================================================================

export interface EnvironmentInfo {
  nodeVersion: string;
  platform: string;
  browser?: string;
  browserVersion?: string;
  dependencies: Record<string, string>;
}

// ============================================================================
// Database Record Types
// ============================================================================

export interface AuditExecutionRecordData {
  executionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  auditOptions: AuditOptions;
  results?: AuditReport;
  triggeredBy: string;
  environment: EnvironmentInfo;
}

export interface SystemValidationRecordData {
  executionId: string;
  systemId: string;
  systemName: string;
  category: AICategory;
  timestamp: Date;
  status: ValidationStatus;
  testResults: TestResult[];
  performanceMetrics?: PerformanceMetrics;
  accuracyMetrics?: AccuracyMetrics;
}

export interface PerformanceBenchmarkRecordData {
  executionId: string;
  systemId: string;
  timestamp: Date;
  metrics: PerformanceMetrics;
  benchmarkComparison: BenchmarkComparison;
  environment: EnvironmentInfo;
}

export interface EnhancementRecommendationRecordData {
  enhancementId: string;
  name: string;
  category: AICategory;
  description: string;
  priority: number;
  implementationEffort: EnhancementEffort;
  demonstrationValue: EnhancementValue;
  status: EnhancementStatus;
  createdAt: Date;
  updatedAt: Date;
  implementationGuide?: ImplementationGuide;
}

export interface CompatibilityTestRecordData {
  executionId: string;
  browser: string;
  browserVersion: string;
  platform: string;
  timestamp: Date;
  systemCompatibility: SystemCompatibility[];
  overallCompatibility: number;
}

// Load Testing Types
export interface LoadTestOptions {
  concurrentSessions: number;
  testDuration: number; // seconds
  rampUpTime?: number; // seconds
  includePerformanceMetrics?: boolean;
  includeAPITesting?: boolean;
  includeAISystemTesting?: boolean;
}

export interface LoadTestResult {
  testId: string;
  startTime: Date;
  endTime: Date;
  options: LoadTestOptions;
  sessionResults: SessionLoadResult[];
  apiResults: APILoadResult[];
  aiSystemResults: AISystemLoadResult[];
  overallMetrics: LoadTestMetrics;
  bottlenecks: LoadTestBottleneck[];
  recommendations: string[];
}

export interface SessionLoadResult {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  status: 'completed' | 'failed' | 'timeout';
  errors: string[];
  performanceMetrics: SessionPerformanceMetrics;
}

export interface SessionPerformanceMetrics {
  memoryUsage: MemoryUsageOverTime[];
  cpuUsage: CPUUsageOverTime[];
  networkLatency: number; // average ms
  frameRates: FrameRateOverTime[];
}

export interface MemoryUsageOverTime {
  timestamp: Date;
  usage: number; // MB
}

export interface CPUUsageOverTime {
  timestamp: Date;
  usage: number; // percentage
}

export interface FrameRateOverTime {
  timestamp: Date;
  systemId: string;
  frameRate: number; // FPS
}

export interface APILoadResult {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number; // ms
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  errorRate: number; // percentage
  errors: APILoadError[];
}

export interface APILoadError {
  timestamp: Date;
  statusCode: number;
  errorMessage: string;
  responseTime: number;
}

export interface AISystemLoadResult {
  systemId: string;
  systemName: string;
  averageFrameRate: number;
  minFrameRate: number;
  maxFrameRate: number;
  frameRateStability: number; // coefficient of variation
  averageLatency: number;
  maxLatency: number;
  memoryLeakDetected: boolean;
  performanceDegradation: number; // percentage
}

export interface LoadTestMetrics {
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  successRate: number; // percentage
  averageSessionDuration: number; // ms
  peakMemoryUsage: number; // MB
  peakCPUUsage: number; // percentage
  systemStability: 'excellent' | 'good' | 'acceptable' | 'poor';
  scalabilityScore: number; // 0-100
}

export interface LoadTestBottleneck {
  component: string;
  type: 'memory' | 'cpu' | 'network' | 'ai_system' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  recommendation: string;
  detectedAt: number; // concurrent sessions when detected
}

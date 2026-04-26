/**
 * Database operations for Audit System
 * 
 * Provides CRUD operations and queries for audit records, validation results,
 * performance metrics, and enhancement recommendations.
 */

import connectToDatabase from '../db';
import AuditExecutionRecord from '../../models/AuditExecutionRecord';
import SystemValidationRecord from '../../models/SystemValidationRecord';
import PerformanceBenchmarkRecord from '../../models/PerformanceBenchmarkRecord';
import EnhancementRecommendationRecord from '../../models/EnhancementRecommendationRecord';
import CompatibilityTestRecord from '../../models/CompatibilityTestRecord';
import {
  AuditExecutionRecordData,
  SystemValidationRecordData,
  PerformanceBenchmarkRecordData,
  EnhancementRecommendationRecordData,
  CompatibilityTestRecordData,
  AICategory,
  ValidationStatus,
  EnhancementStatus,
} from './types';

// ============================================================================
// Audit Execution Record Operations
// ============================================================================

export async function createAuditExecutionRecord(
  data: AuditExecutionRecordData
): Promise<Document> {
  await connectToDatabase();
  const record = new AuditExecutionRecord(data);
  return await record.save();
}

export async function updateAuditExecutionRecord(
  executionId: string,
  updates: Partial<AuditExecutionRecordData>
): Promise<Document | null> {
  await connectToDatabase();
  return await AuditExecutionRecord.findOneAndUpdate(
    { executionId },
    { $set: updates },
    { new: true }
  );
}

export async function getAuditExecutionRecord(executionId: string): Promise<Document | null> {
  await connectToDatabase();
  return await AuditExecutionRecord.findOne({ executionId });
}

/**
 * Get audit results for a specific execution
 */
export async function getAuditResults(executionId: string): Promise<unknown> {
  const record = await getAuditExecutionRecord(executionId);
  return (record as unknown as Record<string, unknown>)?.results || null;
}

export async function getAuditExecutionHistory(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    status?: 'running' | 'completed' | 'failed';
    triggeredBy?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ records: any[]; total: number; page: number; pageSize: number }> {
  await connectToDatabase();

  const query: any = {};
  if (filters?.status) query.status = filters.status;
  if (filters?.triggeredBy) query.triggeredBy = filters.triggeredBy;
  if (filters?.startDate || filters?.endDate) {
    query.startTime = {};
    if (filters.startDate) query.startTime.$gte = filters.startDate;
    if (filters.endDate) query.startTime.$lte = filters.endDate;
  }

  const total = await AuditExecutionRecord.countDocuments(query);
  const records = await AuditExecutionRecord.find(query)
    .sort({ startTime: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  return { records, total, page, pageSize };
}

// ============================================================================
// System Validation Record Operations
// ============================================================================

export async function createSystemValidationRecord(
  data: SystemValidationRecordData
): Promise<any> {
  await connectToDatabase();
  const record = new SystemValidationRecord(data);
  return await record.save();
}

export async function getSystemValidationRecords(
  executionId: string
): Promise<any[]> {
  await connectToDatabase();
  return await SystemValidationRecord.find({ executionId }).sort({ timestamp: 1 });
}

export async function getSystemValidationHistory(
  systemId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  await connectToDatabase();

  const query: any = { systemId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return await SystemValidationRecord.find(query).sort({ timestamp: -1 });
}

export async function getValidationRecordsByCategory(
  category: AICategory,
  status?: ValidationStatus
): Promise<any[]> {
  await connectToDatabase();

  const query: any = { category };
  if (status) query.status = status;

  return await SystemValidationRecord.find(query).sort({ timestamp: -1 });
}

// ============================================================================
// Performance Benchmark Record Operations
// ============================================================================

export async function createPerformanceBenchmarkRecord(
  data: PerformanceBenchmarkRecordData
): Promise<any> {
  await connectToDatabase();
  const record = new PerformanceBenchmarkRecord(data);
  return await record.save();
}

export async function getPerformanceBenchmarkHistory(
  systemId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  await connectToDatabase();

  const query: any = { systemId };
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return await PerformanceBenchmarkRecord.find(query).sort({ timestamp: -1 });
}

export async function getLatestPerformanceBenchmark(systemId: string): Promise<any> {
  await connectToDatabase();
  return await PerformanceBenchmarkRecord.findOne({ systemId }).sort({
    timestamp: -1,
  });
}

export async function getPerformanceBenchmarksByExecution(
  executionId: string
): Promise<any[]> {
  await connectToDatabase();
  return await PerformanceBenchmarkRecord.find({ executionId }).sort({
    systemId: 1,
  });
}

// ============================================================================
// Enhancement Recommendation Record Operations
// ============================================================================

export async function createEnhancementRecommendation(
  data: EnhancementRecommendationRecordData
): Promise<any> {
  await connectToDatabase();
  const record = new EnhancementRecommendationRecord(data);
  return await record.save();
}

export async function updateEnhancementRecommendation(
  enhancementId: string,
  updates: Partial<EnhancementRecommendationRecordData>
): Promise<any> {
  await connectToDatabase();
  return await EnhancementRecommendationRecord.findOneAndUpdate(
    { enhancementId },
    { $set: { ...updates, updatedAt: new Date() } },
    { new: true }
  );
}

export async function getEnhancementRecommendation(
  enhancementId: string
): Promise<any> {
  await connectToDatabase();
  return await EnhancementRecommendationRecord.findOne({ enhancementId });
}

export async function getEnhancementRecommendations(filters?: {
  category?: AICategory;
  status?: EnhancementStatus;
  minPriority?: number;
}): Promise<any[]> {
  await connectToDatabase();

  const query: any = {};
  if (filters?.category) query.category = filters.category;
  if (filters?.status) query.status = filters.status;
  if (filters?.minPriority) query.priority = { $gte: filters.minPriority };

  return await EnhancementRecommendationRecord.find(query).sort({ priority: -1 });
}

export async function deleteEnhancementRecommendation(
  enhancementId: string
): Promise<any> {
  await connectToDatabase();
  return await EnhancementRecommendationRecord.findOneAndDelete({ enhancementId });
}

// ============================================================================
// Compatibility Test Record Operations
// ============================================================================

export async function createCompatibilityTestRecord(
  data: CompatibilityTestRecordData
): Promise<any> {
  await connectToDatabase();
  const record = new CompatibilityTestRecord(data);
  return await record.save();
}

export async function getCompatibilityTestRecords(
  executionId: string
): Promise<any[]> {
  await connectToDatabase();
  return await CompatibilityTestRecord.find({ executionId }).sort({ timestamp: 1 });
}

export async function getCompatibilityTestsByBrowser(
  browser: string,
  browserVersion?: string
): Promise<any[]> {
  await connectToDatabase();

  const query: any = { browser };
  if (browserVersion) query.browserVersion = browserVersion;

  return await CompatibilityTestRecord.find(query).sort({ timestamp: -1 });
}

export async function getLatestCompatibilityMatrix(): Promise<any[]> {
  await connectToDatabase();

  // Get the most recent compatibility test for each browser
  const browsers = ['Chrome', 'Edge', 'Firefox', 'Safari'];
  const results = [];

  for (const browser of browsers) {
    const latest = await CompatibilityTestRecord.findOne({ browser }).sort({
      timestamp: -1,
    });
    if (latest) results.push(latest);
  }

  return results;
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function deleteAuditExecutionRecords(
  executionIds: string[]
): Promise<number> {
  await connectToDatabase();

  // Delete audit execution records
  const auditResult = await AuditExecutionRecord.deleteMany({
    executionId: { $in: executionIds },
  });

  // Delete related system validation records
  await SystemValidationRecord.deleteMany({
    executionId: { $in: executionIds },
  });

  // Delete related performance benchmark records
  await PerformanceBenchmarkRecord.deleteMany({
    executionId: { $in: executionIds },
  });

  // Delete related compatibility test records
  await CompatibilityTestRecord.deleteMany({
    executionId: { $in: executionIds },
  });

  return auditResult.deletedCount || 0;
}

export async function getAuditStatistics(): Promise<{
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  totalSystems: number;
  systemsByCategory: Record<AICategory, number>;
  averagePassRate: number;
}> {
  await connectToDatabase();

  const totalExecutions = await AuditExecutionRecord.countDocuments();
  const completedExecutions = await AuditExecutionRecord.countDocuments({
    status: 'completed',
  });
  const failedExecutions = await AuditExecutionRecord.countDocuments({
    status: 'failed',
  });
  const runningExecutions = await AuditExecutionRecord.countDocuments({
    status: 'running',
  });

  const totalSystems = await SystemValidationRecord.distinct('systemId').then(
    (ids) => ids.length
  );

  const categories: AICategory[] = ['vision', 'audio', 'behavioral', 'system'];
  const systemsByCategory: Record<AICategory, number> = {} as any;

  for (const category of categories) {
    const count = await SystemValidationRecord.distinct('systemId', { category }).then(
      (ids) => ids.length
    );
    systemsByCategory[category] = count;
  }

  // Calculate average pass rate from completed audits
  const completedAudits = await AuditExecutionRecord.find({
    status: 'completed',
    'results.summary.passRate': { $exists: true },
  });

  const averagePassRate =
    completedAudits.length > 0
      ? completedAudits.reduce(
          (sum, audit) => sum + (audit.results?.summary?.passRate || 0),
          0
        ) / completedAudits.length
      : 0;

  return {
    totalExecutions,
    completedExecutions,
    failedExecutions,
    runningExecutions,
    totalSystems,
    systemsByCategory,
    averagePassRate,
  };
}

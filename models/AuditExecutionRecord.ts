import mongoose from 'mongoose';

/**
 * MongoDB schema for Audit Execution Records
 * 
 * Stores information about each audit execution including configuration,
 * status, results, and environment details.
 */

const AuditExecutionRecordSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      required: true,
      index: true,
    },
    auditOptions: {
      categories: [
        {
          type: String,
          enum: ['vision', 'audio', 'behavioral', 'system'],
        },
      ],
      includePerformance: Boolean,
      includeFalsePositiveAnalysis: Boolean,
      includeEnhancementRecommendations: Boolean,
      concurrency: Number,
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
    },
    triggeredBy: {
      type: String,
      required: true,
    },
    environment: {
      nodeVersion: String,
      platform: String,
      browser: String,
      browserVersion: String,
      dependencies: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
AuditExecutionRecordSchema.index({ startTime: -1 });
AuditExecutionRecordSchema.index({ status: 1, startTime: -1 });
AuditExecutionRecordSchema.index({ triggeredBy: 1, startTime: -1 });

export default mongoose.models.AuditExecutionRecord ||
  mongoose.model('AuditExecutionRecord', AuditExecutionRecordSchema);

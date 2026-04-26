import mongoose from 'mongoose';

/**
 * MongoDB schema for System Validation Records
 * 
 * Stores validation results for individual AI detection systems,
 * including test results, performance metrics, and accuracy metrics.
 */

const SystemValidationRecordSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    systemId: {
      type: String,
      required: true,
      index: true,
    },
    systemName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['vision', 'audio', 'behavioral', 'system'],
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pass', 'fail', 'warning'],
      required: true,
      index: true,
    },
    testResults: [
      {
        testName: String,
        status: {
          type: String,
          enum: ['pass', 'fail', 'skipped'],
        },
        duration: Number,
        errorMessage: String,
        expectedValue: mongoose.Schema.Types.Mixed,
        actualValue: mongoose.Schema.Types.Mixed,
      },
    ],
    performanceMetrics: {
      frameRate: {
        average: Number,
        min: Number,
        max: Number,
        target: Number,
        meetsTarget: Boolean,
      },
      latency: {
        average: Number,
        p50: Number,
        p95: Number,
        p99: Number,
        target: Number,
        meetsTarget: Boolean,
      },
      memory: {
        initial: Number,
        peak: Number,
        average: Number,
        growth: Number,
        threshold: Number,
        exceedsThreshold: Boolean,
      },
      cpu: {
        average: Number,
        peak: Number,
        threshold: Number,
        exceedsThreshold: Boolean,
      },
    },
    accuracyMetrics: {
      falsePositiveRate: Number,
      falseNegativeRate: Number,
      accuracy: Number,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient querying
SystemValidationRecordSchema.index({ executionId: 1, systemId: 1 });
SystemValidationRecordSchema.index({ systemId: 1, timestamp: -1 });
SystemValidationRecordSchema.index({ category: 1, status: 1 });

export default mongoose.models.SystemValidationRecord ||
  mongoose.model('SystemValidationRecord', SystemValidationRecordSchema);

import mongoose from 'mongoose';

/**
 * MongoDB schema for Performance Benchmark Records
 * 
 * Stores performance metrics and benchmark comparisons for AI detection systems.
 */

const PerformanceBenchmarkRecordSchema = new mongoose.Schema(
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
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    metrics: {
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
    benchmarkComparison: {
      systemId: String,
      overallStatus: {
        type: String,
        enum: ['excellent', 'good', 'acceptable', 'poor'],
      },
      metricComparisons: [
        {
          metricName: String,
          actual: Number,
          target: Number,
          status: {
            type: String,
            enum: ['pass', 'fail'],
          },
          deviation: Number,
        },
      ],
      recommendations: [String],
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

// Indexes for performance trend analysis
PerformanceBenchmarkRecordSchema.index({ systemId: 1, timestamp: -1 });
PerformanceBenchmarkRecordSchema.index({ executionId: 1, systemId: 1 });
PerformanceBenchmarkRecordSchema.index({ 'benchmarkComparison.overallStatus': 1 });

export default mongoose.models.PerformanceBenchmarkRecord ||
  mongoose.model('PerformanceBenchmarkRecord', PerformanceBenchmarkRecordSchema);

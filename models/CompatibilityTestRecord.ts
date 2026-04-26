import mongoose from 'mongoose';

/**
 * MongoDB schema for Compatibility Test Records
 * 
 * Stores browser and device compatibility test results for AI detection systems.
 */

const CompatibilityTestRecordSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    browser: {
      type: String,
      required: true,
      index: true,
    },
    browserVersion: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    systemCompatibility: [
      {
        systemId: String,
        supported: Boolean,
        partialSupport: Boolean,
        limitations: [String],
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
      },
    ],
    overallCompatibility: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

// Indexes for compatibility matrix queries
CompatibilityTestRecordSchema.index({ browser: 1, browserVersion: 1 });
CompatibilityTestRecordSchema.index({ platform: 1, timestamp: -1 });
CompatibilityTestRecordSchema.index({ executionId: 1 });

export default mongoose.models.CompatibilityTestRecord ||
  mongoose.model('CompatibilityTestRecord', CompatibilityTestRecordSchema);

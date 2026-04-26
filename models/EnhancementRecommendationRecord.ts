import mongoose from 'mongoose';

/**
 * MongoDB schema for Enhancement Recommendation Records
 * 
 * Stores AI enhancement recommendations with priority, status, and implementation guides.
 */

const EnhancementRecommendationRecordSchema = new mongoose.Schema(
  {
    enhancementId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['vision', 'audio', 'behavioral', 'system'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      index: true,
    },
    implementationEffort: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true,
    },
    demonstrationValue: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['proposed', 'approved', 'in_progress', 'completed', 'rejected'],
      required: true,
      default: 'proposed',
      index: true,
    },
    implementationGuide: {
      enhancementId: String,
      enhancementName: String,
      overview: String,
      technicalApproach: String,
      requiredDependencies: [
        {
          name: String,
          version: String,
          purpose: String,
          installCommand: String,
        },
      ],
      codeExamples: [
        {
          title: String,
          description: String,
          language: String,
          code: String,
        },
      ],
      integrationPoints: [
        {
          component: String,
          modificationType: {
            type: String,
            enum: ['new_file', 'modify_existing', 'new_hook'],
          },
          description: String,
        },
      ],
      testingStrategy: String,
      estimatedTimeline: String,
    },
  },
  { timestamps: true }
);

// Indexes for filtering and sorting
EnhancementRecommendationRecordSchema.index({ category: 1, priority: -1 });
EnhancementRecommendationRecordSchema.index({ status: 1, priority: -1 });
EnhancementRecommendationRecordSchema.index({ implementationEffort: 1, demonstrationValue: -1 });

export default mongoose.models.EnhancementRecommendationRecord ||
  mongoose.model('EnhancementRecommendationRecord', EnhancementRecommendationRecordSchema);

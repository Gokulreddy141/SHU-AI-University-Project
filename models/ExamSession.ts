import mongoose from "mongoose";

const ExamSessionSchema = new mongoose.Schema(
    {
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
            index: true,
        },
        candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        recruiterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: [
                "pending",
                "biometric_check",
                "in_progress",
                "completed",
                "flagged",
                "scheduled",
                "ongoing_call",
            ],
            default: "pending",
        },
        startTime: { type: Date },
        endTime: { type: Date },
        scheduledAt: { type: Date },
        stageId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        examScore: {
            type: Number,
            default: 0,
        },
        maxScore: {
            type: Number,
            default: 0,
        },
        gradingStatus: {
            type: String,
            enum: ["pending", "auto_graded", "manual_review_required", "finalized"],
            default: "pending",
        },
        advancedToSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExamSession",
            required: false,
        },
        integrityScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
        totalViolations: {
            type: Number,
            default: 0,
        },
        violationSummary: {
            lookingAway: { type: Number, default: 0 },
            noFace: { type: Number, default: 0 },
            multipleFaces: { type: Number, default: 0 },
            lipSyncMismatch: { type: Number, default: 0 },
            faceMismatch: { type: Number, default: 0 },
            tabSwitch: { type: Number, default: 0 },
            copyPaste: { type: Number, default: 0 },
            virtualCamera: { type: Number, default: 0 },
            devtoolsAccess: { type: Number, default: 0 },
            livenessFailure: { type: Number, default: 0 },
            secondaryMonitor: { type: Number, default: 0 },
            fullscreenExit: { type: Number, default: 0 },
            windowBlur: { type: Number, default: 0 },
            keyboardShortcut: { type: Number, default: 0 },
            clipboardPaste: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Prevent duplicate sessions depending on stage configuration
// Note: Manual drop of old index `{ examId: 1, candidateId: 1 }` may be required on the db directly if conflicts occur
ExamSessionSchema.index({ examId: 1, candidateId: 1, stageId: 1 }, { unique: true });
ExamSessionSchema.index({ recruiterId: 1, status: 1 });
ExamSessionSchema.index({ recruiterId: 1, createdAt: -1 });
ExamSessionSchema.index({ candidateId: 1, createdAt: -1 });

export default mongoose.models.ExamSession ||
    mongoose.model("ExamSession", ExamSessionSchema);

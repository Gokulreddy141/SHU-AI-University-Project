import mongoose from "mongoose";

const ExamSchema = new mongoose.Schema(
    {
        recruiterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recruiter ID is required"],
            index: true,
        },
        title: {
            type: String,
            required: [true, "Exam title is required"],
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [100, "Title cannot exceed 100 characters"],
            trim: true,
        },
        description: {
            type: String,
            maxlength: [500, "Description cannot exceed 500 characters"],
            trim: true,
        },
        duration: {
            type: Number,
            required: [true, "Duration in minutes is required"],
            min: [1, "Duration must be at least 1 minute"],
            max: [480, "Duration cannot exceed 8 hours (480 minutes)"],
        },
        sessionCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["draft", "active", "closed"],
            default: "active",
        },
        flagThreshold: {
            type: Number,
            default: 50,
            min: 0,
            max: 100,
        },
        proctoringMode: {
            type: String,
            enum: ["strict", "standard", "light"],
            default: "standard",
        },
        questionsCount: {
            type: Number,
            default: 0,
        },
        stages: [
            {
                title: { type: String, required: true },
                type: {
                    type: String,
                    enum: ["MCQ", "CODING", "LIVE_INTERVIEW"],
                    required: true,
                },
                duration: { type: Number, required: true },
                order: { type: Number, required: true },
            },
        ],
    },
    { timestamps: true }
);

ExamSchema.index({ sessionCode: 1 });
ExamSchema.index({ recruiterId: 1, createdAt: -1 });

export default mongoose.models.Exam || mongoose.model("Exam", ExamSchema);

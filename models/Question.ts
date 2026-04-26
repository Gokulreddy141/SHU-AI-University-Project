import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema(
    {
        examId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
            index: true,
        },
        stageId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            index: true,
        },
        type: {
            type: String,
            enum: ["MCQ", "CODING"],
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
        points: {
            type: Number,
            default: 1,
            min: 0,
        },
        order: {
            type: Number,
            required: true,
        },

        // MCQ Specific Fields
        options: [
            {
                type: String,
                trim: true,
            },
        ],
        correctOptionIndex: {
            type: Number,
            min: 0,
        },

        // Coding Specific Fields
        allowedLanguages: [
            {
                type: String,
                trim: true,
            },
        ],
        starterCode: {
            type: String,
        },
        expectedOutput: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true }
);

// Optimize querying questions for a specific stage ordered correctly
QuestionSchema.index({ examId: 1, stageId: 1, order: 1 });

export default mongoose.models.Question || mongoose.model("Question", QuestionSchema);

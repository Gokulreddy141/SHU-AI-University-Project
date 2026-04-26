import mongoose from "mongoose";

const CandidateResponseSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExamSession",
            required: true,
            index: true,
        },
        questionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            required: true,
            index: true,
        },

        // MCQ answer
        selectedOptionIndex: {
            type: Number,
        },

        // Coding answer
        submittedCode: {
            type: String,
        },
        selectedLanguage: {
            type: String,
        },

        // Grading
        isCorrect: {
            type: Boolean,
        },
        score: {
            type: Number,
            default: 0,
        },

        // Quiz UI State
        isMarkedForReview: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// One answer per question per session
CandidateResponseSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

export default mongoose.models.CandidateResponse || mongoose.model("CandidateResponse", CandidateResponseSchema);

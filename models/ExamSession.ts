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
        // Latest webcam snapshot for war room live view (base64 JPEG, ~15-30KB)
        liveSnapshot: { type: String, default: null },
        liveSnapshotAt: { type: Date, default: null },
        // Real-time AI state snapshot sent alongside each webcam frame
        liveAiState: {
            gazeDirection:    { type: String, default: "CENTER" },
            faceCount:        { type: Number, default: 1 },
            isSpeaking:       { type: Boolean, default: false },
            isLookingAway:    { type: Boolean, default: false },
            activeAlerts:     [{ type: String }], // recent violation types in last 30s
            integrityScore:   { type: Number, default: 100 },
            _updatedAt:       { type: Date, default: null },
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
            // Face & Gaze
            lookingAway:            { type: Number, default: 0 },
            noFace:                 { type: Number, default: 0 },
            multipleFaces:          { type: Number, default: 0 },
            faceMismatch:           { type: Number, default: 0 },
            livenessFailure:        { type: Number, default: 0 },
            faceProximityAnomaly:   { type: Number, default: 0 },
            headPoseAnomaly:        { type: Number, default: 0 },
            blinkPatternAnomaly:    { type: Number, default: 0 },
            pupilFocusAnomaly:      { type: Number, default: 0 },
            microGazeAnomaly:       { type: Number, default: 0 },
            stressDetected:         { type: Number, default: 0 },
            // Audio
            lipSyncMismatch:        { type: Number, default: 0 },
            ambientNoise:           { type: Number, default: 0 },
            voiceActivityAnomaly:   { type: Number, default: 0 },
            voiceIdentityMismatch:  { type: Number, default: 0 },
            syntheticAudioDetected: { type: Number, default: 0 },
            // Objects & Devices
            phoneDetected:          { type: Number, default: 0 },
            notesDetected:          { type: Number, default: 0 },
            earpieceDetected:       { type: Number, default: 0 },
            handGestureAnomaly:     { type: Number, default: 0 },
            // Input & Behaviour
            tabSwitch:              { type: Number, default: 0 },
            duplicateTab:           { type: Number, default: 0 },
            copyPaste:              { type: Number, default: 0 },
            clipboardPaste:         { type: Number, default: 0 },
            keyboardShortcut:       { type: Number, default: 0 },
            typingAnomaly:          { type: Number, default: 0 },
            mouseInactivity:        { type: Number, default: 0 },
            responseTimeAnomaly:    { type: Number, default: 0 },
            behavioralAnomaly:      { type: Number, default: 0 },
            semanticAnswerAnomaly:  { type: Number, default: 0 },
            // System & Environment
            virtualCamera:          { type: Number, default: 0 },
            screenRecordingDetected:{ type: Number, default: 0 },
            extensionDetected:      { type: Number, default: 0 },
            devtoolsAccess:         { type: Number, default: 0 },
            llmDetected:            { type: Number, default: 0 },
            secondaryMonitor:       { type: Number, default: 0 },
            environmentChange:      { type: Number, default: 0 },
            fullscreenExit:         { type: Number, default: 0 },
            windowBlur:             { type: Number, default: 0 },
            networkAnomaly:         { type: Number, default: 0 },
            virtualDeviceDetected:  { type: Number, default: 0 },
            vmOrSandboxDetected:    { type: Number, default: 0 },
        },
        // Post-session AI report generated by Gemini at session completion
        aiReport: {
            summary: { type: String, default: null },
            riskLevel: {
                type: String,
                enum: ["low", "moderate", "high", "critical"],
                default: null,
            },
            flags: [{ type: String }],
            generatedAt: { type: Date, default: null },
        },
        // Per-answer AI-generation probability analysis
        answerAnalysis: [
            {
                questionId: { type: String },
                aiProbability: { type: Number, min: 0, max: 1, default: 0 },
                reasoning: { type: String, default: "" },
                flagged: { type: Boolean, default: false },
            },
        ],
        // Per-question attention + emotion data captured during exam
        attentionData: [
            {
                questionId: { type: String },
                attentionScore: { type: Number, min: 0, max: 100 },
                dominantEmotion: { type: String, default: "neutral" },
                timeSpentSeconds: { type: Number, default: 0 },
            },
        ],
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

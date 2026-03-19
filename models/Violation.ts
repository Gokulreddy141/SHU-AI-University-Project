import mongoose from "mongoose";

const ViolationSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExamSession",
            required: true,
            index: true,
        },
        candidateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                "LOOKING_AWAY",
                "MULTIPLE_FACES",
                "NO_FACE",
                "LIP_SYNC_MISMATCH",
                "FACE_MISMATCH",
                "TAB_SWITCH",
                "COPY_PASTE",
                "VIRTUAL_CAMERA",
                "DEVTOOLS_ACCESS",
                "LIVENESS_FAILURE",
                "SECONDARY_MONITOR",
                "FULLSCREEN_EXIT",
                "WINDOW_BLUR",
                "KEYBOARD_SHORTCUT",
                "CLIPBOARD_PASTE",
                "PHONE_DETECTED",
                "UNAUTHORIZED_MATERIAL",
                "HEAD_POSE_ANOMALY",
                "AMBIENT_NOISE",
                "TYPING_ANOMALY",
                "SCREEN_RECORDING_DETECTED",
                "DUPLICATE_TAB",
                "FACE_PROXIMITY_ANOMALY",
                "EXTENSION_DETECTED",
                "PUPIL_FOCUS_ANOMALY",
                "RESPONSE_TIME_ANOMALY",
                "MOUSE_INACTIVITY",
                "NETWORK_ANOMALY",
                "VOICE_ACTIVITY_ANOMALY",
                "HAND_GESTURE_ANOMALY",
                "ENVIRONMENT_CHANGE",
                "BLINK_PATTERN_ANOMALY",
                "VIRTUAL_DEVICE_DETECTED",
                "SYNTHETIC_AUDIO_DETECTED",
                "MICRO_GAZE_ANOMALY",
                "VM_OR_SANDBOX_DETECTED"
            ],
            required: true,
        },
        direction: {
            type: String,
        },
        timestamp: {
            type: Date,
            required: true,
        },
        duration: {
            type: Number, // seconds
        },
        confidence: {
            type: Number, // 0.0 - 1.0
            min: 0,
            max: 1,
        },
    },
    { timestamps: true }
);

ViolationSchema.index({ sessionId: 1, timestamp: 1 });
ViolationSchema.index({ sessionId: 1, type: 1 });

export default mongoose.models.Violation ||
    mongoose.model("Violation", ViolationSchema);

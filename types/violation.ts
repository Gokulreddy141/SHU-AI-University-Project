export type ViolationType =
    | "LOOKING_AWAY"
    | "MULTIPLE_FACES"
    | "NO_FACE"
    | "LIP_SYNC_MISMATCH"
    | "FACE_MISMATCH"
    | "TAB_SWITCH"
    | "COPY_PASTE"
    | "VIRTUAL_CAMERA"
    | "DEVTOOLS_ACCESS"
    | "LIVENESS_FAILURE"
    | "SECONDARY_MONITOR"
    | "FULLSCREEN_EXIT"
    | "WINDOW_BLUR"
    | "KEYBOARD_SHORTCUT"
    | "CLIPBOARD_PASTE"
    | "PHONE_DETECTED"
    | "UNAUTHORIZED_MATERIAL"
    | "HEAD_POSE_ANOMALY"
    | "AMBIENT_NOISE"
    | "TYPING_ANOMALY"
    | "SCREEN_RECORDING_DETECTED"
    | "DUPLICATE_TAB"
    | "FACE_PROXIMITY_ANOMALY"
    | "EXTENSION_DETECTED"
    | "PUPIL_FOCUS_ANOMALY"
    | "RESPONSE_TIME_ANOMALY"
    | "MOUSE_INACTIVITY"
    | "NETWORK_ANOMALY"
    | "VOICE_ACTIVITY_ANOMALY"
    | "HAND_GESTURE_ANOMALY"
    | "ENVIRONMENT_CHANGE"
    | "BLINK_PATTERN_ANOMALY"
    // v7 AI Proctoring
    | "VIRTUAL_DEVICE_DETECTED"
    | "SYNTHETIC_AUDIO_DETECTED"
    | "MICRO_GAZE_ANOMALY"
    | "VM_OR_SANDBOX_DETECTED";

export type GazeDirection = "LEFT" | "RIGHT" | "UP" | "DOWN";

export interface IViolation {
    _id: string;
    sessionId: string;
    candidateId: string;
    type: ViolationType;
    direction?: string;
    timestamp: string;
    duration?: number;
    confidence?: number;
    createdAt: string;
}

export interface CreateViolationPayload {
    sessionId: string;
    candidateId: string;
    type: ViolationType;
    direction?: string;
    timestamp: string;
    duration?: number;
    confidence?: number;
}

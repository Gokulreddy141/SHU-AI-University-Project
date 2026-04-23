import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Violation from "@/models/Violation";
import ExamSession from "@/models/ExamSession";
import { handleApiError } from "@/lib/apiUtils";
import { calculateIntegrityScore } from "@/lib/integrity";

// Map violation type → violationSummary field
// Every type must have its own dedicated field. Sharing fields between
// unrelated types inflates counts and corrupts the score calculation.
const VIOLATION_FIELD_MAP: Record<string, string> = {
    // Face & Gaze
    LOOKING_AWAY:               "violationSummary.lookingAway",
    NO_FACE:                    "violationSummary.noFace",
    MULTIPLE_FACES:             "violationSummary.multipleFaces",
    SECOND_PERSON:              "violationSummary.multipleFaces",       // Another person = multi-face
    FACE_MISMATCH:              "violationSummary.faceMismatch",
    LIVENESS_FAILURE:           "violationSummary.livenessFailure",
    LIVENESS_CHALLENGE_FAILED:  "violationSummary.livenessFailure",
    FACE_PROXIMITY_ANOMALY:     "violationSummary.faceProximityAnomaly",
    HEAD_POSE_ANOMALY:          "violationSummary.headPoseAnomaly",
    BLINK_PATTERN_ANOMALY:      "violationSummary.blinkPatternAnomaly",
    PUPIL_FOCUS_ANOMALY:        "violationSummary.pupilFocusAnomaly",
    MICRO_GAZE_ANOMALY:         "violationSummary.microGazeAnomaly",
    STRESS_DETECTED:            "violationSummary.stressDetected",
    // Audio
    LIP_SYNC_MISMATCH:          "violationSummary.lipSyncMismatch",
    AMBIENT_NOISE:              "violationSummary.ambientNoise",
    VOICE_ACTIVITY_ANOMALY:       "violationSummary.voiceActivityAnomaly",
    SUSTAINED_SPEECH_DETECTED:    "violationSummary.voiceActivityAnomaly",
    VOICE_IDENTITY_MISMATCH:    "violationSummary.voiceIdentityMismatch",
    SYNTHETIC_AUDIO_DETECTED:   "violationSummary.syntheticAudioDetected",
    // Objects & Devices
    PHONE_DETECTED:             "violationSummary.phoneDetected",
    PHONE_BELOW_MONITOR:        "violationSummary.phoneDetected",       // Same risk — phone visible
    NOTES_DETECTED:             "violationSummary.notesDetected",
    EARPIECE_DETECTED:          "violationSummary.earpieceDetected",
    SMART_GLASSES_DETECTED:     "violationSummary.earpieceDetected",    // Same risk — wearable device
    HAND_GESTURE_ANOMALY:       "violationSummary.handGestureAnomaly",
    // Input & Behaviour
    TAB_SWITCH:                 "violationSummary.tabSwitch",
    DUPLICATE_TAB:              "violationSummary.duplicateTab",
    COPY_PASTE:                 "violationSummary.copyPaste",
    CLIPBOARD_PASTE:            "violationSummary.clipboardPaste",
    KEYBOARD_SHORTCUT:          "violationSummary.keyboardShortcut",
    TYPING_ANOMALY:             "violationSummary.typingAnomaly",
    TYPING_IDENTITY_MISMATCH:   "violationSummary.typingAnomaly",       // Same field — typing pattern
    MOUSE_INACTIVITY:           "violationSummary.mouseInactivity",
    RESPONSE_TIME_ANOMALY:      "violationSummary.responseTimeAnomaly",
    BEHAVIORAL_ANOMALY:         "violationSummary.behavioralAnomaly",
    SEMANTIC_ANSWER_ANOMALY:    "violationSummary.semanticAnswerAnomaly",
    // System & Environment
    VIRTUAL_CAMERA:             "violationSummary.virtualCamera",
    SCREEN_RECORDING_DETECTED:  "violationSummary.screenRecordingDetected",
    EXTENSION_DETECTED:         "violationSummary.extensionDetected",
    DEVTOOLS_ACCESS:            "violationSummary.devtoolsAccess",
    LLM_API_DETECTED:           "violationSummary.llmDetected",
    SECONDARY_MONITOR:          "violationSummary.secondaryMonitor",
    SECOND_SCREEN_DETECTED:     "violationSummary.secondaryMonitor",
    BIMODAL_GAZE_DETECTED:      "violationSummary.secondaryMonitor",    // Bimodal gaze = dual screen
    ENVIRONMENT_CHANGE:         "violationSummary.environmentChange",
    ROOM_ENVIRONMENT_CHANGE:    "violationSummary.environmentChange",   // Legacy alias
    FULLSCREEN_EXIT:            "violationSummary.fullscreenExit",
    WINDOW_BLUR:                "violationSummary.windowBlur",
    NETWORK_ANOMALY:            "violationSummary.networkAnomaly",
    VIRTUAL_DEVICE_DETECTED:    "violationSummary.virtualDeviceDetected",
    VM_OR_SANDBOX_DETECTED:     "violationSummary.vmOrSandboxDetected",
};

// POST /api/violation — Log a new violation
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { sessionId, candidateId, type, direction, timestamp, duration, confidence } =
            await req.json();

        if (!sessionId || !candidateId || !type || !timestamp) {
            return NextResponse.json(
                { message: "Missing required fields: sessionId, candidateId, type, timestamp" },
                { status: 400 }
            );
        }

        const session = await ExamSession.findById(sessionId)
            .select("status")
            .lean();

        if (!session) {
            return NextResponse.json(
                { message: "Session not found" },
                { status: 404 }
            );
        }

        if (session.status === "completed" || session.status === "flagged") {
            return NextResponse.json(
                { message: "Cannot log violation — session has ended" },
                { status: 409 }
            );
        }

        // Create the violation document
        const violation = await Violation.create({
            sessionId,
            candidateId,
            type,
            direction,
            timestamp: new Date(timestamp),
            duration,
            confidence,
        });

        // Increment violation counters
        const summaryField = VIOLATION_FIELD_MAP[type];
        const incUpdate: Record<string, number> = { totalViolations: 1 };
        if (summaryField) incUpdate[summaryField] = 1;

        // Fetch the current violationSummary so we can recalculate the score
        // using the same weighted formula as the dashboard
        const updatedSession = await ExamSession.findByIdAndUpdate(
            sessionId,
            { $inc: incUpdate },
            { new: true }
        ).select("violationSummary").lean() as { violationSummary?: Record<string, number> } | null;

        // Recalculate integrity score using the shared lib/integrity formula
        const newScore = updatedSession?.violationSummary
            ? calculateIntegrityScore(updatedSession.violationSummary as Parameters<typeof calculateIntegrityScore>[0])
            : 100;

        await ExamSession.findByIdAndUpdate(sessionId, { $set: { integrityScore: newScore } });

        return NextResponse.json(
            { message: "Violation logged", violationId: violation._id, integrityScore: newScore },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

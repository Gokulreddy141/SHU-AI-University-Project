import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Violation from "@/models/Violation";
import ExamSession from "@/models/ExamSession";
import { handleApiError } from "@/lib/apiUtils";
import { calculateIntegrityScore } from "@/lib/integrity";

// Map violation type to violationSummary field name
const VIOLATION_FIELD_MAP: Record<string, string> = {
    LOOKING_AWAY: "violationSummary.lookingAway",
    MULTIPLE_FACES: "violationSummary.multipleFaces",
    NO_FACE: "violationSummary.noFace",
    LIP_SYNC_MISMATCH: "violationSummary.lipSyncMismatch",
    FACE_MISMATCH: "violationSummary.faceMismatch",
    TAB_SWITCH: "violationSummary.tabSwitch",
    COPY_PASTE: "violationSummary.copyPaste",
    VIRTUAL_CAMERA: "violationSummary.virtualCamera",
    DEVTOOLS_ACCESS: "violationSummary.devtoolsAccess",
    LIVENESS_FAILURE: "violationSummary.livenessFailure",
    SECONDARY_MONITOR: "violationSummary.secondaryMonitor",
    FULLSCREEN_EXIT: "violationSummary.fullscreenExit",
    WINDOW_BLUR: "violationSummary.windowBlur",
    KEYBOARD_SHORTCUT: "violationSummary.keyboardShortcut",
    CLIPBOARD_PASTE: "violationSummary.clipboardPaste",
    NOTES_DETECTED: "violationSummary.lookingAway",
    SECOND_PERSON: "violationSummary.multipleFaces",
    PHONE_DETECTED: "violationSummary.lookingAway",
    TYPING_IDENTITY_MISMATCH: "violationSummary.tabSwitch",
    VOICE_IDENTITY_MISMATCH: "violationSummary.lipSyncMismatch",
    ROOM_ENVIRONMENT_CHANGE: "violationSummary.lookingAway",
    LLM_API_DETECTED: "violationSummary.copyPaste",
    PHONE_BELOW_MONITOR: "violationSummary.lookingAway",
    LIVENESS_CHALLENGE_FAILED: "violationSummary.livenessFailure",
    BEHAVIORAL_ANOMALY: "violationSummary.tabSwitch",
    SEMANTIC_ANSWER_ANOMALY: "violationSummary.copyPaste",
    BIMODAL_GAZE_DETECTED: "violationSummary.multipleFaces",
    EARPIECE_DETECTED: "violationSummary.lookingAway",
    SMART_GLASSES_DETECTED: "violationSummary.lookingAway",
    SECOND_SCREEN_DETECTED: "violationSummary.secondaryMonitor",
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

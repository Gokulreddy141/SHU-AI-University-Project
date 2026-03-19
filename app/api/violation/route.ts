import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Violation from "@/models/Violation";
import ExamSession from "@/models/ExamSession";
import { handleApiError } from "@/lib/apiUtils";

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

        // Update the session's violation counters atomically
        const summaryField = VIOLATION_FIELD_MAP[type];
        if (summaryField) {
            await ExamSession.findByIdAndUpdate(sessionId, {
                $inc: {
                    totalViolations: 1,
                    [summaryField]: 1,
                },
            });
        }

        return NextResponse.json(
            { message: "Violation logged", violationId: violation._id },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

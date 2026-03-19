import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import CandidateResponse from "@/models/CandidateResponse";
import Question from "@/models/Question";
import { handleApiError } from "@/lib/apiUtils";
import { calculateIntegrityScore } from "@/lib/integrity";

interface LeanExam {
    flagThreshold?: number;
}

interface ViolationSummary {
    tabSwitches: number;
    faceNotVisible: number;
    multipleFaces: number;
    audioViolations: number;
    lookingAway: number;
    noFace: number;
    lipSyncMismatch: number;
    faceMismatch: number;
    voiceMismatch: number;
    deviceChange: number;
    tabSwitch: number;
    copyPaste: number;
}

interface LeanSession {
    _id: unknown;
    status: string;
    violationSummary?: ViolationSummary;
    integrityScore?: number;
    [key: string]: unknown;
}

// GET /api/session/[id] — Get session details
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const session = await ExamSession.findById(id)
            .populate("candidateId", "name email")
            .populate("examId", "title duration sessionCode")
            .lean() as LeanSession;

        if (!session) {
            return NextResponse.json(
                { message: "Session not found" },
                { status: 404 }
            );
        }

        // --- Live Calculation ---
        // If the session is in progress, calculate score on the fly
        // so the recruiter sees the current score immediately.
        if (session.status === "in_progress" && session.violationSummary) {
            session.integrityScore = calculateIntegrityScore(session.violationSummary);
        }

        return NextResponse.json(session);
    } catch (error: unknown) {

        return handleApiError(error);
    }
}

// PATCH /api/session/[id] — Update session (start exam, end exam, flag)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();

        const session = await ExamSession.findById(id);
        if (!session) {
            return NextResponse.json(
                { message: "Session not found" },
                { status: 404 }
            );
        }

        // Update status
        if (body.status) {
            session.status = body.status;
        }

        // Start exam
        if (body.status === "in_progress" && !session.startTime) {
            session.startTime = new Date();
        }

        // End exam — compute final integrity score + auto-flag
        if (body.status === "completed" || body.status === "flagged") {
            session.endTime = new Date();
            // Convert Mongoose subdoc to plain object for the scoring engine
            const summary = session.violationSummary.toObject();
            session.integrityScore = calculateIntegrityScore(summary);

            // Auto-grade technical test if completed
            if (body.status === "completed") {
                // Fetch responses and questions securely on the server
                const responses = await CandidateResponse.find({ sessionId: id }).lean();
                const questions = await Question.find({ examId: session.examId }).lean();

                let earnedScore = 0;
                let maxScore = 0;
                let requiresManual = false;

                interface ExamQuestion {
                    _id: { toString: () => string };
                    points?: number;
                    type: string;
                    correctOptionIndex?: number;
                    expectedOutput?: string;
                }

                interface ExamResponse {
                    questionId: { toString: () => string };
                    selectedOptionIndex?: number;
                    submittedCode?: string;
                }

                const questionsList = questions as unknown as ExamQuestion[];
                const responsesList = responses as unknown as ExamResponse[];

                questionsList.forEach((q: ExamQuestion) => {
                    maxScore += q.points || 1;
                    const resp: ExamResponse | undefined = responsesList.find((r: ExamResponse) => r.questionId.toString() === q._id.toString());

                    if (q.type === "MCQ") {
                        if (resp && resp.selectedOptionIndex === q.correctOptionIndex) {
                            earnedScore += q.points || 1;
                        }
                    } else if (q.type === "CODING") {
                        if (q.expectedOutput && resp?.submittedCode) {
                            try {
                                const regex = new RegExp(q.expectedOutput);
                                if (regex.test(resp.submittedCode)) {
                                    earnedScore += q.points || 1;
                                }
                            } catch {

                                // Invalid regex from recruiter
                                requiresManual = true;
                            }
                        } else {
                            requiresManual = true; // No auto-grade criteria
                        }
                    }
                });

                session.examScore = earnedScore;
                session.maxScore = maxScore;
                session.gradingStatus = requiresManual ? "manual_review_required" : "auto_graded";

                // Auto-flag based on integrity threshold
                const exam = await (await import("@/models/Exam")).default
                    .findById(session.examId)
                    .select("flagThreshold")
                    .lean();
                const threshold = (exam as LeanExam)?.flagThreshold ?? 50;
                if (session.integrityScore < threshold) {
                    session.status = "flagged";
                }
            }
        }

        await session.save();

        return NextResponse.json({
            message: "Session updated",
            session,
        });
    } catch (error: unknown) {

        return handleApiError(error);
    }
}

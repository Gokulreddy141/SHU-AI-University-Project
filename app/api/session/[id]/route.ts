import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import CandidateResponse from "@/models/CandidateResponse";
import Question from "@/models/Question";
import { handleApiError } from "@/lib/apiUtils";
import { calculateIntegrityScore } from "@/lib/integrity";
import { generateWithGemini } from "@/lib/gemini";

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
            // Convert Mongoose subdoc to plain object for the scoring engine.
            // Guard against missing subdoc (e.g. legacy sessions without defaults).
            const summary = session.violationSummary?.toObject?.() ?? {};
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

                // Persist per-question attention data sent from the candidate client
                if (Array.isArray(body.attentionData) && body.attentionData.length > 0) {
                    session.attentionData = body.attentionData;
                }

                // Auto-flag based on integrity threshold
                const exam = await (await import("@/models/Exam")).default
                    .findById(session.examId)
                    .select("flagThreshold title")
                    .lean();
                const threshold = (exam as LeanExam)?.flagThreshold ?? 50;
                if (session.integrityScore < threshold) {
                    session.status = "flagged";
                }

            }
        }

        // Save session immediately — status, score and grading are committed now.
        // The AI report is generated afterwards in a fire-and-forget task so that
        // a slow or failing Gemini call never blocks the PATCH from returning.
        await session.save();

        // Generate post-session AI report via Gemini (truly non-blocking)
        if (body.status === "completed") {
            const sessionId = id;
            const capturedExamTitle = (await (await import("@/models/Exam")).default
                .findById(session.examId)
                .select("title")
                .lean() as { title?: string } | null)?.title ?? "Technical Exam";
            const capturedViolationSummary = session.violationSummary.toObject();
            const capturedAttentionData = session.attentionData;
            const capturedIntegrityScore = session.integrityScore;
            const capturedExamScore = session.examScore;
            const capturedMaxScore = session.maxScore;
            const capturedDuration = session.startTime && session.endTime
                ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000)
                : null;

            (async () => {
                try {
                    const topViolations = Object.entries(capturedViolationSummary)
                        .filter(([, v]) => (v as number) > 0)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 6)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ");

                    const avgAttention =
                        capturedAttentionData && capturedAttentionData.length > 0
                            ? Math.round(
                                  capturedAttentionData.reduce(
                                      (s: number, d: { attentionScore: number }) => s + d.attentionScore,
                                      0
                                  ) / capturedAttentionData.length
                              )
                            : null;

                    const prompt = `You are an AI exam integrity analyst. Analyse this candidate exam session and provide a concise integrity report.

Exam: ${capturedExamTitle}
Duration: ${capturedDuration !== null ? `${capturedDuration} minutes` : "unknown"}
Integrity score: ${capturedIntegrityScore}/100
Exam score: ${capturedExamScore}/${capturedMaxScore}
Violations detected: ${topViolations || "none"}
Average attention score: ${avgAttention !== null ? `${avgAttention}/100` : "not available"}

Respond with a JSON object (no markdown fences) with exactly these keys:
- "summary": 2-3 sentence plain-English summary of integrity concerns and candidate behaviour
- "riskLevel": one of "low", "moderate", "high", "critical"
- "flags": array of short strings naming the main concerns (max 5)

Only output the JSON object.`;

                    const raw = await generateWithGemini(prompt);
                    const clean = raw.replace(/```json|```/g, "").trim();
                    const parsed = JSON.parse(clean) as {
                        summary: string;
                        riskLevel: "low" | "moderate" | "high" | "critical";
                        flags: string[];
                    };

                    await ExamSession.findByIdAndUpdate(sessionId, {
                        aiReport: {
                            summary: parsed.summary ?? null,
                            riskLevel: parsed.riskLevel ?? null,
                            flags: Array.isArray(parsed.flags) ? parsed.flags : [],
                            generatedAt: new Date(),
                        },
                    });
                } catch {
                    // Gemini unavailable — skip report silently
                }
            })();
        }

        return NextResponse.json({
            message: "Session updated",
            session,
        });
    } catch (error: unknown) {

        return handleApiError(error);
    }
}

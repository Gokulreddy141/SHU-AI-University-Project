import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Exam from "@/models/Exam";
import { getAuth } from "@/lib/apiUtils";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        await connectToDatabase();
        const auth = await getAuth(request);

        if (!auth || auth.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Only recruiters can advance candidates" },
                { status: 403 }
            );
        }

        const sessionId = resolvedParams.id;
        const body = await request.json();
        const { scheduledAt } = body;

        // 1. Fetch current session
        const oldSession = await ExamSession.findById(sessionId);
        if (!oldSession) {
            return NextResponse.json(
                { success: false, error: "Session not found" },
                { status: 404 }
            );
        }

        // Verify recruiter ownership
        if (oldSession.recruiterId.toString() !== auth.userId) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        // Prevent double advancement
        if (oldSession.advancedToSessionId) {
            return NextResponse.json(
                { success: false, error: "Candidate has already been advanced" },
                { status: 409 }
            );
        }

        // 2. Fetch exam to find the NEXT stage
        interface ExamStage { _id: { toString: () => string } }
        const exam = await Exam.findById(oldSession.examId)
            .select("stages")
            .lean() as unknown as { stages?: ExamStage[] };

        if (!exam || !exam.stages?.length) {
            return NextResponse.json(
                { success: false, error: "Exam has no stages configured" },
                { status: 400 }
            );
        }

        const stages = exam.stages;
        const currentStageIndex = oldSession.stageId
            ? stages.findIndex((s: ExamStage) => s._id.toString() === oldSession.stageId.toString())
            : 0;

        const nextStage = stages[currentStageIndex + 1];

        if (!nextStage) {
            return NextResponse.json(
                { success: false, error: "No next stage available in this exam pipeline" },
                { status: 400 }
            );
        }

        // 3. Create new session for the next stage
        const newSession = await ExamSession.create({
            examId: oldSession.examId,
            candidateId: oldSession.candidateId,
            recruiterId: oldSession.recruiterId,
            stageId: nextStage._id,
            status: "scheduled",
            scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        });

        // 4. Link old session to the new one
        oldSession.advancedToSessionId = newSession._id;
        await oldSession.save();

        return NextResponse.json({
            success: true,
            message: "Candidate advanced to next stage",
            newSession,
        }, { status: 201 });

    } catch (error: unknown) {
        // Handle duplicate key error (unique index prevents double advancement)
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: number }).code === 11000) {
            return NextResponse.json(
                { success: false, error: "Candidate already has a session for the next stage" },
                { status: 409 }
            );
        }
        console.error("Error advancing candidate:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

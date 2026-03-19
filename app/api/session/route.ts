import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Exam from "@/models/Exam";

// POST /api/session — Candidate starts an exam session
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { examId, candidateId, stageId } = await req.json();

        if (!examId || !candidateId) {
            return NextResponse.json(
                { message: "Missing required fields: examId, candidateId" },
                { status: 400 }
            );
        }

        // Get the exam to find the recruiterId
        const exam = await Exam.findById(examId).select("recruiterId status").lean();
        if (!exam) {
            return NextResponse.json({ message: "Exam not found" }, { status: 404 });
        }

        if (exam.status === "closed") {
            return NextResponse.json(
                { message: "This exam has been closed" },
                { status: 403 }
            );
        }

        // Check if session already exists (unique: examId + candidateId + stageId)
        const filter = { examId, candidateId, ...(stageId && { stageId }) };
        const existing = await ExamSession.findOne(filter)
            .select("_id status")
            .lean();

        if (existing) {
            return NextResponse.json(
                { message: "Session already exists", session: existing },
                { status: 200 }
            );
        }

        const session = await ExamSession.create({
            examId,
            candidateId,
            stageId,
            recruiterId: exam.recruiterId,
            status: "biometric_check",
        });

        return NextResponse.json(
            { message: "Session created", session },
            { status: 201 }
        );
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

import { calculateIntegrityScore } from "@/lib/integrity";

// GET /api/session — Fetch paginated recent sessions for a given recruiter
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");
        const limitParam = searchParams.get("limit");

        if (!recruiterId) {
            return NextResponse.json({ message: "recruiterId is required" }, { status: 400 });
        }

        const limit = limitParam ? parseInt(limitParam, 10) : 50;

        const sessions = await ExamSession.find({ recruiterId })
            .populate("candidateId", "name email")
            .populate("examId", "title duration")
            .select("examId candidateId status integrityScore totalViolations violationSummary createdAt")
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        // --- Live Calculation for List ---
        const enhancedSessions = sessions.map((s: unknown) => {
            if (s.status === "in_progress" || s.status === "biometric_check") {
                s.integrityScore = calculateIntegrityScore(s.violationSummary);
            }
            return s;
        });

        return NextResponse.json({ items: enhancedSessions }, { status: 200 });
    } catch {

        console.error("Failed to GET sessions", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

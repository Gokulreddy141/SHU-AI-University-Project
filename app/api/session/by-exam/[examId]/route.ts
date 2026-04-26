import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";

// GET /api/session/by-exam/[examId] — List all sessions for an exam
export async function GET(
    req: Request,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        await connectToDatabase();
        const { examId } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const sessions = await ExamSession.find({ examId })
            .select(
                "candidateId status integrityScore totalViolations startTime endTime createdAt"
            )
            .populate("candidateId", "name email")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await ExamSession.countDocuments({ examId });

        return NextResponse.json({ sessions, total, page, limit });
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

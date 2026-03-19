import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";

// Ensure Exam model is registered so .populate('examId') works
import "@/models/Exam";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id: candidateId } = await params;

        if (!candidateId) {
            return NextResponse.json(
                { message: "Candidate ID is required" },
                { status: 400 }
            );
        }

        // Fetch candidate sessions, populate exam metadata, select only what we need for the card
        const sessions = await ExamSession.find({ candidateId })
            .select("examId status examScore maxScore gradingStatus createdAt")
            .populate({
                path: "examId",
                select: "title description duration",
            })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ sessions, total: sessions.length }, { status: 200 });
    } catch (error: unknown) {
        console.error("Failed to fetch candidate sessions:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

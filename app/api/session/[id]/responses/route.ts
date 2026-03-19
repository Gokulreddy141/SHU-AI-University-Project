import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import CandidateResponse from "@/models/CandidateResponse";
import ExamSession from "@/models/ExamSession";
import { getAuth } from "@/lib/apiUtils";

export async function GET(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        await connectToDatabase();
        const auth = await getAuth(request);

        if (!auth) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const sessionId = resolvedParams.id;

        // Fetch the session
        const session = await ExamSession.findById(sessionId).lean();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Session not found" },
                { status: 404 }
            );
        }

        // Verify access: Recruiter owns the exam, or Candidate owns the session
        if (auth.role === "candidate" && session.candidateId.toString() !== auth.userId) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }
        if (auth.role === "recruiter" && session.recruiterId.toString() !== auth.userId) {
            return NextResponse.json(
                { success: false, error: "Forbidden" },
                { status: 403 }
            );
        }

        // Fetch candidate responses, populating the Question context
        const populateFields = auth.role === "recruiter"
            ? "text type points options correctOptionIndex expectedOutput"
            : "text type points options"; // Mask correct answers for candidates

        const responses = await CandidateResponse.find({ sessionId })
            .populate("questionId", populateFields)
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({ success: true, items: responses });
    } catch (error: Error | unknown) {
        console.error("Error fetching responses:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

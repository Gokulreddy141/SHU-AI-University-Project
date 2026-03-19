import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Question from "@/models/Question";
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

        const url = new URL(request.url);
        const stageId = url.searchParams.get("stageId");
        const sessionId = url.searchParams.get("sessionId"); // Provided if called by a candidate
        const examId = resolvedParams.id;

        // stageId is optional — if not provided, fetch all questions for the exam

        // Verify access if candidate
        if (auth.role === "candidate") {
            if (!sessionId) {
                return NextResponse.json(
                    { success: false, error: "sessionId is required for candidates" },
                    { status: 400 }
                );
            }

            const session = await ExamSession.findOne({
                _id: sessionId,
                candidateId: auth.userId,
                examId: examId,
                ...(stageId ? { stageId } : {})
            }).lean();

            if (!session) {
                return NextResponse.json(
                    { success: false, error: "Forbidden: No valid session for this stage" },
                    { status: 403 }
                );
            }
        }

        // Fetch questions for this exam and stage
        const query = Question.find({ examId, ...(stageId ? { stageId } : {}) }).sort({ order: 1 });

        // If candidate, drop the `correctOptionIndex`
        if (auth.role === "candidate") {
            query.select("-correctOptionIndex -expectedOutput");
        }

        const questions = await query.lean();

        return NextResponse.json({ success: true, items: questions });
    } catch (error: Error | unknown) {
        console.error("Error fetching questions:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

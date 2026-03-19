import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import CandidateResponse from "@/models/CandidateResponse";
import ExamSession from "@/models/ExamSession";
import Question from "@/models/Question";
import { getAuth } from "@/lib/apiUtils";

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const auth = await getAuth(request);

        if (!auth || auth.role !== "candidate") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { sessionId, questionId, selectedOptionIndex, submittedCode, selectedLanguage, isMarkedForReview } = body;

        if (!sessionId || !questionId) {
            return NextResponse.json(
                { success: false, error: "sessionId and questionId are required" },
                { status: 400 }
            );
        }

        // Verify session belongs to the candidate
        const session = await ExamSession.findOne({ _id: sessionId, candidateId: auth.userId }).lean();
        if (!session) {
            return NextResponse.json(
                { success: false, error: "Session not found or invalid" },
                { status: 404 }
            );
        }

        // Fetch question for auto-grading
        const question = await Question.findById(questionId).lean();
        if (!question) {
            return NextResponse.json(
                { success: false, error: "Question not found" },
                { status: 404 }
            );
        }

        let isCorrect: boolean | undefined = undefined;
        let score = 0;

        // Auto-grade MCQ
        if (question.type === "MCQ") {
            if (question.correctOptionIndex !== undefined && selectedOptionIndex !== undefined) {
                isCorrect = question.correctOptionIndex === selectedOptionIndex;
                if (isCorrect) score = question.points || 1;
            }
        }

        // Upsert Candidate Response (auto-save allows multiple updates)
        const responseData = await CandidateResponse.findOneAndUpdate(
            { sessionId, questionId },
            {
                $set: {
                    selectedOptionIndex,
                    submittedCode,
                    selectedLanguage,
                    isMarkedForReview,
                    isCorrect,
                    score,
                },
            },
            { new: true, upsert: true, runValidators: true }
        ).lean();

        return NextResponse.json({ success: true, response: responseData }, { status: 201 });
    } catch (error: Error | unknown) {
        console.error("Error saving candidate response:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

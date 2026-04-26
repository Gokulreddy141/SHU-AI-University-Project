import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Question from "@/models/Question";
import Exam from "@/models/Exam";
import { getAuth } from "@/lib/apiUtils";

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const auth = await getAuth(request);

        if (!auth || auth.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { examId, stageId, type, text, points, order, options, correctOptionIndex, allowedLanguages, starterCode, expectedOutput } = body;

        // Verify the recruiter owns this exam
        const exam = await Exam.findOne({ _id: examId, recruiterId: auth.userId }).lean();
        if (!exam) {
            return NextResponse.json(
                { success: false, error: "Exam not found or unauthorized" },
                { status: 404 }
            );
        }

        const question = await Question.create({
            examId,
            stageId,
            type,
            text,
            points: points || 1,
            order,
            options,
            correctOptionIndex,
            allowedLanguages,
            starterCode,
            expectedOutput,
        });

        return NextResponse.json({ success: true, question }, { status: 201 });
    } catch (error: Error | unknown) {
        console.error("Error creating question:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

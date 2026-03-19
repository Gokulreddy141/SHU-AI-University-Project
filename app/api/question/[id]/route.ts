import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Question from "@/models/Question";
import Exam from "@/models/Exam";
import { getAuth } from "@/lib/apiUtils";

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } | Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        await connectToDatabase();
        const auth = await getAuth(request);

        if (!auth || auth.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const questionId = resolvedParams.id;
        const body = await request.json();

        // Find the question to get the examId
        const question = await Question.findById(questionId).lean();
        if (!question) {
            return NextResponse.json(
                { success: false, error: "Question not found" },
                { status: 404 }
            );
        }

        // Verify the recruiter owns this exam
        const exam = await Exam.findOne({ _id: question.examId, recruiterId: auth.userId }).lean();
        if (!exam) {
            return NextResponse.json(
                { success: false, error: "Unauthorized to edit this question" },
                { status: 403 }
            );
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
            { $set: body },
            { new: true, runValidators: true }
        ).lean();

        return NextResponse.json({ success: true, question: updatedQuestion });
    } catch (error: Error | unknown) {
        console.error("Error updating question:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

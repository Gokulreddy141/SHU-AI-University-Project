import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import { IBulkQuestionInput } from "@/types/question";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id: examId } = await params;
        const body = await req.json();
        const { questions }: { questions: IBulkQuestionInput[] } = body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json(
                { message: "No questions provided" },
                { status: 400 }
            );
        }

        if (questions.length > 200) {
            return NextResponse.json(
                { message: "Bulk import is limited to 200 questions per request" },
                { status: 400 }
            );
        }

        // Verify Exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            return NextResponse.json(
                { message: "Exam not found" },
                { status: 404 }
            );
        }

        // TODO: Verify recruiter ownership if auth is implemented
        // For now, following existing patterns in the codebase

        // Get current max order for this exam
        const lastQuestion = await Question.findOne({ examId })
            .sort("-order")
            .select("order")
            .lean();

        const startingOrder = (lastQuestion?.order || 0) + 1;

        // Prepare questions for insertion
        const questionsToInsert = questions.map((q, index) => ({
            ...q,
            examId,
            order: startingOrder + index,
        }));

        // Batch Insert
        const insertedQuestions = await Question.insertMany(questionsToInsert);

        // Update exam's question count
        await Exam.findByIdAndUpdate(examId, {
            $inc: { questionsCount: insertedQuestions.length }
        });

        return NextResponse.json({
            message: `Successfully imported ${insertedQuestions.length} questions`,
            count: insertedQuestions.length,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

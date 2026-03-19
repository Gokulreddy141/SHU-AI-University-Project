import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
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

        const body = await request.json();
        const { stages } = body;

        if (!Array.isArray(stages)) {
            return NextResponse.json(
                { success: false, error: "Stages must be an array" },
                { status: 400 }
            );
        }

        // Validate stages structure
        for (const stage of stages) {
            if (!stage.title || !stage.type || !stage.duration || stage.order === undefined) {
                return NextResponse.json(
                    { success: false, error: "Invalid stage format" },
                    { status: 400 }
                );
            }
        }

        const examId = resolvedParams.id;

        // Ensure the exam belongs to the recruiter
        const exam = await Exam.findOneAndUpdate(
            { _id: examId, recruiterId: auth.userId },
            { $set: { stages } },
            { new: true, runValidators: true }
        ).lean();

        if (!exam) {
            return NextResponse.json(
                { success: false, error: "Exam not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, exam });
    } catch (error: unknown) {
        console.error("Error updating exam stages:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

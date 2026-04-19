import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
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
        const { examId, stageId, candidateId, scheduledAt } = body;

        if (!examId || !stageId || !candidateId || !scheduledAt) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Create the session for the live interview stage
        const session = await ExamSession.create({
            examId,
            stageId,
            candidateId,
            recruiterId: auth.userId,
            scheduledAt,
            status: "scheduled",
        });

        return NextResponse.json({ success: true, session }, { status: 201 });
    } catch (error) {
        console.error("Error scheduling session:", error);

        // Handle duplicate key error manually depending on db state
        if (error instanceof Error && (error as { code?: number }).code === 11000) {
            return NextResponse.json(
                { success: false, error: "A session already exists for this candidate in this stage." },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

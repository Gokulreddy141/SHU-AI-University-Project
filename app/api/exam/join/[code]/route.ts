import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";

// GET /api/exam/join/[code] — Look up exam by session code
export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await connectToDatabase();
        const { code } = await params;

        const exam = await Exam.findOne({ sessionCode: code.toUpperCase() })
            .select("_id recruiterId title description duration sessionCode status createdAt")
            .lean();

        if (!exam) {
            return NextResponse.json(
                { message: "Invalid session code. Please check and try again." },
                { status: 404 }
            );
        }

        if (exam.status === "closed") {
            return NextResponse.json(
                { message: "This exam has been closed by the recruiter." },
                { status: 403 }
            );
        }

        return NextResponse.json(exam);
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

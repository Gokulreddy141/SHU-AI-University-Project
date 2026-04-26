import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import ExamSession from "@/models/ExamSession";
import { getAuth } from "@/lib/apiUtils";

// GET /api/exam/join/[code] — Look up exam by session code (invited candidates only)
export async function GET(
    req: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        await connectToDatabase();
        const { code } = await params;

        const exam = await Exam.findOne({ sessionCode: code.toUpperCase() })
            .select("_id recruiterId title description duration sessionCode status questionsCount opensAt closesAt createdAt")
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

        if (exam.status === "draft") {
            return NextResponse.json(
                { message: "This exam is not yet published. Please contact your recruiter." },
                { status: 403 }
            );
        }

        // Gate: exam must have at least one question
        if (!exam.questionsCount || exam.questionsCount === 0) {
            return NextResponse.json(
                { message: "This exam has no questions yet. Please wait for the recruiter to add questions." },
                { status: 403 }
            );
        }

        // Gate: schedule window check
        const now = new Date();
        if (exam.opensAt && now < new Date(exam.opensAt)) {
            const opensDate = new Date(exam.opensAt).toLocaleString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", timeZoneName: "short",
            });
            return NextResponse.json(
                { message: `This exam is not open yet. It opens on ${opensDate}.`, opensAt: exam.opensAt },
                { status: 403 }
            );
        }

        if (exam.closesAt && now > new Date(exam.closesAt)) {
            return NextResponse.json(
                { message: "This exam window has ended. No further entries are accepted." },
                { status: 403 }
            );
        }

        // Check if the candidate was invited (has a session record for this exam)
        const auth = getAuth(req);
        if (auth && auth.role === "candidate") {
            const session = await ExamSession.findOne({
                examId: exam._id,
                candidateId: auth.userId,
            }).lean();

            if (!session) {
                return NextResponse.json(
                    { message: "You have not been invited to this exam. Please contact your recruiter." },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json(exam);
    } catch {
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

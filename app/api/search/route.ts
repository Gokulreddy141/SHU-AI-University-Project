import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import Exam from "@/models/Exam";

/**
 * GET /api/search?q=<query>&recruiterId=<id>
 * Returns candidates + exams matching the query for a given recruiter.
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q")?.trim() || "";
        const recruiterId = searchParams.get("recruiterId");

        if (!q || q.length < 2) {
            return NextResponse.json({ candidates: [], exams: [] });
        }

        const regex = { $regex: q, $options: "i" };

        const [candidates, exams] = await Promise.all([
            User.find({ role: "candidate", $or: [{ name: regex }, { email: regex }] })
                .select("name email")
                .limit(5)
                .lean(),
            recruiterId
                ? Exam.find({ recruiterId, $or: [{ title: regex }, { sessionCode: regex }] })
                    .select("title sessionCode status")
                    .limit(5)
                    .lean()
                : [],
        ]);

        return NextResponse.json({ candidates, exams });
    } catch {
        return NextResponse.json({ candidates: [], exams: [] }, { status: 500 });
    }
}

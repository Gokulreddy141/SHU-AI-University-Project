import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import ExamSession from "@/models/ExamSession";

// GET /api/candidates — List candidates for a given recruiter's exams
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        if (!recruiterId) {
            return NextResponse.json(
                { message: "recruiterId is required" },
                { status: 400 }
            );
        }

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const querySearch = searchParams.get("query") || "";

        // 1. Find all distinct candidate IDs who took an exam hosted by this recruiter
        const distinctCandidateIds = await ExamSession.distinct("candidateId", { recruiterId });

        if (!distinctCandidateIds.length) {
            return NextResponse.json({ candidates: [], total: 0, page, limit });
        }

        // 2. Build the query to filter the User collection
        const userQuery: Record<string, unknown> = {
            _id: { $in: distinctCandidateIds },
            role: "candidate",
        };

        if (querySearch) {
            userQuery.name = { $regex: querySearch, $options: "i" };
        }

        // 3. Fetch paginated users
        const users = await User.find(userQuery)
            .select("name email department status")
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await User.countDocuments(userQuery);

        // 4. Attach summary statistics (total exams, avg integrity) by querying ExamSession
        const candidatesWithStats = await Promise.all(
            users.map(async (user) => {
                // Aggregate exam metrics for this candidate under this recruiter's exams
                const stats = await ExamSession.aggregate([
                    {
                        $match: {
                            candidateId: user._id,
                            recruiterId: recruiterId, // We must cast to objectId if required, but mongoose handles strings well if schema is strict
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalExams: { $sum: 1 },
                            avgIntegrity: { $avg: "$integrityScore" }
                        }
                    }
                ]);

                const summary = stats.length > 0 ? stats[0] : { totalExams: 0, avgIntegrity: 0 };

                return {
                    ...user,
                    totalExams: summary.totalExams,
                    avgIntegrity: Math.round(summary.avgIntegrity || 0),
                    status: "verified" // For now, defaulting verification status in UI
                };
            })
        );

        return NextResponse.json({ candidates: candidatesWithStats, total, page, limit });

    } catch (error: unknown) {
        console.error("Failed to GET candidates", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Violation from "@/models/Violation";

/**
 * GET /api/reports/violations
 * Paginated violations across all sessions for a recruiter.
 * Query: ?recruiterId=&page=1&limit=10&type=
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");
        const type = searchParams.get("type") || "";
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

        // Get session IDs for this recruiter
        const sessionFilter: Record<string, unknown> = {};
        if (recruiterId && mongoose.Types.ObjectId.isValid(recruiterId)) {
            sessionFilter.recruiterId = new mongoose.Types.ObjectId(recruiterId);
        }
        const sessionIds = await ExamSession.find(sessionFilter).select("_id").lean()
            .then(sessions => sessions.map(s => s._id));

        // Build violation filter
        const violationFilter: Record<string, unknown> = { sessionId: { $in: sessionIds } };
        if (type) violationFilter.type = type;

        const [violations, total] = await Promise.all([
            Violation.find(violationFilter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select("type confidence timestamp sessionId candidateId")
                .populate("candidateId", "name email")
                .lean(),
            Violation.countDocuments(violationFilter),
        ]);

        const mapped = violations.map((v: Record<string, unknown>, idx: number) => {
            const candidate = v.candidateId as { name?: string } | null;
            const name = candidate?.name || "Unknown";
            const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            const confidence = (v.confidence as number) ?? 0;
            return {
                id: (v._id as mongoose.Types.ObjectId)?.toString() || `v${idx}`,
                sessionId: v.sessionId?.toString() || null,
                candidateName: name,
                candidateInitials: initials,
                type: v.type as string,
                severity: confidence > 0.8 ? "critical" : "moderate",
                timestamp: v.timestamp
                    ? new Date(v.timestamp as string).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })
                    : "",
            };
        });

        return NextResponse.json({
            violations: mapped,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Failed to fetch paginated violations:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

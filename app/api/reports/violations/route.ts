import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Violation from "@/models/Violation";
import { isCriticalViolation } from "@/lib/proctoring";

/**
 * GET /api/reports/violations
 * Paginated violations across all sessions for a recruiter.
 * Query params:
 *   recruiterId, page, limit, type, severity (critical|moderate),
 *   candidateName (partial), sortBy (timestamp|type|severity), sortOrder (asc|desc)
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");
        const type = searchParams.get("type") || "";
        const severity = searchParams.get("severity") || ""; // "critical" | "moderate" | ""
        const candidateName = searchParams.get("candidateName") || "";
        const sortBy = searchParams.get("sortBy") || "timestamp";
        const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
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

        // Severity filter: critical = confidence > 0.8, moderate = ≤ 0.8
        if (severity === "critical") {
            violationFilter.confidence = { $gt: 0.8 };
        } else if (severity === "moderate") {
            violationFilter.confidence = { $lte: 0.8 };
        }

        // Build sort
        const allowedSortFields: Record<string, string> = {
            timestamp: "timestamp",
            type: "type",
            severity: "confidence",
        };
        const sortField = allowedSortFields[sortBy] || "timestamp";
        const sort: Record<string, 1 | -1> = { [sortField]: sortOrder as 1 | -1 };

        // Fetch violations + populate candidate
        let query = Violation.find(violationFilter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit)
            .select("type confidence timestamp sessionId candidateId")
            .populate("candidateId", "name email");

        let [violations, total] = await Promise.all([
            query.lean(),
            Violation.countDocuments(violationFilter),
        ]);

        // Candidate name filter (post-DB — candidate name lives in populated ref)
        if (candidateName.trim()) {
            const q = candidateName.trim().toLowerCase();
            const filtered = (violations as Array<Record<string, unknown>>).filter(v => {
                const c = v.candidateId as { name?: string } | null;
                return c?.name?.toLowerCase().includes(q);
            });
            // Re-count for pagination (simple client-side filter on this page)
            violations = filtered as typeof violations;
        }

        const mapped = (violations as Array<Record<string, unknown>>).map((v, idx) => {
            const candidate = v.candidateId as { name?: string } | null;
            const name = candidate?.name || "Unknown";
            const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            const confidence = (v.confidence as number) ?? 0;
            const vType = v.type as string;
            return {
                id: (v._id as mongoose.Types.ObjectId)?.toString() || `v${idx}`,
                sessionId: v.sessionId?.toString() || null,
                candidateName: name,
                candidateInitials: initials,
                type: vType,
                severity: isCriticalViolation(vType) || confidence > 0.8 ? "critical" : "moderate",
                timestamp: v.timestamp
                    ? new Date(v.timestamp as string).toLocaleString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", second: "2-digit",
                    })
                    : "",
                rawTimestamp: v.timestamp,
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

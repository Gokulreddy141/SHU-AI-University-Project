import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Violation from "@/models/Violation";

/**
 * GET /api/notifications?recruiterId=<id>
 * Returns the most recent actionable events for the recruiter:
 * - Newly flagged sessions (last 24h)
 * - High-confidence violations (last 24h)
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
            return NextResponse.json({ notifications: [] });
        }

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
        const objectId = new mongoose.Types.ObjectId(recruiterId);

        // 1. Recently flagged sessions belonging to this recruiter
        const flaggedSessions = await ExamSession.find({
            recruiterId: objectId,
            status: "flagged",
            updatedAt: { $gte: since },
        })
            .select("_id candidateId examId updatedAt")
            .populate("candidateId", "name")
            .populate("examId", "title")
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean();

        // 2. High-confidence violations (>= 0.85) in sessions of this recruiter
        const recruiterSessionIds = await ExamSession.distinct("_id", { recruiterId: objectId });
        const highConfViolations = await Violation.find({
            sessionId: { $in: recruiterSessionIds },
            confidence: { $gte: 0.85 },
            timestamp: { $gte: since },
        })
            .select("sessionId type confidence timestamp")
            .populate({ path: "sessionId", select: "candidateId examId", populate: [{ path: "candidateId", select: "name" }, { path: "examId", select: "title" }] })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        const notifications: Array<{
            id: string;
            type: "flagged_session" | "violation";
            title: string;
            body: string;
            time: string;
            severity: "critical" | "warning";
            href: string;
        }> = [];

        for (const session of flaggedSessions) {
            const candidate = session.candidateId as { name?: string } | null;
            const exam = session.examId as { title?: string } | null;
            notifications.push({
                id: `fs-${session._id}`,
                type: "flagged_session",
                title: "Session Flagged",
                body: `${candidate?.name || "Candidate"} in ${exam?.title || "exam"} was flagged`,
                time: (session.updatedAt as Date).toISOString(),
                severity: "critical",
                href: `/dashboard/report/${session._id}`,
            });
        }

        for (const v of highConfViolations) {
            const sess = v.sessionId as { _id: unknown; candidateId?: { name?: string }; examId?: { title?: string } } | null;
            const candidateName = sess?.candidateId?.name || "Candidate";
            const examTitle = sess?.examId?.title || "exam";
            notifications.push({
                id: `v-${v._id}`,
                type: "violation",
                title: v.type.replace(/_/g, " "),
                body: `${candidateName} in ${examTitle} — confidence ${Math.round((v.confidence as number) * 100)}%`,
                time: (v.timestamp as Date).toISOString(),
                severity: (v.confidence as number) >= 0.9 ? "critical" : "warning",
                href: `/dashboard/report/${sess?._id}`,
            });
        }

        // Sort all by time desc, deduplicate by sessionId
        notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return NextResponse.json({ notifications: notifications.slice(0, 12) });
    } catch (err) {
        console.error("Notifications error:", err);
        return NextResponse.json({ notifications: [] }, { status: 500 });
    }
}

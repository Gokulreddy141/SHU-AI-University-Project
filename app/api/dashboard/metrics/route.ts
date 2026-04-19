import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Exam from "@/models/Exam";
import { calculateIntegrityScore } from "@/lib/integrity";

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
            return NextResponse.json(
                { message: "Valid recruiterId is required" },
                { status: 400 }
            );
        }

        const objectId = new mongoose.Types.ObjectId(recruiterId);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // --- Current period stats ---
        const [
            activeExams,
            prevActiveExams,
            currentCandidates,
            prevCandidates,
            recentSessions,
            prevSessionStats,
        ] = await Promise.all([
            // Active exams now
            Exam.countDocuments({ recruiterId: objectId, status: "active" }),
            // Active exams last month
            Exam.countDocuments({
                recruiterId: objectId,
                status: "active",
                createdAt: { $lt: thirtyDaysAgo },
            }),
            // Current-period distinct candidates
            ExamSession.distinct("candidateId", {
                recruiterId: objectId,
                createdAt: { $gte: thirtyDaysAgo },
            }),
            // Previous-period distinct candidates
            ExamSession.distinct("candidateId", {
                recruiterId: objectId,
                createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            }),
            // Fetch sessions for live avg calculation
            ExamSession.find({ recruiterId: objectId })
                .select("status integrityScore violationSummary")
                .lean(),
            // Previous-period flagged
            ExamSession.aggregate([
                {
                    $match: {
                        recruiterId: objectId,
                        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: null,
                        flaggedCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "flagged"] }, 1, 0],
                            },
                        },
                    },
                },
            ]),
        ]);

        const totalCandidates = await ExamSession.distinct("candidateId", {
            recruiterId: objectId,
        }).then((ids) => ids.length);

        // --- Live Stats Computation ---
        let totalScore = 0;
        let flaggedSessions = 0;
        const totalSessions = recentSessions.length;

        recentSessions.forEach((s: unknown) => {
            // Always recompute from violationSummary so it matches the violation API formula
            const score = calculateIntegrityScore(s.violationSummary);
            totalScore += score;
            if (s.status === "flagged") flaggedSessions++;
        });

        const avgIntegrityScore = totalSessions > 0 ? Math.round(totalScore / totalSessions) : 100;

        // --- Trend calculations ---
        const calcTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100 * 10) / 10;
        };

        const activeExamsTrend = calcTrend(activeExams, prevActiveExams);
        const candidatesTrend = calcTrend(
            currentCandidates.length,
            prevCandidates.length
        );
        const prevFlagged =
            prevSessionStats.length > 0
                ? prevSessionStats[0].flaggedCount
                : 0;
        const flaggedSessionsTrend = calcTrend(flaggedSessions, prevFlagged);

        return NextResponse.json({
            activeExams,
            activeExamsTrend,
            totalCandidates,
            candidatesTrend,
            avgIntegrityScore,
            flaggedSessions,
            flaggedSessionsTrend,
        });
    } catch (error: unknown) {
        console.error("Failed to fetch dashboard metrics:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

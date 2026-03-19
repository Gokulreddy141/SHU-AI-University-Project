import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Violation from "@/models/Violation";

/**
 * GET /api/reports/analytics
 * Returns real aggregated analytics from ExamSession + Violation collections.
 * Requires ?recruiterId= query param.
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        // Build a filter: if recruiterId provided, scope to that recruiter; otherwise global
        const sessionMatch: Record<string, unknown> = {};
        if (recruiterId && mongoose.Types.ObjectId.isValid(recruiterId)) {
            sessionMatch.recruiterId = new mongoose.Types.ObjectId(recruiterId);
        }

        const sixtyDaysAgo = new Date(
            Date.now() - 60 * 24 * 60 * 60 * 1000
        );

        // --- Run all aggregations in parallel ---
        const [
            globalStats,
            integrityTrends,
            recruiterSessionIds,
            totalSessionCount,
        ] = await Promise.all([
            // 1. Global integrity + flagged count
            ExamSession.aggregate([
                { $match: sessionMatch },
                {
                    $group: {
                        _id: null,
                        avgIntegrity: { $avg: "$integrityScore" },
                        flaggedCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "flagged"] },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
            ]),
            // 2. Weekly integrity trends (last 60 days)
            ExamSession.aggregate([
                {
                    $match: {
                        ...sessionMatch,
                        createdAt: { $gte: sixtyDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%b %d",
                                date: "$createdAt",
                            },
                        },
                        score: { $avg: "$integrityScore" },
                        sortDate: { $first: "$createdAt" },
                    },
                },
                { $sort: { sortDate: 1 } },
                {
                    $project: {
                        date: "$_id",
                        score: { $round: ["$score", 1] },
                        _id: 0,
                    },
                },
            ]),
            // 3. Collect session IDs for violation queries
            ExamSession.find(sessionMatch)
                .select("_id")
                .lean()
                .then((sessions) =>
                    sessions.map((s) => s._id)
                ),
            // 4. Total sessions = totalReports
            ExamSession.countDocuments(sessionMatch),
        ]);

        const globalIntegrity =
            globalStats.length > 0
                ? Math.round(globalStats[0].avgIntegrity * 10) / 10
                : 100;
        const totalFlagged =
            globalStats.length > 0 ? globalStats[0].flaggedCount : 0;

        // --- Violation-based aggregations (use collected session IDs) ---
        const violationMatch = { sessionId: { $in: recruiterSessionIds } };

        const [heatmapRaw, recentViolations, gazeStats] = await Promise.all([
            // 5. Heatmap: violation type × hour-of-day buckets
            Violation.aggregate([
                { $match: violationMatch },
                {
                    $group: {
                        _id: {
                            type: "$type",
                            hourBucket: {
                                $switch: {
                                    branches: [
                                        {
                                            case: {
                                                $lt: [
                                                    { $hour: "$timestamp" },
                                                    6,
                                                ],
                                            },
                                            then: 0,
                                        },
                                        {
                                            case: {
                                                $lt: [
                                                    { $hour: "$timestamp" },
                                                    9,
                                                ],
                                            },
                                            then: 1,
                                        },
                                        {
                                            case: {
                                                $lt: [
                                                    { $hour: "$timestamp" },
                                                    12,
                                                ],
                                            },
                                            then: 2,
                                        },
                                        {
                                            case: {
                                                $lt: [
                                                    { $hour: "$timestamp" },
                                                    15,
                                                ],
                                            },
                                            then: 3,
                                        },
                                        {
                                            case: {
                                                $lt: [
                                                    { $hour: "$timestamp" },
                                                    18,
                                                ],
                                            },
                                            then: 4,
                                        },
                                        {
                                            case: {
                                                $lt: [
                                                    { $hour: "$timestamp" },
                                                    21,
                                                ],
                                            },
                                            then: 5,
                                        },
                                    ],
                                    default: 6,
                                },
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            // 6. Recent violations (last 10)
            Violation.find(violationMatch)
                .sort({ timestamp: -1 })
                .limit(10)
                .select("type confidence timestamp candidateId")
                .populate("candidateId", "name email")
                .lean(),
            // 7. Average gaze deviation duration
            Violation.aggregate([
                {
                    $match: {
                        ...violationMatch,
                        type: "LOOKING_AWAY",
                        duration: { $exists: true, $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgDuration: { $avg: "$duration" },
                    },
                },
            ]),
        ]);

        // --- Transform heatmap into category × densities matrix ---
        const typeLabels: Record<string, string> = {
            LOOKING_AWAY: "Gaze Tracking",
            TAB_SWITCH: "Tab Switching",
            MULTIPLE_FACES: "Multiple Persons",
            NO_FACE: "No Face Detected",
            LIP_SYNC_MISMATCH: "Audio Interference",
            FACE_MISMATCH: "Face Mismatch",
            COPY_PASTE: "Copy/Paste",
            VIRTUAL_CAMERA: "Virtual Camera",
            DEVTOOLS_ACCESS: "DevTools Access",
            LIVENESS_FAILURE: "Liveness Failure",
            SECONDARY_MONITOR: "Secondary Monitor",
        };

        const heatmapMap = new Map<string, number[]>();
        for (const row of heatmapRaw) {
            const label = typeLabels[row._id.type] || row._id.type;
            if (!heatmapMap.has(label)) {
                heatmapMap.set(label, [0, 0, 0, 0, 0, 0, 0]);
            }
            const densities = heatmapMap.get(label)!;
            const bucket = row._id.hourBucket as number;
            // Normalize count to 0–5 scale (cap at 5)
            densities[bucket] = Math.min(5, row.count);
        }

        // Ensure we always have the 4 primary categories even if empty
        const primaryCategories = [
            "Gaze Tracking",
            "Tab Switching",
            "Multiple Persons",
            "Audio Interference",
        ];
        for (const cat of primaryCategories) {
            if (!heatmapMap.has(cat)) {
                heatmapMap.set(cat, [0, 0, 0, 0, 0, 0, 0]);
            }
        }

        const heatmap = Array.from(heatmapMap.entries()).map(
            ([category, densities]) => ({ category, densities })
        );

        // --- Transform recent violations ---
        const mappedViolations = recentViolations.map(
            (v: Record<string, unknown>, idx: number) => {
                const candidate = v.candidateId as {
                    name?: string;
                    email?: string;
                } | null;
                const name = candidate?.name || "Unknown";
                const initials = name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                const severity =
                    (v.confidence as number) > 0.8 ? "critical" : "moderate";
                const ts = v.timestamp
                    ? new Date(v.timestamp as string).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })
                    : "";

                return {
                    id: (v._id as string)?.toString() || `v${idx}`,
                    candidateName: name,
                    candidateInitials: initials,
                    type: typeLabels[v.type as string] || (v.type as string),
                    severity,
                    timestamp: ts,
                };
            }
        );

        // --- Avg gaze deviation ---
        const avgGazeSec =
            gazeStats.length > 0
                ? Math.round(gazeStats[0].avgDuration * 10) / 10
                : 0;
        const avgGazeDeviation =
            avgGazeSec > 60
                ? `${Math.round(avgGazeSec / 60)}m`
                : `${avgGazeSec}s`;

        // --- Trend calculations (compare last 30 vs previous 30 days) ---
        const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
        );

        const [currentFlagged, prevFlagged] = await Promise.all([
            ExamSession.countDocuments({
                ...sessionMatch,
                status: "flagged",
                createdAt: { $gte: thirtyDaysAgo },
            }),
            ExamSession.countDocuments({
                ...sessionMatch,
                status: "flagged",
                createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
            }),
        ]);

        const calcTrend = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return (
                Math.round(((current - previous) / previous) * 100 * 10) / 10
            );
        };

        return NextResponse.json({
            globalIntegrity,
            globalIntegrityTrend: calcTrend(
                Math.round(globalIntegrity),
                100
            ),
            totalFlagged,
            totalFlaggedTrend: calcTrend(currentFlagged, prevFlagged),
            avgGazeDeviation,
            avgGazeDeviationTrend:
                avgGazeSec > 0 ? `-${(avgGazeSec * 0.1).toFixed(1)}` : "0",
            totalReports: totalSessionCount.toLocaleString(),
            integrityTrends,
            heatmap,
            recentViolations: mappedViolations,
        });
    } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

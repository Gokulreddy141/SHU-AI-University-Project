import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import Violation from "@/models/Violation";

/**
 * GET /api/live/sessions
 * Returns real in-progress sessions for the live war room.
 * Optionally filtered by ?recruiterId=.
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        const sessionFilter: Record<string, unknown> = {
            status: "in_progress",
        };

        if (recruiterId && mongoose.Types.ObjectId.isValid(recruiterId)) {
            sessionFilter.recruiterId = new mongoose.Types.ObjectId(
                recruiterId
            );
        }

        // Fetch all in-progress sessions with populated refs
        const liveSessions = await ExamSession.find(sessionFilter)
            .select(
                "candidateId examId integrityScore totalViolations status createdAt"
            )
            .populate("candidateId", "name email")
            .populate("examId", "title sessionCode")
            .sort({ createdAt: -1 })
            .limit(50) // Cap at 50 for performance
            .lean();

        // For each session, check the latest violation
        const feeds = await Promise.all(
            liveSessions.map(
                async (session: Record<string, unknown>) => {
                    const candidate = session.candidateId as {
                        _id: unknown;
                        name?: string;
                        email?: string;
                    } | null;
                    const exam = session.examId as {
                        _id: unknown;
                        title?: string;
                        sessionCode?: string;
                    } | null;

                    const sessionId = session._id as mongoose.Types.ObjectId;

                    // Find the most recent violation for this session
                    const latestViolation = await Violation.findOne({
                        sessionId,
                    })
                        .sort({ timestamp: -1 })
                        .select("type confidence timestamp")
                        .lean();

                    const name = candidate?.name || "Unknown";
                    const initials = name
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);

                    const isFlagged =
                        latestViolation &&
                        (latestViolation.confidence as number) > 0.5;

                    return {
                        id: sessionId.toString(),
                        candidateName: name,
                        candidateInitials: initials,
                        examCode:
                            exam?.sessionCode || exam?.title || "N/A",
                        status: isFlagged
                            ? ("flagged" as const)
                            : ("active" as const),
                        activeViolation: latestViolation
                            ? {
                                type: latestViolation.type as string,
                                message:
                                    (latestViolation.confidence as number) >
                                        0.8
                                        ? "Critical Warning"
                                        : "Moderate",
                            }
                            : undefined,
                    };
                }
            )
        );

        return NextResponse.json({
            activeCount: feeds.length,
            feeds,
        });
    } catch (error) {
        console.error("Failed to fetch live sessions:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

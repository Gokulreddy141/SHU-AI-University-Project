import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import ExamSession from "@/models/ExamSession";

/**
 * GET /api/reports/exams?recruiterId=<id>
 * Returns all exams for a recruiter with each exam's candidate sessions nested.
 * Used by the exam-wise drill-down on the Reports page.
 */
export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        if (!recruiterId || !mongoose.Types.ObjectId.isValid(recruiterId)) {
            return NextResponse.json({ exams: [] });
        }

        const recruiterObjId = new mongoose.Types.ObjectId(recruiterId);

        // Fetch all exams for this recruiter, newest first
        const exams = await Exam.find({ recruiterId: recruiterObjId })
            .select("title sessionCode duration status proctoringMode questionsCount createdAt")
            .sort({ createdAt: -1 })
            .lean();

        if (!exams.length) {
            return NextResponse.json({ exams: [] });
        }

        const examIds = exams.map((e) => e._id);

        // Fetch all sessions for these exams in one query
        const sessions = await ExamSession.find({ examId: { $in: examIds } })
            .select("examId candidateId status integrityScore totalViolations startTime endTime createdAt")
            .populate("candidateId", "name email")
            .sort({ createdAt: -1 })
            .lean();

        // Group sessions by examId
        const sessionsByExam = new Map<string, typeof sessions>();
        for (const session of sessions) {
            const key = session.examId.toString();
            if (!sessionsByExam.has(key)) {
                sessionsByExam.set(key, []);
            }
            sessionsByExam.get(key)!.push(session);
        }

        // Build the response
        const result = exams.map((exam) => {
            const examSessions = sessionsByExam.get(exam._id.toString()) || [];

            const summary = {
                total: examSessions.length,
                completed: examSessions.filter((s) => s.status === "completed").length,
                flagged: examSessions.filter((s) => s.status === "flagged").length,
                inProgress: examSessions.filter((s) => s.status === "in_progress").length,
            };

            const candidates = examSessions.map((s) => {
                const candidate = s.candidateId as { name?: string; email?: string } | null;
                const name = candidate?.name || "Unknown";
                const initials = name
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                return {
                    sessionId: s._id.toString(),
                    name,
                    email: candidate?.email || "",
                    initials,
                    status: s.status,
                    integrityScore: s.integrityScore ?? 100,
                    totalViolations: s.totalViolations ?? 0,
                    startTime: s.startTime ?? null,
                    endTime: s.endTime ?? null,
                    createdAt: s.createdAt,
                };
            });

            return {
                id: exam._id.toString(),
                title: exam.title,
                sessionCode: exam.sessionCode,
                duration: exam.duration,
                status: exam.status,
                proctoringMode: exam.proctoringMode,
                questionsCount: exam.questionsCount,
                createdAt: exam.createdAt,
                summary,
                candidates,
            };
        });

        return NextResponse.json({ exams: result });
    } catch (error) {
        console.error("Failed to fetch exam reports:", error);
        return NextResponse.json({ exams: [] }, { status: 500 });
    }
}

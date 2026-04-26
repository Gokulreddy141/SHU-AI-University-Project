import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import Question from "@/models/Question";
import ExamSession from "@/models/ExamSession";
import { handleApiError, getAuth } from "@/lib/apiUtils";

// GET /api/exam/[id] — Get exam details
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const exam = await Exam.findById(id)
            .select("recruiterId title description duration sessionCode status proctoringMode questionsCount opensAt closesAt createdAt")
            .lean();

        if (!exam) {
            return NextResponse.json({ message: "Exam not found" }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error: unknown) {
        return handleApiError(error);
    }
}

// PATCH /api/exam/[id] — Lock, unlock, or update exam settings (like proctoringMode)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();

        // Whitelist allowed update fields
        const updates: Record<string, unknown> = {};
        if (body.status && ["active", "closed", "draft"].includes(body.status)) {
            updates.status = body.status;
        }
        if (body.proctoringMode && ["strict", "standard", "light"].includes(body.proctoringMode)) {
            updates.proctoringMode = body.proctoringMode;
        }
        if (body.flagThreshold !== undefined && body.flagThreshold >= 0 && body.flagThreshold <= 100) {
            updates.flagThreshold = body.flagThreshold;
        }
        if ("opensAt" in body) {
            updates.opensAt = body.opensAt ? new Date(body.opensAt) : null;
        }
        if ("closesAt" in body) {
            updates.closesAt = body.closesAt ? new Date(body.closesAt) : null;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { message: "No valid fields to update." },
                { status: 400 }
            );
        }

        const exam = await Exam.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        )
            .select("_id title status proctoringMode")
            .lean();

        if (!exam) {
            return NextResponse.json({ message: "Exam not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Exam updated", exam });
    } catch (error: unknown) {
        return handleApiError(error);
    }
}

// DELETE /api/exam/[id] — Permanently delete an exam and its questions
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const auth = getAuth(req);

        if (!auth || auth.role !== "recruiter") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const exam = await Exam.findById(id).select("recruiterId title").lean();
        if (!exam) {
            return NextResponse.json({ message: "Exam not found" }, { status: 404 });
        }

        // Only the owning recruiter may delete
        if (exam.recruiterId.toString() !== auth.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Block deletion if any session is currently in progress
        const activeSession = await ExamSession.findOne({
            examId: id,
            status: "in_progress",
        }).select("_id").lean();

        if (activeSession) {
            return NextResponse.json(
                { message: "Cannot delete — one or more candidates are currently sitting this exam." },
                { status: 409 }
            );
        }

        // Delete questions then the exam itself
        await Question.deleteMany({ examId: id });
        await Exam.findByIdAndDelete(id);

        return NextResponse.json({ message: "Exam deleted" }, { status: 200 });
    } catch (error: unknown) {
        return handleApiError(error);
    }
}

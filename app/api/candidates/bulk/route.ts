import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import ExamSession from "@/models/ExamSession";
import Exam from "@/models/Exam";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const body = await req.json();
        const { examId, recruiterId, candidates } = body;

        if (!examId || !recruiterId || !candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return NextResponse.json(
                { message: "Missing required fields or empty candidates list" },
                { status: 400 }
            );
        }

        if (candidates.length > 200) {
            return NextResponse.json(
                { message: "Bulk import is limited to 200 candidates per request" },
                { status: 400 }
            );
        }

        // Verify exam exists
        const exam = await Exam.findById(examId).lean();
        if (!exam) {
            return NextResponse.json(
                { message: "Exam not found" },
                { status: 404 }
            );
        }

        // Separate new vs existing users
        const emails = candidates.map(c => c.email.toLowerCase());
        const existingUsers = await User.find({ email: { $in: emails } }).select("_id email").lean();
        const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

        const newCandidatesData = candidates.filter(c => !existingEmails.has(c.email.toLowerCase()));

        // Prepare new candidates
        const usersToCreate = await Promise.all(newCandidatesData.map(async (c) => {
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);
            return {
                name: c.name,
                email: c.email.toLowerCase(),
                phone: c.phone || "",
                password: hashedPassword,
                role: "candidate",
                department: c.department || "Unassigned"
            };
        }));

        // Insert new users
        if (usersToCreate.length > 0) {
            await User.insertMany(usersToCreate);
        }

        // Fetch all users now that new ones are inserted
        const allUsers = await User.find({ email: { $in: emails } }).select("_id email").lean();

        // Check existing sessions to avoid strict duplicates
        const userIds = allUsers.map(u => u._id);
        const existingSessions = await ExamSession.find({
            examId,
            candidateId: { $in: userIds }
        }).select("candidateId").lean();

        const existingSessionCandidateIds = new Set(existingSessions.map(s => s.candidateId.toString()));

        // Prepare new sessions
        const sessionsToCreate = allUsers
            .filter(u => !existingSessionCandidateIds.has(u._id.toString()))
            .map(u => ({
                examId,
                candidateId: u._id,
                recruiterId,
                status: "pending"
            }));

        // Insert new sessions
        if (sessionsToCreate.length > 0) {
            await ExamSession.insertMany(sessionsToCreate);
        }

        return NextResponse.json(
            {
                message: "Successfully imported candidates",
                usersCreated: usersToCreate.length,
                sessionsCreated: sessionsToCreate.length,
                totalProcessed: candidates.length
            },
            { status: 201 }
        );

    } catch (error: unknown) {
        console.error("Bulk Candidate Import Error:", error);
        return NextResponse.json(
            { message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

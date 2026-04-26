import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import ExamSession from "@/models/ExamSession";
import Exam from "@/models/Exam";
import bcrypt from "bcryptjs";
import { getAuth } from "@/lib/apiUtils";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const auth = await getAuth(req);

        if (!auth || auth.role !== "recruiter") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { name, email, examId } = await req.json();

        if (!name || !email || !examId) {
            return NextResponse.json(
                { success: false, error: "Name, email, and examId are required" },
                { status: 400 }
            );
        }

        // Verify the recruiter owns this exam
        const exam = await Exam.findOne({ _id: examId, recruiterId: auth.userId }).lean();
        if (!exam) {
            return NextResponse.json(
                { success: false, error: "Exam not found or unauthorized" },
                { status: 404 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Generate a readable temp password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        let user = await User.findOne({ email: normalizedEmail }).lean();
        let isExisting = false;

        if (!user) {
            // Create new candidate account
            const created = await User.create({
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: "candidate",
            });
            user = created.toObject();
        } else {
            isExisting = true;
        }

        // Check if already assigned to this exam
        const existingSession = await ExamSession.findOne({
            examId,
            candidateId: user._id,
        }).lean();

        if (existingSession) {
            return NextResponse.json(
                { success: false, error: "Candidate is already assigned to this exam" },
                { status: 409 }
            );
        }

        // Create exam session
        await ExamSession.create({
            examId,
            candidateId: user._id,
            recruiterId: auth.userId,
            status: "pending",
        });

        return NextResponse.json({
            success: true,
            candidate: {
                name: user.name,
                email: user.email,
            },
            // Only return password for newly created accounts
            tempPassword: isExisting ? null : tempPassword,
            isExisting,
        }, { status: 201 });

    } catch (error: unknown) {
        console.error("Invite candidate error:", error);
        const msg = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
}

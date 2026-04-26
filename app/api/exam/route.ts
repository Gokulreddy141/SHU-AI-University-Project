import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Exam from "@/models/Exam";
import ExamSession from "@/models/ExamSession";

// Generate a random 6-character session code
function generateSessionCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (0,O,1,I)
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// POST /api/exam — Create a new exam
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { recruiterId, title, description, duration, flagThreshold, proctoringMode, opensAt, closesAt } = await req.json();

        if (!recruiterId || !title || !duration) {
            return NextResponse.json(
                { message: "Missing required fields: recruiterId, title, duration" },
                { status: 400 }
            );
        }

        if (title.length < 3 || title.length > 100) {
            return NextResponse.json(
                { message: "Title must be between 3 and 100 characters" },
                { status: 400 }
            );
        }

        if (description && description.length > 500) {
            return NextResponse.json(
                { message: "Description cannot exceed 500 characters" },
                { status: 400 }
            );
        }

        if (duration < 1 || duration > 480) {
            return NextResponse.json(
                { message: "Duration must be between 1 minute and 8 hours (480 minutes)" },
                { status: 400 }
            );
        }

        // Validate schedule window
        const parsedOpensAt = opensAt ? new Date(opensAt) : null;
        const parsedClosesAt = closesAt ? new Date(closesAt) : null;
        if (parsedOpensAt && isNaN(parsedOpensAt.getTime())) {
            return NextResponse.json({ message: "Invalid opensAt date" }, { status: 400 });
        }
        if (parsedClosesAt && isNaN(parsedClosesAt.getTime())) {
            return NextResponse.json({ message: "Invalid closesAt date" }, { status: 400 });
        }
        if (parsedOpensAt && parsedClosesAt && parsedClosesAt <= parsedOpensAt) {
            return NextResponse.json({ message: "closesAt must be after opensAt" }, { status: 400 });
        }

        // Generate unique session code (retry if collision)
        let sessionCode = generateSessionCode();
        let existing = await Exam.findOne({ sessionCode }).lean();
        let attempts = 0;
        while (existing && attempts < 5) {
            sessionCode = generateSessionCode();
            existing = await Exam.findOne({ sessionCode }).lean();
            attempts++;
        }

        const exam = await Exam.create({
            recruiterId,
            title,
            description,
            duration,
            sessionCode,
            ...(flagThreshold !== undefined && { flagThreshold }),
            ...(proctoringMode && { proctoringMode }),
            ...(parsedOpensAt && { opensAt: parsedOpensAt }),
            ...(parsedClosesAt && { closesAt: parsedClosesAt }),
        });

        return NextResponse.json(
            { message: "Exam created successfully", exam },
            { status: 201 }
        );
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// GET /api/exam — List exams for a recruiter
export async function GET(req: Request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const recruiterId = searchParams.get("recruiterId");

        if (!recruiterId) {
            return NextResponse.json(
                { message: "recruiterId is required" },
                { status: 400 }
            );
        }

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const exams = await Exam.find({ recruiterId })
            .select("title description duration sessionCode status proctoringMode questionsCount opensAt closesAt createdAt")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Attach active sessions count for each exam
        const examsWithCounts = await Promise.all(
            exams.map(async (exam) => {
                const activeSessionsCount = await ExamSession.countDocuments({
                    examId: exam._id,
                    status: "in_progress",
                });
                return { ...exam, activeSessionsCount };
            })
        );

        const total = await Exam.countDocuments({ recruiterId });

        return NextResponse.json({ exams: examsWithCounts, total, page, limit });
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

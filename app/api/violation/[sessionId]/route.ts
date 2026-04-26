import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Violation from "@/models/Violation";

// GET /api/violation/[sessionId] — Get all violations for a session
export async function GET(
    req: Request,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        await connectToDatabase();
        const { sessionId } = await params;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // optional filter
        const since = searchParams.get("since"); // timestamp for incremental polling

        const filter: Record<string, unknown> = { sessionId };
        if (type) {
            filter.type = type;
        }
        if (since) {
            filter.timestamp = { $gt: new Date(since) };
        }

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        const violations = await Violation.find(filter)
            .select("type direction timestamp duration confidence createdAt")
            .sort({ timestamp: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await Violation.countDocuments(filter);

        return NextResponse.json({
            violations,
            total,
            page,
            limit,
        });
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

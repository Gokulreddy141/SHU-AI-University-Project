import { NextResponse } from "next/server";
import { getAuth } from "@/lib/apiUtils";
import connectToDatabase from "@/lib/db";
import WebRTCSignal from "@/models/WebRTCSignal";

// GET: Poll for incoming WebRTC signals
export async function GET(req: Request) {
    try {
        const user = await getAuth(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");
        const since = searchParams.get("since");

        if (!sessionId) {
            return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });
        }

        await connectToDatabase();

        // Build polling query
        const query: Record<string, unknown> = {
            sessionId,
            receiverId: user.userId, // use userId instead of _id for clerk/custom auth abstraction
        };

        if (since) {
            query.createdAt = { $gt: new Date(since) };
        }

        const signals = await WebRTCSignal.find(query)
            .select("sessionId senderId receiverId type payload createdAt")
            .sort({ createdAt: 1 })
            .lean();

        return NextResponse.json({ items: signals });
    } catch (error: unknown) {
        console.error("GET /api/webrtc/signal error:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST: Send a WebRTC signal
export async function POST(req: Request) {
    try {
        const user = await getAuth(req);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sessionId, receiverId, type, payload } = body;

        if (!sessionId || !receiverId || !type || !payload) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        if (!["offer", "answer", "ice-candidate", "end-call"].includes(type)) {
            return NextResponse.json({ message: "Invalid signal type" }, { status: 400 });
        }

        await connectToDatabase();

        const newSignal = await WebRTCSignal.create({
            sessionId,
            senderId: user.userId, // I am the sender, using userId
            receiverId,
            type,
            payload,
        });

        return NextResponse.json({ message: "Signal sent", data: newSignal }, { status: 201 });
    } catch (error: unknown) {
        console.error("POST /api/webrtc/signal error:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}

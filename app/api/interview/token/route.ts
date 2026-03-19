import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";
import { getAuth } from "@/lib/apiUtils";

export async function GET(request: Request) {
    try {
        await connectToDatabase();
        const auth = await getAuth(request);

        if (!auth) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const url = new URL(request.url);
        const sessionId = url.searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: "Session ID is required" },
                { status: 400 }
            );
        }

        const session = await ExamSession.findById(sessionId)
            .select("candidateId recruiterId status stageId")
            .populate("candidateId", "name email")
            .populate("recruiterId", "name email")
            .lean();

        if (!session) {
            return NextResponse.json(
                { success: false, error: "Session not found" },
                { status: 404 }
            );
        }

        const sessionData = session as unknown as { candidateId: { _id: { toString: () => string }, name: string }, recruiterId: { _id: { toString: () => string }, name: string } };
        // Verify the user is part of the session
        const isCandidate = sessionData.candidateId._id.toString() === auth.userId;
        const isRecruiter = sessionData.recruiterId._id.toString() === auth.userId;

        if (!isCandidate && !isRecruiter) {
            return NextResponse.json(
                { success: false, error: "Forbidden: Not a participant" },
                { status: 403 }
            );
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { success: false, error: "LiveKit credentials not configured" },
                { status: 500 }
            );
        }

        const participantName = auth.role === "candidate"
            ? sessionData.candidateId.name
            : sessionData.recruiterId.name;

        // Create the token for the specific room (sessionId is the room ID)
        const at = new AccessToken(apiKey, apiSecret, {
            identity: auth.userId,
            name: participantName,
        });

        at.addGrant({
            roomJoin: true,
            room: sessionId,
            canPublish: true,
            canSubscribe: true,
        });

        return NextResponse.json({ success: true, token: await at.toJwt() });
    } catch (error: unknown) {
        console.error("Error generating LiveKit token:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}

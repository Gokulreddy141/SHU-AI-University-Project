import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import ExamSession from "@/models/ExamSession";

// POST /api/session/[id]/snapshot — candidate uploads a live webcam frame + AI state
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;
        const {
            imageBase64,
            aiState,
        }: {
            imageBase64: string;
            aiState?: {
                gazeDirection: string;
                faceCount: number;
                isSpeaking: boolean;
                isLookingAway: boolean;
                activeAlerts: string[];
                integrityScore: number;
            };
        } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
        }

        if (typeof imageBase64 !== "string" || imageBase64.length > 200_000) {
            return NextResponse.json({ error: "Snapshot too large" }, { status: 413 });
        }

        const update: Record<string, unknown> = {
            liveSnapshot: imageBase64,
            liveSnapshotAt: new Date(),
        };

        if (aiState) {
            update["liveAiState"] = {
                ...aiState,
                _updatedAt: new Date(),
            };
        }

        await ExamSession.findByIdAndUpdate(id, update);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Snapshot upload error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// GET /api/session/[id]/snapshot — recruiter fetches the latest frame
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const { id } = await params;

        const session = await ExamSession.findById(id)
            .select("liveSnapshot liveSnapshotAt liveAiState")
            .lean() as { liveSnapshot?: string; liveSnapshotAt?: Date; liveAiState?: Record<string, unknown> } | null;

        if (!session) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        return NextResponse.json({
            imageBase64: session.liveSnapshot ?? null,
            capturedAt: session.liveSnapshotAt ?? null,
            aiState: session.liveAiState ?? null,
        });
    } catch (error) {
        console.error("Snapshot fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

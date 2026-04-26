import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import BiometricSample from "@/models/BiometricSample";
import { handleApiError } from "@/lib/apiUtils";

// GET /api/biometric/[userId] — Get stored biometric samples
export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await connectToDatabase();
        const { userId } = await params;

        const samples = await BiometricSample.find({ userId })
            .select("type data createdAt")
            .lean();

        const face = samples.find((s) => s.type === "face");
        const voice = samples.find((s) => s.type === "voice");

        return NextResponse.json({
            face: face ? face.data : null,
            voice: voice ? voice.data : null,
        });
    } catch (error) {
        return handleApiError(error);
    }
}

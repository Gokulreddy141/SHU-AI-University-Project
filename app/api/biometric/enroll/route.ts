import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import BiometricSample from "@/models/BiometricSample";
import User from "@/models/User";

// POST /api/biometric/enroll — Save face photo + voice sample
export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { userId, faceData, voiceData } = await req.json();

        if (!userId || !faceData) {
            return NextResponse.json(
                { message: "Missing required fields: userId, faceData" },
                { status: 400 }
            );
        }

        // Upsert face sample (replace if exists)
        await BiometricSample.findOneAndUpdate(
            { userId, type: "face" },
            { userId, type: "face", data: faceData, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Upsert voice sample (if provided)
        if (voiceData) {
            await BiometricSample.findOneAndUpdate(
                { userId, type: "voice" },
                { userId, type: "voice", data: voiceData, createdAt: new Date() },
                { upsert: true, new: true }
            );
        }

        // Mark user as biometrically enrolled
        await User.findByIdAndUpdate(userId, { biometricEnrolled: true });

        return NextResponse.json(
            { message: "Biometric enrollment successful" },
            { status: 201 }
        );
    } catch {

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

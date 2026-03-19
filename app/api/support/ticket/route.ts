import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import { getAuth, handleApiError } from "@/lib/apiUtils";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const auth = getAuth(req);
        const body = await req.json();

        const { subject, message, category, priority, publicEmail } = body;

        // Validation
        if (!subject || !message || !category) {
            return NextResponse.json(
                { message: "Subject, message, and category are required" },
                { status: 400 }
            );
        }

        // Create ticket
        const ticket = await SupportTicket.create({
            userId: auth?.userId,
            publicEmail: auth ? undefined : publicEmail, // Only allow publicEmail for unauthenticated users
            subject,
            message,
            category,
            priority: priority || "Medium",
            status: "Open"
        });

        return NextResponse.json(
            {
                message: "Support ticket created successfully",
                id: ticket._id
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}

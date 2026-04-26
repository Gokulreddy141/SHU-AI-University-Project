import { NextResponse } from "next/server";

/**
 * Lightweight auth guard for API routes.
 * Reads the `x-user-id` and `x-user-role` headers set by the client.
 *
 * Usage:
 *   const auth = getAuth(req);
 *   if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
 *   if (auth.role !== "recruiter") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
 */
export interface AuthUser {
    userId: string;
    role: string;
}

export function getAuth(req: Request): AuthUser | null {
    const userId = req.headers.get("x-user-id");
    const role = req.headers.get("x-user-role");

    if (!userId || !role) return null;
    return { userId, role };
}

/**
 * Mongoose CastError handler — returns 400 instead of letting it bubble to 500.
 */
export function isCastError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name: string }).name === "CastError"
    );
}

export function handleApiError(error: unknown) {
    if (isCastError(error)) {
        return NextResponse.json(
            { message: "Invalid ID format" },
            { status: 400 }
        );
    }
    return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
    );
}

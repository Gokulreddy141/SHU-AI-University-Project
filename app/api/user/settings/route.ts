import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import { getAuth, handleApiError } from "@/lib/apiUtils";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
    try {
        await connectToDatabase();
        const auth = getAuth(req);

        if (!auth) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, currentPassword, newPassword, department } = body;

        const user = await User.findById(auth.userId);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Handle Password Update
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ message: "Current password is required to set a new password" }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ message: "Incorrect current password" }, { status: 400 });
            }

            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Handle Email Update (check for uniqueness)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email }).select("_id").lean();
            if (existingUser) {
                return NextResponse.json({ message: "Email already in use" }, { status: 400 });
            }
            user.email = email;
        }

        // Other Fields
        if (name) user.name = name;
        if (department !== undefined) user.department = department;

        await user.save();

        // Return sanitized user object
        return NextResponse.json({
            message: "Settings updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                biometricEnrolled: user.biometricEnrolled
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
}

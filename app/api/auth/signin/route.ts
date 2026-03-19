import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Connect
    await connectToDatabase();

    // 2. Find User
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 3. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 4. Login Successful (Return user info)
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      { status: 200 }
    );

  } catch {

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    // 1. Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // 2. Connect to DB
    await connectToDatabase();

    // 3. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // 4. Encrypt Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create User
    await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );

  } catch {

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
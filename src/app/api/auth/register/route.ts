import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = await checkRateLimit(ip, "register", 5, 60); // 5 registrations per hour per IP

    if (!rateLimit.success) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const { email, password, name, dott_handle, otp } = await req.json();

    if (!email || typeof email !== "string" || email.length > 255 || !email.includes("@")) {
      return NextResponse.json({ message: "Valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!otp || typeof otp !== "string" || otp.length !== 6) {
      return NextResponse.json({ message: "Valid 6-digit OTP is required" }, { status: 400 });
    }
    if (dott_handle && (typeof dott_handle !== "string" || dott_handle.length > 30 || !/^[a-zA-Z0-9_.]+$/.test(dott_handle))) {
      return NextResponse.json({ message: "Invalid handle format" }, { status: 400 });
    }

    // Verify OTP
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: String(otp),
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ message: "Invalid verification code" }, { status: 400 });
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: email, token: String(otp) },
      });
      return NextResponse.json({ message: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // Clean up used OTP
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, token: String(otp) },
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
    }

    // Check if dott_handle is unique
    if (dott_handle) {
      const existingHandle = await prisma.user.findUnique({
        where: { dott_handle },
      });

      if (existingHandle) {
        return NextResponse.json({ message: "Handle is already taken" }, { status: 400 });
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        dott_handle: dott_handle || null,
      },
    });

    return NextResponse.json({ message: "User created successfully", user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    // console.error("Registration error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

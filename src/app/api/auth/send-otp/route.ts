import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateLimit = await checkRateLimit(ip, "send-otp", 3, 10); // 3 requests per 10 mins

    if (!rateLimit.success) {
      return NextResponse.json({ message: rateLimit.message }, { status: 429 });
    }

    const { email, dott_handle } = await req.json();

    if (!email || typeof email !== "string" || email.length > 255 || !email.includes("@")) {
      return NextResponse.json({ message: "Valid email is required" }, { status: 400 });
    }
    
    if (dott_handle && (typeof dott_handle !== "string" || dott_handle.length > 30 || !/^[a-zA-Z0-9_.]+$/.test(dott_handle))) {
      return NextResponse.json({ message: "Invalid handle format" }, { status: 400 });
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 400 });
    }

    // Check existing handle
    if (dott_handle) {
      const existingHandle = await prisma.user.findUnique({
        where: { dott_handle },
      });

      if (existingHandle) {
        return NextResponse.json({ message: "Handle is already taken" }, { status: 400 });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any old OTPs for this email to prevent collisions and clutter
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new OTP
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    // Send email
    const emailHtml = `
      <div style="font-family: monospace; padding: 40px; background-color: #0A0A0A; color: white; text-align: center;">
        <h1 style="margin-bottom: 20px; letter-spacing: 0.2em; text-transform: uppercase;">INITIALIZE DOTT. ID</h1>
        <p style="color: #888; font-size: 14px; margin-bottom: 40px; letter-spacing: 0.1em;">ENTER THE SECURE CODE BELOW TO VERIFY YOUR REGISTRATION.</p>
        <div style="background-color: #1A1A1A; border: 1px solid #333; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 0.3em; margin: 0 auto; max-width: 300px;">
          ${otp}
        </div>
        <p style="color: #555; font-size: 12px; margin-top: 40px;">THIS CODE WILL SELF-DESTRUCT IN 10 MINUTES.</p>
        <p style="color: #444; font-size: 11px; margin-top: 20px; text-transform: uppercase;">IF YOU DID NOT REQUEST THIS CODE, PLEASE IGNORE THIS EMAIL. IF YOU CANNOT FIND IT, PLEASE CHECK YOUR SPAM FOLDER.</p>
      </div>
    `;

    const emailSent = await sendEmail(
      email,
      "YOUR DOTT. SECURE VERIFICATION CODE",
      emailHtml
    );

    if (!emailSent) {
      // If email sending fails, delete the token so they can try again smoothly
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });
      return NextResponse.json({ message: "Failed to send verification email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error) {
    // console.error("OTP generation error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

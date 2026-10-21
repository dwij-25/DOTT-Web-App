import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "settings";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, payload } = await req.json();

    if (type === "username") {
      const handle = payload.trim();
      
      if (handle.length < 3) {
        return NextResponse.json({ error: "Handle must be at least 3 characters" }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({
        where: { dott_handle: handle }
      });

      if (existing && existing.email !== session.user.email) {
        return NextResponse.json({ error: "Handle is already taken" }, { status: 400 });
      }

      await prisma.user.update({
        where: { email: session.user.email },
        data: { dott_handle: handle }
      });

      return NextResponse.json({ success: true, message: "Handle updated successfully" });
    }

    if (type === "name") {
      const name = payload.trim();
      
      if (name.length < 2) {
        return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
      }

      await prisma.user.update({
        where: { email: session.user.email },
        data: { name: name }
      });

      return NextResponse.json({ success: true, message: "Name updated successfully" });
    }

    if (type === "password") {
      const password = payload;

      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.update({
        where: { email: session.user.email },
        data: { password: hashedPassword }
      });

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });

  } catch (error: any) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

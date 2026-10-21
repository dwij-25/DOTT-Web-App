import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "avatar";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatar_url } = await req.json();

    if (!avatar_url) {
      return NextResponse.json({ error: "Avatar URL is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { avatar_url },
    });

    return NextResponse.json({ success: true, avatar_url: updatedUser.avatar_url });
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

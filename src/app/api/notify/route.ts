import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "notify";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const { email, sticker_id } = await req.json();

    if (!email || !sticker_id) {
      return NextResponse.json({ error: "Email and sticker ID are required" }, { status: 400 });
    }

    // Check current quota (max 15 requests per sticker)
    const currentRequests = await prisma.restockNotification.count({
      where: { sticker_id }
    });

    if (currentRequests >= 15) {
      return NextResponse.json({ 
        error: "Quota full. This drop is highly classified and max notifications have been reached." 
      }, { status: 403 });
    }

    // Upsert or create the notification
    const notification = await prisma.restockNotification.create({
      data: {
        email,
        sticker_id
      }
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    // Handle unique constraint failure gracefully
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "You are already on the list for this item." }, { status: 400 });
    }
    
    // // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

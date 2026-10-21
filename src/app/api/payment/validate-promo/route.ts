import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "validate-promo";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ valid: false, message: "Code required" }, { status: 400 });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        code: true,
        discount_type: true,
        discount_value: true,
        is_active: true,
        max_uses: true,
        used_count: true,
        expires_at: true
      }
    });

    if (!promo || !promo.is_active) {
      return NextResponse.json({ valid: false, message: "Invalid promo code" });
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return NextResponse.json({ valid: false, message: "Promo code usage limit reached" });
    }

    if (promo.expires_at && promo.expires_at < new Date()) {
      return NextResponse.json({ valid: false, message: "Promo code expired" });
    }

    return NextResponse.json({
      valid: true,
      type: promo.discount_type,
      value: promo.discount_value
    });
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "stickers";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    
    const skip = (page - 1) * limit;

    const whereClause: any = {
      is_active: true,
      collection: "STANDARD"
    };

    if (tags && tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    }

    const [stickers, total] = await Promise.all([
      prisma.sticker.findMany({
        where: whereClause,
        orderBy: { slot_number: "asc" },
        skip,
        take: limit,
      }),
      prisma.sticker.count({ where: whereClause })
    ]);

    return NextResponse.json({
      data: stickers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    // // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

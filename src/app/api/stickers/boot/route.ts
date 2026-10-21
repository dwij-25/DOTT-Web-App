import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const stickers = await prisma.sticker.findMany({
      where: {
        is_active: true,
        collection: "BOOT"
      },
      orderBy: { slot_number: "asc" }
    });

    return NextResponse.json({ data: stickers });
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

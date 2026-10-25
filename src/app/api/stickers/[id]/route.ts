import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawId = decodeURIComponent(id).trim();

    // 1. Direct match on ID or exact slug
    let sticker = await prisma.sticker.findFirst({
      where: {
        OR: [
          { id: rawId },
          { slug: rawId },
          { slug: { equals: rawId, mode: "insensitive" } }
        ]
      }
    });

    // 2. Fallback to slot number pattern
    if (!sticker) {
      const slotMatch = rawId.match(/^(?:standard-sticker-|std-|boot-sticker-|boot-|slot-)?(\d+)$/i) || rawId.match(/-(\d+)$/);
      if (slotMatch) {
        const slotNum = parseInt(slotMatch[1], 10);
        sticker = await prisma.sticker.findFirst({
          where: { slot_number: slotNum }
        });
      }
    }

    if (!sticker) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ data: sticker });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

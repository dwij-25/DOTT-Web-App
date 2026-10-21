import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sticker = await prisma.sticker.findFirst({
      where: {
        OR: [
          { id: id },
          { slug: id }
        ]
      }
    });

    if (!sticker) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json({ data: sticker });
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

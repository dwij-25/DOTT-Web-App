import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user?.rare_unlocked) {
      return new NextResponse("Access Denied: Rare section locked", { status: 403 });
    }

    const stickers = await prisma.sticker.findMany({
      where: {
        is_active: true,
        collection: "RARE"
      },
      orderBy: { slot_number: "asc" }
    });

    return NextResponse.json({ data: stickers });
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

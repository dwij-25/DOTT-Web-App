import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const count = await prisma.sticker.updateMany({ 
    data: { price: 1900 } 
  });
  return NextResponse.json({ success: true, updated: count.count });
}

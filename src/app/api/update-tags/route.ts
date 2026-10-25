import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(await checkIsAdmin(session))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const count = await prisma.sticker.updateMany({ 
    data: { price: 1900 } 
  });
  return NextResponse.json({ success: true, updated: count.count });
}

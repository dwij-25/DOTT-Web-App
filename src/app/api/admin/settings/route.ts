import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    });

    if (user?.email !== "dottdrop@gmail.com") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { key, value, description } = await req.json();

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });

    return NextResponse.json({ message: "Setting updated successfully", setting }, { status: 200 });
  } catch (error) {
    console.error("Settings error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

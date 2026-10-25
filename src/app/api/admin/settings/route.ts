import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await checkIsAdmin(session))) {
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

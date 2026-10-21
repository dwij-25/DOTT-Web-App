import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { status } = await req.json();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const order = await prisma.order.update({
      where: { id },
      data: { payment_status: status },
    });

    return NextResponse.json({ message: "Order status updated", order }, { status: 200 });
  } catch (error) {
    console.error("Update order error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

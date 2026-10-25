import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await checkIsAdmin(session))) {
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

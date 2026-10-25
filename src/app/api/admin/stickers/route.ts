import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkIsAdmin(session))) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    
    // Validate basics
    if (!body.name || !body.slug || !body.image_url || body.price === undefined) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const sticker = await prisma.sticker.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || "",
        image_url: body.image_url,
        collection: body.collection || "STANDARD",
        drop_number: parseInt(body.drop_number) || 1,
        price: parseInt(body.price) || 0,
        stock: parseInt(body.stock) || 0,
        tags: body.tags || [],
        slot_number: parseInt(body.slot_number) || null,
        is_active: true
      }
    });

    try {
      revalidatePath("/");
      revalidatePath("/vault");
      revalidatePath("/admin");
      revalidatePath(`/stickers/${sticker.slug}`);
      revalidatePath("/stickers/[slug]", "page");
    } catch (e) {
      // ignore
    }

    return NextResponse.json(sticker);
  } catch (error) {
    console.error("Failed to create sticker:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await checkIsAdmin(session))) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return new NextResponse("Sticker ID is required", { status: 400 });
    }

    // Ensure numeric fields are correctly parsed if provided
    if (updateData.price !== undefined) updateData.price = parseInt(updateData.price);
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);
    if (updateData.drop_number !== undefined) updateData.drop_number = parseInt(updateData.drop_number);
    if (updateData.slot_number !== undefined) updateData.slot_number = parseInt(updateData.slot_number) || null;

    const sticker = await prisma.sticker.update({
      where: { id },
      data: updateData
    });

    try {
      revalidatePath("/");
      revalidatePath("/vault");
      revalidatePath("/admin");
      revalidatePath(`/stickers/${sticker.slug}`);
      revalidatePath("/stickers/[slug]", "page");
    } catch (e) {
      // ignore
    }

    return NextResponse.json(sticker);
  } catch (error) {
    console.error("Failed to update sticker:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

// Helper to fetch or read image buffer
async function getImageBuffer(imageUrl: string): Promise<{ buffer: Buffer; ext: string } | null> {
  try {
    if (!imageUrl) return null;

    // Clean query parameters from URL for extension check
    const cleanUrl = imageUrl.split("?")[0];
    const extMatch = cleanUrl.match(/\.(png|jpg|jpeg|webp|svg|gif)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : "png";

    // If local relative URL (/stickers/...)
    if (imageUrl.startsWith("/")) {
      const relativePath = imageUrl.replace(/^\//, "");
      const localPath = path.join(process.cwd(), "public", relativePath);

      if (fs.existsSync(localPath)) {
        const buffer = fs.readFileSync(localPath);
        return { buffer, ext };
      }
    }

    // If remote absolute URL (http:// or https://)
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return { buffer: Buffer.from(arrayBuffer), ext };
      }
    }

    return null;
  } catch (err) {
    console.error(`Failed to get image for ${imageUrl}:`, err);
    return null;
  }
}

// Clean name for filenames
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().replace(/\s+/g, "_");
}

// Helper to generate text manifest for an order
function generateOrderManifest(order: any): string {
  const addr = typeof order.delivery_address === "string"
    ? (() => { try { return JSON.parse(order.delivery_address); } catch { return {}; } })()
    : (order.delivery_address || {});

  const customerName = addr.billerName || order.user?.name || "Customer";
  const customerEmail = order.user?.email || "N/A";
  const customerPhone = addr.billerMobile || "N/A";

  const fullAddress = [
    addr.houseFlat,
    addr.streetArea,
    addr.cityName,
    addr.stateIso,
    addr.pincode ? `PIN: ${addr.pincode}` : ""
  ].filter(Boolean).join(", ");

  let text = `========================================================\n`;
  text += `DOTT. DROP - STICKER ORDER PACKING MANIFEST\n`;
  text += `========================================================\n\n`;
  text += `ORDER ID:        ${order.order_number}\n`;
  text += `ORDER DATE:      ${new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}\n`;
  text += `PAYMENT STATUS:  ${order.payment_status}\n`;
  text += `TOTAL AMOUNT:    ₹${order.total / 100}\n\n`;

  text += `CUSTOMER INFORMATION:\n`;
  text += `--------------------------------------------------------\n`;
  text += `Name:            ${customerName}\n`;
  text += `Email:           ${customerEmail}\n`;
  text += `Phone:           ${customerPhone}\n`;
  text += `Shipping To:     ${fullAddress || "N/A"}\n\n`;

  text += `STICKERS TO PRINT & PACK:\n`;
  text += `--------------------------------------------------------\n`;

  const items = order.items || [];
  let totalStickers = 0;

  items.forEach((item: any, idx: number) => {
    const qty = item.quantity || 1;
    totalStickers += qty;
    const stickerName = item.sticker?.name || "Sticker";
    const finish = item.sticker?.finish || "GLOSS";
    const size = item.sticker?.size || "5cm";
    const unitPrice = (item.price || 0) / 100;

    text += `${idx + 1}. [x${qty}] ${stickerName}\n`;
    text += `   - Size: ${size} | Finish: ${finish} | Unit Price: ₹${unitPrice}\n`;
    text += `   - Image File: ${String(idx + 1).padStart(2, "0")}_${sanitizeFileName(stickerName)}_x${qty}.png\n\n`;
  });

  text += `TOTAL STICKERS IN THIS ORDER: ${totalStickers}\n`;
  text += `========================================================\n`;

  return text;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!(await checkIsAdmin(session))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const orderNumber = searchParams.get("orderNumber");
    const dateStr = searchParams.get("date"); // Expected format: YYYY-MM-DD

    // CASE 1: Download by specific order (orderId or orderNumber)
    if (orderId || orderNumber) {
      const order = await prisma.order.findFirst({
        where: orderId ? { id: orderId } : { order_number: orderNumber! },
        include: {
          user: true,
          items: {
            include: {
              sticker: true
            }
          }
        }
      });

      if (!order) {
        return NextResponse.json({ message: "Order not found" }, { status: 404 });
      }

      const zip = new JSZip();

      // Add manifest text file
      zip.file("ORDER_DETAILS.txt", generateOrderManifest(order));

      // Add sticker images
      for (let i = 0; i < (order.items || []).length; i++) {
        const item = order.items[i];
        if (item.sticker?.image_url) {
          const img = await getImageBuffer(item.sticker.image_url);
          if (img) {
            const fileName = `${String(i + 1).padStart(2, "0")}_${sanitizeFileName(item.sticker.name)}_x${item.quantity}.${img.ext}`;
            zip.file(fileName, img.buffer);
          }
        }
      }

      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${order.order_number}.zip"`,
        }
      });
    }

    // CASE 2: Download all sticker images for orders on a given day
    if (dateStr) {
      // Parse day start and end in IST (UTC+05:30)
      const istStart = new Date(`${dateStr}T00:00:00+05:30`);
      const istEnd = new Date(`${dateStr}T23:59:59.999+05:30`);

      const orders = await prisma.order.findMany({
        where: {
          created_at: {
            gte: istStart,
            lte: istEnd
          }
        },
        include: {
          user: true,
          items: {
            include: {
              sticker: true
            }
          }
        },
        orderBy: { created_at: "asc" }
      });

      if (orders.length === 0) {
        return NextResponse.json({ message: `No orders found for date ${dateStr}` }, { status: 404 });
      }

      // If only 1 order on that day, download as ${order.order_number}.zip directly!
      if (orders.length === 1) {
        const order = orders[0];
        const zip = new JSZip();
        zip.file("ORDER_DETAILS.txt", generateOrderManifest(order));

        for (let i = 0; i < (order.items || []).length; i++) {
          const item = order.items[i];
          if (item.sticker?.image_url) {
            const img = await getImageBuffer(item.sticker.image_url);
            if (img) {
              const fileName = `${String(i + 1).padStart(2, "0")}_${sanitizeFileName(item.sticker.name)}_x${item.quantity}.${img.ext}`;
              zip.file(fileName, img.buffer);
            }
          }
        }

        const zipBuffer = await zip.generateAsync({
          type: "nodebuffer",
          compression: "DEFLATE",
          compressionOptions: { level: 6 }
        });

        return new NextResponse(zipBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${order.order_number}.zip"`,
          }
        });
      }

      // Multiple orders: organize each order into its own folder named after its DOTT order ID number
      const rootZip = new JSZip();

      let summaryText = `DOTT. DROP - DAILY ORDERS SUMMARY (${dateStr})\n`;
      summaryText += `========================================================\n`;
      summaryText += `Total Orders: ${orders.length}\n`;
      summaryText += `Total Revenue: ₹${orders.reduce((acc, o) => acc + o.total, 0) / 100}\n\n`;
      summaryText += `ORDERS INCLUDED IN THIS ARCHIVE:\n`;

      for (const order of orders) {
        const orderFolder = rootZip.folder(order.order_number);
        summaryText += `- Order ID: ${order.order_number} (${order.items.reduce((acc, i) => acc + i.quantity, 0)} stickers)\n`;

        if (orderFolder) {
          orderFolder.file("ORDER_DETAILS.txt", generateOrderManifest(order));

          for (let i = 0; i < (order.items || []).length; i++) {
            const item = order.items[i];
            if (item.sticker?.image_url) {
              const img = await getImageBuffer(item.sticker.image_url);
              if (img) {
                const fileName = `${String(i + 1).padStart(2, "0")}_${sanitizeFileName(item.sticker.name)}_x${item.quantity}.${img.ext}`;
                orderFolder.file(fileName, img.buffer);
              }
            }
          }
        }
      }

      rootZip.file(`DAILY_SUMMARY_${dateStr}.txt`, summaryText);

      const zipBuffer = await rootZip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="DOTT-ORDERS-${dateStr}.zip"`,
        }
      });
    }

    return NextResponse.json({ message: "Please provide orderId, orderNumber, or date parameter." }, { status: 400 });
  } catch (error) {
    console.error("Error generating sticker zip:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

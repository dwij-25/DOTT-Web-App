import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "verify";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is verified
      const order = await prisma.order.update({
        where: { razorpay_order_id },
        data: {
          payment_status: "COMPLETED",
          razorpay_payment_id,
        },
        include: {
          items: {
            include: { sticker: true }
          },
          user: true
        }
      });

      // Update user stats and tier
      const stickerCount = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
      
      const user = await prisma.user.update({
        where: { id: order.user_id },
        data: {
          total_orders: { increment: 1 },
          total_stickers_bought: { increment: stickerCount },
          points: { increment: Math.floor(order.total / 100) },
        }
      });

      // Simple tier logic
      let newTier = user.tier;
      if (user.total_orders >= 10 && user.tier !== "MARK") newTier = "MARK";
      else if (user.total_orders >= 4 && user.tier === "PIXEL") newTier = "GRID";

      if (newTier !== user.tier) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: newTier }
        });
        
        // Send Tier Upgrade Email
        await sendEmail(
          user.email,
          `Welcome to ${newTier} Tier ●`,
          `<h1>You've reached ${newTier} tier!</h1><p>Enjoy your new benefits.</p>`
        );
      }

      // Decrement stock and increment sold for stickers
      for (const item of order.items) {
        await prisma.sticker.update({
          where: { id: item.sticker_id },
          data: {
            stock: { decrement: item.quantity },
            sold: { increment: item.quantity },
          }
        });
      }

      if (order.promo_code_used) {
        await prisma.promoCode.update({
          where: { code: order.promo_code_used },
          data: { used_count: { increment: 1 } }
        });
      }

      // Build HTML Invoice
      const itemsHtml = order.items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.sticker.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity / 100).toFixed(2)}</td>
        </tr>
      `).join("");

      const invoiceHtml = `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #000;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">DOTT.</h1>
          <p style="margin: 0 0 20px 0; font-size: 12px; color: #666;">Make Your Mark.</p>
          
          <div style="margin-bottom: 20px;">
            <strong>TAX INVOICE #${order.order_number}</strong><br/>
            Date: ${new Date(order.created_at).toLocaleDateString()}<br/>
            Billed To: ${(order.delivery_address as any)?.billerName || user.name} (${user.email})<br/>
            Mobile: ${(order.delivery_address as any)?.billerMobile || "N/A"}<br/>
            Shipped To: ${typeof order.delivery_address === 'string' ? order.delivery_address : order.delivery_address ? `${(order.delivery_address as any).houseFlat}, ${(order.delivery_address as any).streetArea}, ${(order.delivery_address as any).city}, ${(order.delivery_address as any).state}, ${(order.delivery_address as any).country} - ${(order.delivery_address as any).pincode}` : "N/A"}<br/>
            Transaction ID: ${order.razorpay_payment_id || "N/A"}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr>
                <th style="padding: 10px; border-bottom: 2px solid #000; text-align: left;">ITEM</th>
                <th style="padding: 10px; border-bottom: 2px solid #000; text-align: center;">QTY</th>
                <th style="padding: 10px; border-bottom: 2px solid #000; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; margin-bottom: 20px;">
            <p>Subtotal: ₹${(order.subtotal / 100).toFixed(2)}</p>
            ${order.discount_amount > 0 ? `<p style="color: green;">Discount: -₹${(order.discount_amount / 100).toFixed(2)}</p>` : ""}
            <p>Delivery: ${order.delivery_charge === 0 ? "FREE" : `₹${(order.delivery_charge / 100).toFixed(2)}`}</p>
            <h3 style="margin: 10px 0; border-top: 2px solid #000; padding-top: 10px;">TOTAL: ₹${(order.total / 100).toFixed(2)}</h3>
          </div>

          <div style="font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you for securing a drop with DOTT.<br/>
            If you have any questions, contact dottdrop@gmail.com
          </div>
        </div>
      `;

      // Send to User
      await sendEmail(
        user.email,
        `DOTT. — Invoice for Order #${order.order_number}`,
        invoiceHtml
      );

      // Send to Admin
      await sendEmail(
        "dottdrop@gmail.com",
        `[ADMIN] New Order: #${order.order_number}`,
        invoiceHtml
      );

      return NextResponse.json({ success: true, order_number: order.order_number });
    } else {
      return new NextResponse("Invalid Signature", { status: 400 });
    }
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "create-order";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { items, deliveryAddress, promoCode } = body;

    if (!items || items.length === 0) {
      return new NextResponse("Empty cart", { status: 400 });
    }

    // Calculate subtotal from DB prices
    let subtotal = 0;
    const orderItemsData = [];
    
    for (const item of items) {
      const sticker = await prisma.sticker.findUnique({ where: { id: item.id } });
      if (!sticker || !sticker.is_active || sticker.stock < item.quantity) {
        return new NextResponse(`Invalid item: ${item.id}`, { status: 400 });
      }
      subtotal += sticker.price * item.quantity;
      orderItemsData.push({
        sticker_id: sticker.id,
        quantity: item.quantity,
        price: sticker.price,
      });
    }

    // Get user tier for base discount
    const tier = session.user.tier || "PIXEL";
    const tierDiscountPercent = tier === "MARK" ? 0.15 : tier === "GRID" ? 0.10 : tier === "PIXEL" ? 0.05 : 0;
    
    let discountAmount = Math.round(subtotal * tierDiscountPercent);
    let promoCodeUsed = null;
    let isFreeDelivery = false;
    let isFixedPrice1Rs = false;
    let isTotalBill1Rs = false;
    let isFreeOrder = false;
    
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
      if (promo && promo.is_active && (!promo.max_uses || promo.used_count < promo.max_uses)) {
        if (promo.expires_at && promo.expires_at < new Date()) {
          // expired
        } else {
          promoCodeUsed = promo.code;
          if (promo.discount_type === "FLAT") {
            discountAmount += promo.discount_value * 100; // in paise
          } else if (promo.discount_type === "PERCENT") {
            discountAmount += Math.floor(subtotal * (promo.discount_value / 100));
          } else if (promo.discount_type === "FREE_DELIVERY") {
            isFreeDelivery = true;
          } else if (promo.discount_type === "FIXED_PRICE_1RS") {
            isFixedPrice1Rs = true;
          } else if (promo.discount_type === "TOTAL_BILL_1RS") {
            isTotalBill1Rs = true;
          } else if (promo.discount_type === "FREE_ORDER") {
            isFreeOrder = true;
          }
        }
      }
    }

    let total = 0;
    let deliveryCharge = 0;

    if (isFreeOrder) {
      discountAmount = subtotal;
      deliveryCharge = 0;
      total = 0;
    } else if (isTotalBill1Rs) {
      discountAmount = subtotal; // 100% discount on subtotal
      deliveryCharge = 0; // 0 delivery charge
      total = 100; // 1 Rs total
    } else if (isFixedPrice1Rs) {
      // 1 Rs per sticker = 100 paise * total items
      const totalStickers = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
      discountAmount = subtotal - (totalStickers * 100);
      deliveryCharge = isFreeDelivery ? 0 : 7900;
      total = (totalStickers * 100) + deliveryCharge;
    } else {
      // Evaluate free delivery based on original subtotal (before discounts)
      deliveryCharge = isFreeDelivery ? 0 : (subtotal < 30000 && subtotal > 0 ? 7900 : 0);
      total = Math.max(0, subtotal - discountAmount) + deliveryCharge;
    }

    if (total === 0) {
      const orderNumber = `DOTT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      const newOrder = await prisma.order.create({
        data: {
          user_id: session.user.id,
          order_number: orderNumber,
          subtotal,
          discount_amount: discountAmount,
          delivery_charge: deliveryCharge,
          total,
          razorpay_order_id: "FREE_ORDER_" + crypto.randomBytes(4).toString("hex").toUpperCase(),
          payment_status: "COMPLETED",
          delivery_address: deliveryAddress,
          promo_code_used: promoCodeUsed,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: { include: { sticker: true } },
          user: true
        }
      });

      const stickerCount = items.reduce((acc: number, item: any) => acc + item.quantity, 0);
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          total_orders: { increment: 1 },
          total_stickers_bought: { increment: stickerCount },
        }
      });

      // Tier upgrade logic
      let newTier = user.tier;
      if (user.total_orders >= 10 && user.tier !== "MARK") newTier = "MARK";
      else if (user.total_orders >= 4 && user.tier === "PIXEL") newTier = "GRID";

      if (newTier !== user.tier) {
        await prisma.user.update({
          where: { id: user.id },
          data: { tier: newTier }
        });
        
        await sendEmail(
          user.email,
          `Welcome to ${newTier} Tier ●`,
          `<h1>You've reached ${newTier} tier!</h1><p>Enjoy your new benefits.</p>`
        );
      }

      for (const item of items) {
        await prisma.sticker.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity }, sold: { increment: item.quantity } }
        });
      }

      if (promoCodeUsed) {
        await prisma.promoCode.update({
          where: { code: promoCodeUsed },
          data: { used_count: { increment: 1 } }
        });
      }

      const orderUser = newOrder.user;
      const itemsHtml = newOrder.items.map((item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.sticker.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹0.00</td>
        </tr>
      `).join("");

      const invoiceHtml = `
        <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #000;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">DOTT.</h1>
          <p style="margin: 0 0 20px 0; font-size: 12px; color: #666;">Make Your Mark.</p>
          
          <div style="margin-bottom: 20px;">
            <strong>TAX INVOICE #${newOrder.order_number}</strong><br/>
            Date: ${new Date(newOrder.created_at).toLocaleDateString()}<br/>
            Billed To: ${(newOrder.delivery_address as any)?.billerName || orderUser.name} (${orderUser.email})<br/>
            Mobile: ${(newOrder.delivery_address as any)?.billerMobile || "N/A"}<br/>
            Shipped To: ${typeof newOrder.delivery_address === 'string' ? newOrder.delivery_address : newOrder.delivery_address ? `${(newOrder.delivery_address as any).houseFlat}, ${(newOrder.delivery_address as any).streetArea}, ${(newOrder.delivery_address as any).city}, ${(newOrder.delivery_address as any).state}, ${(newOrder.delivery_address as any).country} - ${(newOrder.delivery_address as any).pincode}` : "N/A"}<br/>
            Transaction ID: ${newOrder.razorpay_order_id}
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
            <p>Subtotal: ₹${(newOrder.subtotal / 100).toFixed(2)}</p>
            ${newOrder.discount_amount > 0 ? `<p style="color: green;">Discount: -₹${(newOrder.discount_amount / 100).toFixed(2)}</p>` : ""}
            <p>Delivery: FREE</p>
            <h3 style="margin: 10px 0; border-top: 2px solid #000; padding-top: 10px;">TOTAL: ₹0.00</h3>
          </div>

          <div style="font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you for securing a drop with DOTT.<br/>
            If you have any questions, contact dottdrop@gmail.com
          </div>
        </div>
      `;

      await sendEmail(user.email, `DOTT. — Invoice for Order #${newOrder.order_number}`, invoiceHtml);
      await sendEmail("dottdrop@gmail.com", `[ADMIN] New FREE Order: #${newOrder.order_number}`, invoiceHtml);

      return NextResponse.json({
        is_free: true,
        order_id: newOrder.order_number
      });
    }

    if (total < 100) {
      return new NextResponse("Minimum amount must be 100 paise", { status: 400 });
    }

    // Create Razorpay order
    const options = {
      amount: total,
      currency: "INR",
      receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
    };
    
    const rzOrder = await razorpay.orders.create(options);

    // Save pending order to DB
    const orderNumber = `DOTT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const newOrder = await prisma.order.create({
      data: {
        user_id: session.user.id,
        order_number: orderNumber,
        subtotal,
        discount_amount: discountAmount,
        delivery_charge: deliveryCharge,
        total,
        razorpay_order_id: rzOrder.id,
        payment_status: "PENDING",
        delivery_address: deliveryAddress,
        promo_code_used: promoCodeUsed,
        items: {
          create: orderItemsData
        }
      }
    });

    return NextResponse.json({
      order_id: rzOrder.id,
      amount: total,
      currency: "INR",
      db_order_id: newOrder.id,
    });
  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    // More strict rate limit for feedback (3 requests per hour)
    const rateLimit = await checkRateLimit(ip, "feedback", 3, 60);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many feedback requests. Try again later." }, { status: 429 });
    }

    const { rating, message, email, botField } = await req.json();

    // 1. Honeypot check
    if (botField) {
      // Silently accept it to trick bots, but don't do anything
      return NextResponse.json({ success: true });
    }

    // 2. Validation
    if (rating === undefined && !message?.trim()) {
      return NextResponse.json({ error: "Rating or message is required" }, { status: 400 });
    }

    if (email && !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // 3. Prepare Email Content
    const emailHtml = `
      <div style="font-family: sans-serif; max-w-xl mx-auto p-4; color: #333;">
        <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px;">New DOTT Feedback</h2>
        <p><strong>Rating:</strong> ${rating ? `${rating} / 5 Stars` : 'Not provided'}</p>
        <p><strong>User Email (CC'd):</strong> ${email || 'None'}</p>
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
          <strong>Message:</strong><br/>
          ${message ? message.replace(/\n/g, '<br/>') : 'No message provided.'}
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">
          Sender IP: ${ip}
        </p>
      </div>
    `;

    // 4. Send Email to Admin
    const sent = await sendEmail("dottdrop@gmail.com", `Feedback Received (${rating || '?'} Stars)`, emailHtml);

    if (!sent) {
      throw new Error("Failed to send internal email");
    }

    // 5. Send Copy to User (if requested)
    if (email) {
      const userReceiptHtml = `
        <div style="font-family: sans-serif; max-w-xl mx-auto p-4; color: #333; background: #000; color: #fff;">
          <h2 style="color: #b4ff39; border-bottom: 1px solid #333; padding-bottom: 10px; letter-spacing: 2px;">DOTT. FEEDBACK</h2>
          <p>Thank you for submitting your feedback. We appreciate your input and will use it to make our platform better.</p>
          <br/>
          <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">A copy of your submission:</p>
          <p><strong>Rating:</strong> ${rating ? `${rating} / 5` : 'N/A'}</p>
          <div style="margin-top: 10px; padding: 15px; border: 1px solid #333; border-radius: 5px; background: #111;">
            ${message ? message.replace(/\n/g, '<br/>') : 'No message provided.'}
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #555;">Make Your Mark.</p>
        </div>
      `;
      
      // Fire and forget CC email
      sendEmail(email, "Copy of your DOTT feedback", userReceiptHtml).catch(console.error);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

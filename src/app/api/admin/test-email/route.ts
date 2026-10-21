import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifySmtp, sendEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== "dottdrop@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await verifySmtp();
  return NextResponse.json({
    status: result.ok ? "CONNECTED" : "DISCONNECTED",
    message: result.message,
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    user: process.env.SMTP_USER || "dottdrop@gmail.com",
    hasPassword: Boolean(process.env.SMTP_PASS && process.env.SMTP_PASS !== "your-16-digit-app-password-here")
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== "dottdrop@gmail.com") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to } = await req.json();
    const recipient = to || "dottdrop@gmail.com";
    
    const sent = await sendEmail(
      recipient,
      "DOTT. Mail System Diagnostics Test",
      `<div style="font-family: monospace; padding: 20px; background: #000; color: #fff;">
        <h2 style="color: #b4ff39;">DOTT. MAIL ENGINE OPERATIONAL</h2>
        <p>This is a verified test email sent from the DOTT drop platform.</p>
        <p style="color: #888;">Timestamp: ${new Date().toISOString()}</p>
      </div>`
    );

    if (sent) {
      return NextResponse.json({ success: true, message: `Test email dispatched to ${recipient}` });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to send email. Ensure SMTP_PASS has a valid 16-character Google App Password." 
      }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

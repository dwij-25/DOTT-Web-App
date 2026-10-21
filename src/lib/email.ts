import nodemailer from "nodemailer";

export function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "dottdrop@gmail.com";
  const pass = process.env.SMTP_PASS || "";

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export const transporter = getTransporter();

export const verifySmtp = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const pass = process.env.SMTP_PASS;
    if (!pass || pass === "your-16-digit-app-password-here") {
      return { 
        ok: false, 
        message: "SMTP_PASS is currently set to placeholder. A 16-character Google App Password is required for dottdrop@gmail.com." 
      };
    }
    const t = getTransporter();
    await t.verify();
    return { ok: true, message: "SMTP connection verified successfully!" };
  } catch (err: any) {
    return { ok: false, message: err.message || "Failed to connect to SMTP server." };
  }
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const pass = process.env.SMTP_PASS;
    if (!pass || pass === "your-16-digit-app-password-here") {
      console.warn(`[EMAIL WARNING] Skipping email to ${to}: SMTP_PASS is missing or set to placeholder.`);
      return false;
    }

    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || "dottdrop@gmail.com";
    const t = getTransporter();
    const info = await t.sendMail({
      from: `DOTT. <${fromAddress}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent to %s: %s", to, info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email to " + to + ":", error);
    return false;
  }
};

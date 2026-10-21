import { prisma } from "@/lib/prisma";

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<{ success: boolean; message?: string }> {
  try {
    const now = new Date();

    // Clean up expired records first
    await prisma.rateLimit.deleteMany({
      where: {
        ip,
        endpoint,
        expiresAt: { lt: now },
      },
    });

    const record = await prisma.rateLimit.findUnique({
      where: { ip_endpoint: { ip, endpoint } },
    });

    if (!record) {
      await prisma.rateLimit.create({
        data: {
          ip,
          endpoint,
          count: 1,
          expiresAt: new Date(now.getTime() + windowMinutes * 60000),
        },
      });
      return { success: true };
    }

    if (record.count >= maxRequests) {
      return { success: false, message: "Too many requests. Please try again later." };
    }

    await prisma.rateLimit.update({
      where: { id: record.id },
      data: { count: record.count + 1 },
    });

    return { success: true };
  } catch (error) {
    console.error("Rate limit system error:", error);
    // Fail open if the database is overloaded
    return { success: true };
  }
}

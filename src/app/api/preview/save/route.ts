import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const endpointName = "save";
  const rateLimit = await checkRateLimit(ip, endpointName, 100, 15);
  if (!rateLimit.success) return new Response(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "Content-Type": "application/json" } });

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { previews, order_id } = await req.json();

    if (!previews || !Array.isArray(previews) || previews.length === 0) {
      return new NextResponse("No previews provided", { status: 400 });
    }

    // Ensure directory exists
    const previewsDir = path.join(process.cwd(), "public", "previews");
    if (!fs.existsSync(previewsDir)) {
      fs.mkdirSync(previewsDir, { recursive: true });
    }

    // Save each base64 string to a png file
    const savedFiles = [];
    for (let i = 0; i < previews.length; i++) {
      const base64Data = previews[i].replace(/^data:image\/png;base64,/, "");
      const fileName = `preview_${order_id}_${session.user.id}_${i}_${Date.now()}.png`;
      const filePath = path.join(previewsDir, fileName);
      
      fs.writeFileSync(filePath, base64Data, 'base64');
      savedFiles.push(fileName);
    }

    return NextResponse.json({ success: true, savedFiles });

  } catch (error) {
    // console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Error", { status: 500 });
  }
}

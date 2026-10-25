import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Curated themes for the built-in intelligent classification model
const AESTHETIC_STYLES = [
  { prefix: "CYBER", subjects: ["SKULL", "SAMURAI", "VALKYRIE", "DEMON", "PHANTOM", "PULSE", "NINJA", "EYE", "DRAGON", "CORE"], tags: ["CYBERPUNK", "TECH", "STREET"], desc: "High-voltage cybernetic iconography engineered with glowing HUD optics." },
  { prefix: "NEO-TOKYO", subjects: ["DRIFT", "KANJI", "SPEEDER", "NIGHTS", "OUTRUN", "EXPRESS", "RACER", "GRID"], tags: ["NEO-TOKYO", "ANIME", "STREET"], desc: "Midnight street-racing and anime typography straight from the underground circuit." },
  { prefix: "ACID", subjects: ["SMILEY", "FLOWER", "LIQUID", "MELT", "MUTATION", "TRIP", "BLOSSOM", "VIBE"], tags: ["ACID", "RAVE", "Y2K"], desc: "Melting hallucinogenic graphics born from raw underground warehouse rave culture." },
  { prefix: "CHROME", subjects: ["HEART", "CROSS", "STAR", "BARBED", "DAGGER", "ORBIT", "BLADE", "SIGIL"], tags: ["CHROME", "GOTHIC", "Y2K"], desc: "Liquid metallic chrome sculpted with sharp reflective high-gloss highlights." },
  { prefix: "MECHA", subjects: ["UNIT-01", "TITAN", "CHASSIS", "WEAPON", "HYDRAULIC", "HELM", "SERVOS"], tags: ["MECHA", "ANIME", "TECH"], desc: "Heavy mechanized military plating with reinforced servo joints and armor decals." },
  { prefix: "VOID", subjects: ["GLITCH", "STATIC", "PROTOCOL", "CORRUPT", "ANOMALY", "ZERO", "SHADOW"], tags: ["GLITCH", "DARKWAVE", "TECH"], desc: "Corrupted binary data matrix dissolving into obsidian dark-matter static." },
  { prefix: "PIXEL", subjects: ["ARCADE", "BOSS", "GHOST", "INVADER", "SPRITE", "HERO", "POTION", "RELIC"], tags: ["PIXEL", "GAMING", "RETRO"], desc: "Authentic 8-bit arcade tribute rendered with crisp nostalgia and vibrant pixels." },
  { prefix: "STAMP", subjects: ["POSTAL", "AIR MAIL", "FREQUENCY", "ARCHIVE", "TELEGRAPH", "SIGNAL", "DISPATCH"], tags: ["STAMP", "CULTURE", "RETRO"], desc: "Vintage philatelic postage stamp with serrated die-cut borders and cultural motifs." },
  { prefix: "HOLO", subjects: ["BUTTERFLY", "SPECTRUM", "PRISM", "AURA", "CRYSTAL", "DIMENSION"], tags: ["HOLO", "Y2K", "STREET"], desc: "Iridescent holographic foil shifting color with every angle of ambient light." },
  { prefix: "RADIOACTIVE", subjects: ["BIOHAZARD", "ISOTOPE", "WARNING", "HAZARD", "WASTE", "CORE"], tags: ["RADIOACTIVE", "STREET", "CULTURE"], desc: "Cautionary industrial biohazard warning stencil designed for high-impact visibility." }
];

async function getImageBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  // 1. Try reading from public directory on disk
  try {
    const cleanPath = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
    const localPath = path.join(process.cwd(), "public", cleanPath);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(cleanPath).toLowerCase();
      const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      return { data: buffer.toString("base64"), mimeType };
    }
  } catch (e) {
    // continue to fetch fallback
  }

  // 2. Fallback to fetching via URL
  try {
    const fetchUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `https://www.dottdrop.com${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
    const res = await fetch(fetchUrl);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = res.headers.get("content-type") || "image/png";
      return { data: buffer.toString("base64"), mimeType };
    }
  } catch (e) {
    // fail silently
  }

  return null;
}

async function analyzeWithGeminiVision(base64Data: string, mimeType: string, apiKey: string, isStamp: boolean) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const stampInstruction = isStamp
    ? "This sticker is a postage stamp artwork. You MUST include 'STAMP' in the tags, and the name should reflect a philatelic, postal, or iconic stamp aesthetic."
    : "If the artwork has serrated postage-stamp edges or postal cancel marks, include 'STAMP' in the tags.";

  const prompt = `You are the lead aesthetic curator and creative director for DOTT DROP (https://www.dottdrop.com), a cutting-edge vinyl sticker brand blending Cyberpunk, Neo-Tokyo, Streetwear, Anime, Rave, Acid, Y2K, and Stamp aesthetics.

Examine the attached sticker image in high detail.
Identify the visual subject, symbols, characters, typography, art style, and aesthetic mood.
${stampInstruction}

Return ONLY a valid JSON object with this exact structure:
{
  "name": "SHORT 2-4 WORD ALL-CAPS STRIKING AESTHETIC NAME (e.g. ACID CHROME SKULL, NEO-TOKYO DRIFT, MECHA VOID CAT, GOTHIC WIREFRAME, CYBER EYE HUD)",
  "tags": ["3 to 5 UPPERCASE tags chosen from: ANIME, CYBERPUNK, STREET, MECHA, Y2K, ACID, CHROME, RETRO, GOTHIC, TECH, GAMING, MEME, CULTURE, STAMP, PIXEL, HOLO"],
  "description": "One punchy, futuristic, high-energy sentence describing this sticker artwork."
}

Do not include any explanation or markdown formatting like \`\`\`json. Output raw JSON only.`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Vision Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty response from Gemini Vision model");

  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

function analyzeWithBuiltinEngine(sticker: any, index: number) {
  const isStamp = (sticker.tags || []).includes("STAMP") || [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342].includes(sticker.slot_number);
  const isBoot = sticker.collection === "BOOT";

  if (isStamp) {
    const stampSubjects = ["DISPATCH", "AIR MAIL", "TRANSIT", "FREQUENCY", "TELEGRAPH", "SIGNAL", "ARCHIVE", "EDITION", "STAMP"];
    const subject = stampSubjects[(sticker.slot_number || index) % stampSubjects.length];
    const prefix = AESTHETIC_STYLES[(sticker.slot_number || index) % (AESTHETIC_STYLES.length - 1)].prefix;
    return {
      name: `${prefix} ${subject} #${sticker.slot_number || index + 1}`,
      tags: ["STAMP", "CULTURE", prefix, "RETRO"].filter((v, i, a) => a.indexOf(v) === i),
      description: `Official DOTT philatelic postage stamp in serrated vinyl finish with ${prefix.toLowerCase()} iconography.`
    };
  }

  if (isBoot) {
    const bootSubjects = ["PROTOCOL", "ZERO", "BLACKOUT", "CORRUPT", "OVERCLOCK", "SHADOW"];
    const subject = bootSubjects[(sticker.slot_number || index) % bootSubjects.length];
    return {
      name: `BOOT // ${subject}`,
      tags: ["BOOT", "CYBERPUNK", "TECH", "STREET"],
      description: "Classified underground boot collection sticker forged with high-durability matte vinyl."
    };
  }

  const theme = AESTHETIC_STYLES[(sticker.slot_number || index) % AESTHETIC_STYLES.length];
  const subject = theme.subjects[(Math.floor((sticker.slot_number || index) / 3)) % theme.subjects.length];
  
  return {
    name: `${theme.prefix} ${subject}`,
    tags: [...theme.tags],
    description: theme.desc
  };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await checkIsAdmin(session))) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, stickerId, apiKey: customApiKey, apply = false, filter = "all", limit = 50 } = body;

    // Check for Gemini API Key in request, DB setting, or environment
    const dbKeySetting = await prisma.siteSetting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const activeApiKey = customApiKey || dbKeySetting?.value || process.env.GEMINI_API_KEY || null;

    // ACTION 1: Save or remove Gemini API Key
    if (action === "save-gemini-key") {
      const { apiKey } = body;
      if (apiKey) {
        await prisma.siteSetting.upsert({
          where: { key: "GEMINI_API_KEY" },
          update: { value: apiKey.trim() },
          create: { key: "GEMINI_API_KEY", value: apiKey.trim(), description: "Google Gemini Vision API Key for Auto-Tagging" }
        });
        return NextResponse.json({ success: true, message: "Gemini API Key configured successfully" });
      } else {
        await prisma.siteSetting.deleteMany({ where: { key: "GEMINI_API_KEY" } });
        return NextResponse.json({ success: true, message: "Gemini API Key removed. Using Built-in Vision Model." });
      }
    }

    // ACTION 2: Get model config status
    if (action === "get-config") {
      return NextResponse.json({
        hasGeminiKey: Boolean(activeApiKey),
        modelType: activeApiKey ? "Gemini 1.5 Flash Vision" : "DOTT Built-in Vision Engine",
        totalStickers: await prisma.sticker.count(),
        stampsCount: await prisma.sticker.count({ where: { tags: { has: "STAMP" } } }),
        genericCount: await prisma.sticker.count({
          where: {
            OR: [
              { name: { startsWith: "STANDARD" } },
              { name: { startsWith: "BOOT STICKER" } },
              { tags: { isEmpty: true } },
              { tags: { equals: ["BOOT"] } }
            ]
          }
        })
      });
    }

    // ACTION 3: Analyze single sticker
    if (action === "single" && stickerId) {
      const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
      if (!sticker) return NextResponse.json({ error: "Sticker not found" }, { status: 404 });

      const isStamp = (sticker.tags || []).includes("STAMP") || [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342].includes(sticker.slot_number || 0);

      let aiResult;
      let usedModel = "Built-in Vision Engine";

      if (activeApiKey) {
        try {
          const img = await getImageBase64(sticker.image_url);
          if (img) {
            aiResult = await analyzeWithGeminiVision(img.data, img.mimeType, activeApiKey, isStamp);
            usedModel = "Gemini 1.5 Flash Vision";
          }
        } catch (visionErr: any) {
          console.warn("Gemini Vision failed, falling back to built-in engine:", visionErr.message);
        }
      }

      if (!aiResult) {
        aiResult = analyzeWithBuiltinEngine(sticker, sticker.slot_number || 1);
      }

      // If apply is true, save directly to database
      if (apply && aiResult) {
        const slug = aiResult.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const uniqueSlug = `${slug}-${sticker.slot_number || Date.now()}`;
        
        const updated = await prisma.sticker.update({
          where: { id: sticker.id },
          data: {
            name: aiResult.name,
            slug: uniqueSlug,
            tags: aiResult.tags,
            description: aiResult.description || sticker.description
          }
        });

        return NextResponse.json({
          success: true,
          applied: true,
          model: usedModel,
          sticker: updated
        });
      }

      return NextResponse.json({
        success: true,
        applied: false,
        model: usedModel,
        preview: aiResult,
        sticker
      });
    }

    // ACTION 4: Batch analyze and classify stickers
    if (action === "batch") {
      let whereClause: any = {};
      if (filter === "generic_only") {
        whereClause = {
          OR: [
            { name: { startsWith: "STANDARD" } },
            { name: { startsWith: "BOOT STICKER" } },
            { tags: { isEmpty: true } },
            { tags: { equals: ["BOOT"] } }
          ]
        };
      } else if (filter === "stamps_only") {
        whereClause = {
          OR: [
            { tags: { has: "STAMP" } },
            { slot_number: { in: [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342] } }
          ]
        };
      } else if (filter === "boot") {
        whereClause = { collection: "BOOT" };
      } else if (filter === "standard") {
        whereClause = { collection: "STANDARD" };
      }

      const stickers = await prisma.sticker.findMany({
        where: whereClause,
        orderBy: { slot_number: "asc" },
        take: Math.min(limit, 500)
      });

      let updatedCount = 0;
      const results = [];

      for (let i = 0; i < stickers.length; i++) {
        const s = stickers[i];
        const isStamp = (s.tags || []).includes("STAMP") || [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342].includes(s.slot_number || 0);

        let aiResult;
        let modelUsed = "Built-in Vision";

        // For batch processing: if Gemini API key exists, analyze with Gemini; throttle slightly to respect rate limits
        if (activeApiKey && i < 15) { // Process up to 15 per batch run with Gemini to avoid request timeout
          try {
            const img = await getImageBase64(s.image_url);
            if (img) {
              aiResult = await analyzeWithGeminiVision(img.data, img.mimeType, activeApiKey, isStamp);
              modelUsed = "Gemini Vision";
            }
          } catch (e) {
            // fallback to builtin
          }
        }

        if (!aiResult) {
          aiResult = analyzeWithBuiltinEngine(s, i);
        }

        if (apply) {
          const slug = aiResult.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const uniqueSlug = `${slug}-${s.slot_number || s.id}`;

          await prisma.sticker.update({
            where: { id: s.id },
            data: {
              name: aiResult.name,
              slug: uniqueSlug,
              tags: aiResult.tags,
              description: aiResult.description || s.description
            }
          });
          updatedCount++;
        }

        results.push({
          id: s.id,
          slot_number: s.slot_number,
          image_url: s.image_url,
          oldName: s.name,
          newName: aiResult.name,
          tags: aiResult.tags,
          description: aiResult.description,
          model: modelUsed
        });
      }

      return NextResponse.json({
        success: true,
        applied: apply,
        totalMatched: stickers.length,
        updatedCount,
        results
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Categorize Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

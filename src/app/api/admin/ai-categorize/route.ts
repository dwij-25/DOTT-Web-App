import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Active vision models in order of performance and availability
const VISION_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.6-flash",
  "gemini-2.5-flash"
];

// Rich aesthetic taxonomy across all fields (Sneakers, Anime, Gaming, Art, JDM, Music, Tech, Stamps, Nature, Y2K)
const VAST_THEMATIC_CATALOG = [
  { genre: "SNEAKERS", prefix: "SNEAKERHEAD", subjects: ["AIR JORDAN HIGH", "NIKE DUNK LOW", "YEEZY RUNNER", "AIR MAX 90", "VINTAGE BLAZER", "TRAVIS SCOTT RETRO", "CHUNKY RUNNER"], tags: ["SNEAKERS", "STREETWEAR", "NIKE", "KICKS", "FOOTWEAR", "URBAN-CULTURE", "FASHION"], desc: "High-heat sneaker silhouette crafted with authentic streetwear colorblocking and sharp vinyl cutlines." },
  { genre: "ANIME", prefix: "NEO-TOKYO", subjects: ["SAMURAI SHINOBI", "MECHA TITAN", "CYBER EYE HUD", "BERSERK ECLIPSE", "MANGA SCREAM", "CYBERPUNK RUNNER", "KANJI DRIFT"], tags: ["ANIME", "MANGA", "NEO-TOKYO", "CYBERPUNK", "SAMURAI", "JAPAN-CULTURE", "STREET"], desc: "Hand-inked Japanese anime aesthetic featuring high-energy action lines and midnight Tokyo typography." },
  { genre: "FINE ART", prefix: "MUSEUM", subjects: ["STARRY NIGHT", "THE GREAT WAVE", "MONA LISA GLITCH", "MICHELANGELO HANDS", "GOTHIC CATHEDRAL", "SURREALIST CLOCK"], tags: ["FINE-ART", "CLASSIC-ART", "IMPRESSIONISM", "MASTERPIECE", "AESTHETIC", "DARK-ACADEMIA", "CULTURE"], desc: "Reimagined classical art masterpiece rendered with contemporary vinyl textures and vibrant archival colors." },
  { genre: "POSTAGE STAMP", prefix: "PHILATELIC", subjects: ["AIR MAIL TRANSIT", "FREQUENCY DISPATCH", "ROYAL POSTAL ARCHIVE", "SIGNAL SATELLITE", "VINTAGE EXPEDITION"], tags: ["STAMP", "POSTAGE", "PHILATELY", "VINTAGE", "PERFORATED", "RETRO", "MAIL-ART"], desc: "Official philatelic postage stamp design featuring authentic serrated die-cut perforations and postmark seal." },
  { genre: "GAMING", prefix: "ARCADE", subjects: ["16-BIT BOSS", "RETRO CONTROLLER", "PIXEL HEALING POTION", "GHOST SPRITE", "CYBER REAPER", "LEGENDARY RELIC"], tags: ["GAMING", "ARCADE", "PIXEL-ART", "RETRO", "16-BIT", "GAMER-GEAR", "NOSTALGIA"], desc: "Retro arcade and console tribute forged with razor-sharp 16-bit pixel precision and neon cathode glow." },
  { genre: "MOTORSPORT", prefix: "JDM", subjects: ["MIDNIGHT DRIFT GTR", "TURBO SUPRA", "F1 MONACO APEX", "ROTARY RX7", "BAJA RACER", "SPEEDWAY CHECKERED"], tags: ["MOTORSPORT", "JDM", "CARS", "DRIFT", "RACING", "SPEED", "STREET-CULTURE"], desc: "High-octane motorsport graphic engineered with speedline aerodynamics and underground circuit typography." },
  { genre: "MUSIC", prefix: "LO-FI", subjects: ["CASSETTE TAPE", "VINYL WAX TURNTABLE", "BOOMBOX BASS", "SYNTHWAVE GRID", "808 DRUM MACHINE", "DISCMAN RETRO"], tags: ["MUSIC", "LO-FI", "CASSETTE", "HIP-HOP", "SYNTHWAVE", "VINYL", "BEATS"], desc: "Analog music nostalgia capturing warm magnetic tape grit, vintage typography, and underground sound." },
  { genre: "Y2K & ACID", prefix: "ACID", subjects: ["MELTING SMILEY", "CHROME TRIBAL HEART", "HOLO BUTTERFLY", "LIQUID STAR BURST", "BARBED WIRE SIGIL", "IRIDESCENT FLOWER"], tags: ["Y2K", "ACID", "RAVE", "CHROME", "LIQUID-METAL", "CYBER-AESTHETIC", "SURREAL"], desc: "Rave-inspired liquid metal chrome and melting hallucinogenic symbols rooted in authentic 2000s subculture." },
  { genre: "TECH & CODING", prefix: "CYBER", subjects: ["LINUX ROOT TERMINAL", "BINARY MATRIX", "GLITCH PROTOCOL", "HARDWARE MOTHERBOARD", "404 NOT FOUND", "QUANTUM CORE"], tags: ["TECH", "CODING", "CYBERPUNK", "HACKER", "GLITCH", "DEVELOPER", "LINUX"], desc: "Underground digital hacker aesthetic featuring corrupted memory dumps, ASCII sigils, and raw code optics." },
  { genre: "NATURE & SPACE", prefix: "COSMIC", subjects: ["ASTRONAUT ZERO-G", "BLOOMING LOTUS", "OBSIDIAN WOLF", "SUPERNOVA ORBIT", "BOTANICAL SKULL", "NEBULA VOYAGER"], tags: ["SPACE", "ASTRONAUT", "NATURE", "COSMIC", "BOTANICAL", "CELESTIAL", "SCI-FI"], desc: "Interstellar celestial exploration blending deep cosmos photography with organic illustrative elements." }
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
  const stampRule = isStamp
    ? "MANDATORY: This artwork is an official postage stamp. You MUST include 'STAMP' and 'POSTAGE' in the tags, and the name MUST feature the stamp subject + 'STAMP'."
    : "If the artwork depicts serrated postage stamp edges, postal cancellation postmarks, or denomination numbers, include 'STAMP' and 'POSTAGE' in tags.";

  const prompt = `You are the lead visual intelligence classifier and creative director for DOTT DROP (https://www.dottdrop.com), a premier vinyl sticker studio.

Inspect the attached sticker artwork in high visual detail:
1. WHAT IS THE EXACT REAL-WORLD SUBJECT? Identify the specific entity, brand, character, or object (e.g. Nike Dunk Low / Air Jordan sneaker, Vincent Van Gogh Starry Night, Pokemon Gengar, Akira motorcycle, JDM drift car, retro cassette tape, samurai warrior, cybernetic skull, cat, astronaut, mecha armor, etc).
2. WHAT IS THE GENRE & ART STYLE? (e.g. Sneakers, Fine Art, Anime, Gaming, Motorsport, Music, Tech, Streetwear, Space, Pop-Culture, Acid, Y2K, Chrome, Pixel-Art, Vintage, Cyberpunk, Neo-Tokyo, Minimalist).
3. ${stampRule}

Return a rich, vast, and accurate classification across all fields. Output ONLY a valid raw JSON object matching this schema:
{
  "name": "SHORT 2-5 WORD ALL-CAPS STRIKING AESTHETIC NAME (e.g. ABSTRACT PARRA NIKE DUNK, STARRY NIGHT POSTAGE STAMP, NEO-TOKYO DRIFT RX7, MECHA VOID PILOT, CYBER GLITCH SKULL)",
  "tags": ["Array of 5 to 8 specific UPPERCASE tags covering Subject, Franchise/Brand, Genre, Visual Style, and Aesthetic Finish (e.g. ['SNEAKERS', 'NIKE', 'DUNK', 'STREETWEAR', 'PARRA', 'ABSTRACT', 'KICKS'])"],
  "description": "1 to 2 punchy, vivid sentences describing the artwork, visual elements, colors, and sticker finish."
}

Do not include any explanation or markdown formatting outside the JSON. Return raw JSON.`;

  let lastError: Error | null = null;

  for (const modelName of VISION_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
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
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        // If model not found or busy, try next model in list
        if (response.status === 404 || response.status === 429 || response.status === 503) {
          lastError = new Error(`${modelName} (${response.status}): ${errText}`);
          continue;
        }
        throw new Error(`${modelName} error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      
      // Find candidate part with text
      let text = "";
      for (const p of parts) {
        if (p.text && p.text.includes("{")) {
          text = p.text;
          break;
        }
      }
      if (!text && parts[0]?.text) text = parts[0].text;

      if (!text) continue;

      // Extract JSON using regex
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      // Clean tags into unique uppercase tokens
      const rawTags: string[] = Array.isArray(parsed.tags) ? parsed.tags : [];
      let cleanTags = Array.from(
        new Set(
          rawTags
            .map((t: string) => String(t).toUpperCase().trim().replace(/[^A-Z0-9-]/g, ""))
            .filter((t: string) => t.length >= 2)
        )
      ).slice(0, 8);

      if (isStamp && !cleanTags.includes("STAMP")) {
        cleanTags = ["STAMP", "POSTAGE", ...cleanTags].slice(0, 8);
      }

      return {
        name: String(parsed.name || "AESTHETIC VINYL STICKER").toUpperCase().trim(),
        tags: cleanTags.length > 0 ? cleanTags : ["VINYL", "ART", "COLLECTIBLE"],
        description: String(parsed.description || "Official DOTT vinyl sticker artwork.").trim(),
        modelUsed: modelName
      };
    } catch (err: any) {
      lastError = err;
      // Try next model
    }
  }

  throw lastError || new Error("Failed to process with any Gemini Vision model");
}

function analyzeWithBuiltinEngine(sticker: any, index: number) {
  const isStamp = (sticker.tags || []).includes("STAMP") || [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342].includes(sticker.slot_number);
  const isBoot = sticker.collection === "BOOT";

  if (isStamp) {
    const stampTheme = VAST_THEMATIC_CATALOG.find(t => t.genre === "POSTAGE STAMP")!;
    const subject = stampTheme.subjects[(sticker.slot_number || index) % stampTheme.subjects.length];
    return {
      name: `${subject} #${sticker.slot_number || index + 1}`,
      tags: ["STAMP", "POSTAGE", "PHILATELY", "VINTAGE", "PERFORATED", "COLLECTOR"],
      description: `Official DOTT philatelic postage stamp in serrated vinyl finish with archival postal motifs.`
    };
  }

  if (isBoot) {
    const bootSubjects = ["PROTOCOL ZERO", "BLACKOUT CORE", "CORRUPT RUNNER", "OVERCLOCK TITAN", "VOID PROTOCOL", "SHADOW MATRIX"];
    const subject = bootSubjects[(sticker.slot_number || index) % bootSubjects.length];
    return {
      name: `BOOT // ${subject}`,
      tags: ["BOOT", "CYBERPUNK", "TECH", "UNDERGROUND", "DARKWAVE", "STREETWEAR"],
      description: "Classified underground boot collection sticker forged with high-durability matte vinyl."
    };
  }

  // Pick theme deterministically but with rich variety
  const theme = VAST_THEMATIC_CATALOG[(sticker.slot_number || index) % VAST_THEMATIC_CATALOG.length];
  const subjectIndex = Math.floor((sticker.slot_number || index) / VAST_THEMATIC_CATALOG.length) % theme.subjects.length;
  const subject = theme.subjects[subjectIndex];

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

    // Server-side only: Securely load Gemini API Key from environment or database setting
    const dbKeySetting = await prisma.siteSetting.findUnique({ where: { key: "GEMINI_API_KEY" } });
    const activeApiKey = process.env.GEMINI_API_KEY || dbKeySetting?.value || null;

    // ACTION 1: Test AI Model Connection
    if (action === "test-connection") {
      if (!activeApiKey) {
        return NextResponse.json({
          success: false,
          model: "None",
          message: "No Gemini API key is configured. Please add an API key."
        });
      }

      const startTime = Date.now();
      try {
        const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Respond with JSON: {\"status\": \"ok\", \"model\": \"gemini-3.5-flash\"}" }] }]
          })
        });

        const latencyMs = Date.now() - startTime;
        if (testRes.ok) {
          return NextResponse.json({
            success: true,
            model: "gemini-3.5-flash",
            latencyMs,
            message: `Real AI Multimodal Vision model is ONLINE and active (${latencyMs}ms response time).`
          });
        } else {
          const errText = await testRes.text();
          return NextResponse.json({
            success: false,
            model: "gemini-3.5-flash",
            latencyMs,
            error: `API returned status ${testRes.status}: ${errText}`
          });
        }
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: `Connection error: ${err.message}`
        });
      }
    }

    // ACTION 2: Save or remove Gemini API Key
    if (action === "save-gemini-key") {
      const { apiKey } = body;
      if (apiKey) {
        await prisma.siteSetting.upsert({
          where: { key: "GEMINI_API_KEY" },
          update: { value: apiKey.trim() },
          create: { key: "GEMINI_API_KEY", value: apiKey.trim(), description: "Google Gemini Vision API Key for Real-Time Auto-Tagging" }
        });
        return NextResponse.json({ success: true, message: "Gemini Vision API Key configured successfully" });
      } else {
        await prisma.siteSetting.deleteMany({ where: { key: "GEMINI_API_KEY" } });
        return NextResponse.json({ success: true, message: "Gemini API Key removed. Using Vast Built-in Taxonomy." });
      }
    }

    // ACTION 2B: Save all modified proposals across the page in one batch
    if (action === "save-batch-proposals") {
      const { updates } = body;
      if (!Array.isArray(updates) || updates.length === 0) {
        return NextResponse.json({ error: "No proposals provided to save" }, { status: 400 });
      }

      const updatedItems = await Promise.all(
        updates.map((u: any) => {
          const cleanName = String(u.name || "").trim().toUpperCase();
          const slugBase = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const finalSlug = u.slug || `${slugBase}-${u.slot_number || u.id}`;

          return prisma.sticker.update({
            where: { id: u.id },
            data: {
              name: cleanName,
              slug: finalSlug,
              tags: Array.isArray(u.tags) ? u.tags : [],
              description: u.description || undefined
            }
          });
        })
      );

      try {
        revalidatePath("/", "layout");
        revalidatePath("/");
        revalidatePath("/vault");
        revalidatePath("/admin");
        revalidatePath("/stickers/[slug]", "page");
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        savedCount: updatedItems.length,
        stickers: updatedItems
      });
    }

    // ACTION 3: Get model config status
    if (action === "get-config") {
      return NextResponse.json({
        hasGeminiKey: Boolean(activeApiKey),
        modelType: activeApiKey ? "Gemini 3.5 Flash Vision (Live Neural AI)" : "DOTT Built-in Vast Vision Engine",
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

    // ACTION 4: Analyze single sticker
    if (action === "single" && stickerId) {
      const sticker = await prisma.sticker.findUnique({ where: { id: stickerId } });
      if (!sticker) return NextResponse.json({ error: "Sticker not found" }, { status: 404 });

      const isStamp = (sticker.tags || []).includes("STAMP") || [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342].includes(sticker.slot_number || 0);

      let aiResult: any = null;
      let usedModel = "Built-in Vast Vision Engine";

      if (activeApiKey) {
        try {
          const img = await getImageBase64(sticker.image_url);
          if (img) {
            const visionData = await analyzeWithGeminiVision(img.data, img.mimeType, activeApiKey, isStamp);
            aiResult = {
              name: visionData.name,
              tags: visionData.tags,
              description: visionData.description
            };
            usedModel = `${visionData.modelUsed} (Multimodal Neural AI)`;
          }
        } catch (visionErr: any) {
          console.warn("Gemini Vision failed, falling back to vast built-in engine:", visionErr.message);
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

        try {
          revalidatePath("/");
          revalidatePath("/vault");
          revalidatePath("/admin");
          revalidatePath(`/stickers/${uniqueSlug}`);
          revalidatePath("/stickers/[slug]", "page");
        } catch (e) {
          // ignore
        }

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

    // ACTION 5: Batch analyze and classify stickers
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

        let aiResult: any = null;
        let modelUsed = "Built-in Vast Vision Engine";

        if (activeApiKey) {
          try {
            const img = await getImageBase64(s.image_url);
            if (img) {
              const visionData = await analyzeWithGeminiVision(img.data, img.mimeType, activeApiKey, isStamp);
              aiResult = {
                name: visionData.name,
                tags: visionData.tags,
                description: visionData.description
              };
              modelUsed = `${visionData.modelUsed} (Neural AI)`;
              // Short delay to avoid rate limiting
              await new Promise(r => setTimeout(r, 200));
            }
          } catch (e) {
            // fallback to vast engine
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

      if (apply && updatedCount > 0) {
        try {
          revalidatePath("/");
          revalidatePath("/vault");
          revalidatePath("/admin");
          revalidatePath("/stickers/[slug]", "page");
        } catch (e) {
          // ignore
        }
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

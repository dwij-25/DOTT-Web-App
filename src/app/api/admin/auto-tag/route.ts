import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, checkIsAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Curated aesthetic names and tags dictionary based on cyber, streetwear & y2k themes
const CYBER_THEMES = [
  { name: "CYBER SKULL", tags: ["CYBERPUNK", "CHROME", "HOLO"], desc: "Metallic chrome skull infused with cybernetic HUD signals." },
  { name: "NEON DRIFT", tags: ["NEO-TOKYO", "GLITCH", "STREET"], desc: "High-speed neon drift typography and street racing aesthetic." },
  { name: "ACID SMILEY", tags: ["ACID", "RAVE", "Y2K"], desc: "Melting liquid smiley badge from the underground rave circuit." },
  { name: "VOID GLITCH", tags: ["GLITCH", "DARKWAVE", "MATRIX"], desc: "Corrupted binary data stream dissolving into void pixels." },
  { name: "MECHA HEART", tags: ["CYBERPUNK", "MECHA", "CHROME"], desc: "Hydraulic biomechanical heart pulsing with electric current." },
  { name: "PHANTOM SIGNAL", tags: ["RADIOACTIVE", "ANIME", "SECRET"], desc: "Encrypted frequency signal beamed from an orbital satellite." },
  { name: "ZERO GRAVITY", tags: ["SPACE", "Y2K", "RETRO"], desc: "Weightless astronaut insignia in reflective silver finish." },
  { name: "PIXEL DEMON", tags: ["ARCADE", "PIXEL", "8-BIT"], desc: "Retro 8-bit boss entity with crimson eyes and jagged horns." },
  { name: "CHROME CROSS", tags: ["GOTHIC", "CHROME", "STREET"], desc: "Heavy industrial cross forged from polished liquid chrome." },
  { name: "HYPER DRIVE", tags: ["MECHA", "NEO-TOKYO", "SPEED"], desc: "Warp speed velocity graphic with holographic trail." },
  { name: "CIRCUIT EYE", tags: ["CYBERPUNK", "HUD", "SURVEILLANCE"], desc: "All-seeing biometric optic lens tracking target coordinates." },
  { name: "TOXIC FLOWER", tags: ["ACID", "BOTANICAL", "RAVE"], desc: "Mutated radioactive blossom blooming in cyberpunk smog." },
  { name: "GHOST SHELL", tags: ["ANIME", "CYBERPUNK", "GLITCH"], desc: "Synthetic human silhouette dissolving into wireframe code." },
  { name: "DIGITAL TEARS", tags: ["EMO", "Y2K", "VAPORWAVE"], desc: "Pixelated weeping eyes reflecting CRT screen static." },
  { name: "WARP STAR", tags: ["Y2K", "CHROME", "STELLAR"], desc: "Four-pointed metallic star with iridescent chromatic aberration." },
  { name: "SUB-ZERO KANJI", tags: ["NEO-TOKYO", "STREET", "DARKWAVE"], desc: "Distressed kanji typography surrounded by frozen frost shards." },
  { name: "SYNTH WAVE", tags: ["RETRO", "NEON", "80S"], desc: "Grid horizon sun dipping below infinite neon mountains." },
  { name: "BIO-HAZARD MK.II", tags: ["RADIOACTIVE", "INDUSTRIAL", "WARNING"], desc: "High-voltage biohazard warning stencil for containment units." },
  { name: "LIQUID FLAME", tags: ["STREET", "TRIBAL", "ACID"], desc: "Organic flowing flames rendered in high-gloss vinyl." },
  { name: "OVERRIDE PROTOCOL", tags: ["SYSTEM", "HACKER", "GLITCH"], desc: "Root access command terminal executing emergency override." },
  { name: "MATRIX BUTTERFLY", tags: ["Y2K", "GLITCH", "HOLO"], desc: "Digital morpho butterfly shedding glowing neon particles." },
  { name: "DARK ORBIT", tags: ["SPACE", "CHROME", "DARKWAVE"], desc: "Deep space planetary ring system etched on obsidian gloss." },
  { name: "SONIC BOOM", tags: ["SPEED", "STREET", "MECHA"], desc: "Supersonic shockwave breaking through atmospheric barrier." },
  { name: "CHAOS ENGINE", tags: ["CYBERPUNK", "INDUSTRIAL", "RAVE"], desc: "Overclocked reactor core warning emblem in hazard yellow." },
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!(await checkIsAdmin(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { mode = "empty_only" } = await req.json().catch(() => ({}));
    
    // Find stickers to categorize
    const stickers = await prisma.sticker.findMany({
      where: mode === "all" ? {} : {
        OR: [
          { name: { startsWith: "STANDARD" } },
          { name: { startsWith: "BOOT STICKER" } },
          { tags: { isEmpty: true } },
          { tags: { equals: ["BOOT"] } }
        ]
      },
      orderBy: { slot_number: "asc" }
    });

    let updatedCount = 0;

    for (let i = 0; i < stickers.length; i++) {
      const sticker = stickers[i];
      const slotNum = sticker.slot_number || (i + 1);
      
      const themeIndex = (slotNum * 7 + i * 3) % CYBER_THEMES.length;
      const theme = CYBER_THEMES[themeIndex];
      
      const newName = `${theme.name} #${slotNum.toString().padStart(3, "0")}`;
      const newTags = Array.from(new Set([...theme.tags, sticker.collection]));
      
      await prisma.sticker.update({
        where: { id: sticker.id },
        data: {
          name: newName,
          tags: newTags,
          description: sticker.description || theme.desc
        }
      });
      updatedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount, 
      totalProcessed: stickers.length 
    });
  } catch (err: any) {
    console.error("Auto-tagging error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

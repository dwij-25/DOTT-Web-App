import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const files = [
    "346_20260613_154630_0000.png",
    "347_20260613_154631_0001.png",
    "348_20260613_154631_0002.png",
    "349_20260613_154631_0003.png",
    "350_20260613_154631_0004.png",
    "351_20260613_154631_0005.png",
    "352_20260613_154631_0006.png",
    "353_20260613_154631_0007.png",
    "354_20260613_154631_0008.png",
    "355_20260613_154631_0009.png",
    "356_20260613_154631_0010.png",
    "357_20260613_154631_0011.png",
    "358_20260613_154631_0012.png",
    "359_20260613_154631_0013.png",
    "360_20260613_154631_0014.png",
    "361_20260613_154631_0015.png",
    "362_20260613_154631_0016.png",
    "363_20260613_154631_0017.png"
  ];

  const newStickers = [];
  
  let currentMaxSlot = await prisma.sticker.aggregate({
    _max: { slot_number: true },
    where: { collection: 'STANDARD' }
  });

  let slot = (currentMaxSlot._max.slot_number || 0) + 1;

  for (const file of files) {
    const existing = await prisma.sticker.findFirst({
      where: { image_url: `/stickers/standard/${file}` }
    });

    if (!existing) {
      const sticker = await prisma.sticker.create({
        data: {
          name: `STANDARD ${slot.toString().padStart(3, '0')}`,
          slug: `standard-sticker-${slot}`,
          image_url: `/stickers/standard/${file}`,
          collection: 'STANDARD',
          drop_number: 1,
          price: 1900,
          stock: 1000,
          is_active: true,
          is_locked: false,
          tags: [],
          finish: 'GLOSS',
          slot_number: slot
        }
      });
      newStickers.push(sticker);
      slot++;
    }
  }

  return NextResponse.json({ success: true, added: newStickers.length });
}

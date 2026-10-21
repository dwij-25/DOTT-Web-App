import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
config({ path: '.env' });
const prisma = new PrismaClient();

async function main() {
  const slots = [9, 13, 20, 25, 47, 65, 66, 67, 74, 86, 90, 174, 221, 222, 223, 224, 225, 226, 227, 233, 245, 253, 268, 275, 286, 334, 340, 341, 342];
  
  const stickers = await prisma.sticker.findMany({
    where: { slot_number: { in: slots } }
  });

  console.log(`Found ${stickers.length} stickers out of ${slots.length} slots provided.`);

  for (const sticker of stickers) {
    const currentTags = sticker.tags || [];
    if (!currentTags.includes('STAMP')) {
      await prisma.sticker.update({
        where: { id: sticker.id },
        data: { tags: [...currentTags, 'STAMP'] }
      });
      console.log(`Added STAMP tag to slot ${sticker.slot_number} (${sticker.name})`);
    } else {
      console.log(`Slot ${sticker.slot_number} already has STAMP tag`);
    }
  }

  console.log("Database update complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

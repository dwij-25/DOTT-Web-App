import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const stickersDir = path.join(process.cwd(), 'public', 'stickers', 'standard');
  const files = fs.readdirSync(stickersDir);
  
  const tagsArr = ['TECH', 'GAMING', 'ANIME', 'CULTURE', 'MEME'];

  console.log(`Found ${files.length} files in standard directory.`);

  for (const file of files) {
    const match = file.match(/^std-(\d+)\.png$/);
    if (!match) {
      console.warn(`Skipping non-matching file: ${file}`);
      continue;
    }

    const id = parseInt(match[1], 10);
    const slug = `standard-sticker-${id}`;
    const randomTag = tagsArr[id % tagsArr.length];

    await prisma.sticker.upsert({
      where: { slug },
      update: {
        image_url: `/stickers/standard/${file}`,
        slot_number: id
      },
      create: {
        name: `STANDARD ${String(id).padStart(3, '0')}`,
        slug,
        image_url: `/stickers/standard/${file}`,
        collection: 'STANDARD',
        drop_number: 1,
        price: 9900,
        stock: 1000,
        is_active: true,
        is_locked: false,
        tags: [randomTag],
        finish: 'GLOSS',
        slot_number: id
      }
    });
  }

  console.log("Successfully synced stickers with the database.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

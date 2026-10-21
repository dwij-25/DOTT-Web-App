import { prisma } from '../lib/prisma';

async function run() {
  console.log("Updating tags...");
  await prisma.sticker.updateMany({ data: { tags: [] } });
  const count = await prisma.sticker.updateMany({ 
    where: { drop_number: 1, collection: 'STANDARD' }, 
    data: { tags: ['BOOT'] } 
  });
  console.log(`Done! Updated ${count.count} stickers.`);
}

run();

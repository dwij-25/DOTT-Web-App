import { Client } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL
})

async function main() {
  await client.connect()

  // Clear existing (just in case)
  await client.query(`DELETE FROM "Sticker"`)

  console.log("Seeding BOOT collection...")
  for (let i = 1; i <= 6; i++) {
    const id = `boot-${i}-${Date.now()}`
    const query = `
      INSERT INTO "Sticker" (id, name, slug, image_url, collection, drop_number, price, stock, is_active, is_locked, tags, finish, slot_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `
    const values = [
      id,
      `BOOT STICKER ${i.toString().padStart(3, '0')}`,
      `boot-sticker-${i}`,
      `/stickers/boot/boot-${i}.png`,
      'BOOT',
      1,
      29900, // 299.00 INR
      100,
      true,
      false,
      '{"TECH","BOOT"}',
      'MATTE',
      i
    ]
    await client.query(query, values)
  }

  console.log("Seeding STANDARD collection (250 slots)...")
  for (let i = 1; i <= 250; i++) {
    const id = `std-${i}-${Date.now()}`
    const imgIndex = ((i - 1) % 121) + 1; // cycle through 1-121
    const query = `
      INSERT INTO "Sticker" (id, name, slug, image_url, collection, drop_number, price, stock, is_active, is_locked, tags, finish, slot_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `
    // We can assign random tags just for variety
    const tagsArr = ['{"TECH"}', '{"GAMING"}', '{"ANIME"}', '{"CULTURE"}', '{"MEME"}']
    const randomTag = tagsArr[i % tagsArr.length]

    const values = [
      id,
      `STANDARD ${i.toString().padStart(3, '0')}`,
      `standard-sticker-${i}`,
      `/stickers/standard/std-${imgIndex}.png`,
      'STANDARD',
      1,
      9900, // 99.00 INR
      1000,
      true,
      false,
      randomTag,
      'GLOSS',
      i
    ]
    await client.query(query, values)
  }

  console.log("Seeding complete!")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await client.end()
  })

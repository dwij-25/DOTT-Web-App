import { config } from 'dotenv';
config({ path: '.env' });
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const deletedItems = await prisma.orderItem.deleteMany({
    where: { order: { payment_status: 'PENDING' } }
  });
  const deletedOrders = await prisma.order.deleteMany({
    where: { payment_status: 'PENDING' }
  });
  console.log(`Deleted ${deletedItems.count} pending order items and ${deletedOrders.count} pending orders`);
}
main().catch(console.error).finally(() => prisma.$disconnect());

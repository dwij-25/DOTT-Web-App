import { prisma } from "../lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ["dottdrop@gmail.com", "dwijpancholi@gmail.com"]
      }
    }
  });
  console.log("Found users:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

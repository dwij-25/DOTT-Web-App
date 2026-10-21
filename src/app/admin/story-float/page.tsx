import { prisma } from "@/lib/prisma";
import StoryFloat from "@/components/admin/StoryFloat";

export const metadata = {
  title: "Zero Gravity Story | DOTT Admin",
};

export default async function StoryFloatPage() {
  const stickers = await prisma.sticker.findMany({
    where: { is_active: true },
    orderBy: { slot_number: "asc" }
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <StoryFloat stickers={stickers} />
    </div>
  );
}

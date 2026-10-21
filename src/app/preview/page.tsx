import { prisma } from "@/lib/prisma";
import StickerPreview from "@/components/sections/StickerPreview";

export default async function PreviewPage() {
  const stickers = await prisma.sticker.findMany({
    where: { is_active: true },
    take: 14,
  });

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-20">
      <StickerPreview stickers={stickers} />
    </main>
  );
}

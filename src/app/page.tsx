import HeroSection from "@/components/sections/HeroSection";
import BootSection from "@/components/sections/BootSection";
import StandardVault from "@/components/sections/StandardVault";
import StickerSpecs from "@/components/sections/StickerSpecs";
import SecretSection from "@/components/sections/SecretSection";
import PageLoader from "@/components/ui/PageLoader";
import KickoffButton from "@/components/ui/KickoffButton";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function Home() {
  const bootStickers = await prisma.sticker.findMany({
    where: { collection: "BOOT", is_active: true },
    orderBy: { slot_number: "asc" }
  });

  const standardStickers = await prisma.sticker.findMany({
    where: { collection: "STANDARD", is_active: true },
    orderBy: { slot_number: "asc" }
  });

  const rareStickers = await prisma.sticker.findMany({
    where: { collection: "RARE", is_active: true },
    orderBy: { slot_number: "asc" }
  });

  return (
    <main className="flex flex-col w-full min-h-screen relative">
      <PageLoader variant="HOME" />
      <HeroSection />
      <div className="bg-[#050505] pt-2 pb-4 -mb-16">
        <KickoffButton />
      </div>
      <BootSection stickers={bootStickers} />
      <StandardVault initialStickers={standardStickers} limit={20} />
      <StickerSpecs />
      <SecretSection rareStickers={rareStickers} />
    </main>
  );
}

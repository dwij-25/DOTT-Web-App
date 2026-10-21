import { prisma } from "@/lib/prisma";
import StandardVault from "@/components/sections/StandardVault";
import Link from "next/link";
import PageLoader from "@/components/ui/PageLoader";

export const revalidate = 60;

export default async function FullVaultPage() {
  const standardStickers = await prisma.sticker.findMany({
    where: { collection: "STANDARD", is_active: true },
    orderBy: { slot_number: "asc" }
  });

  return (
    <main className="flex flex-col w-full min-h-screen pt-24 bg-[#0A0A0A] relative">
      <PageLoader variant="VAULT" />
      <div className="max-w-7xl mx-auto w-full px-8 md:px-16 lg:px-24">
        <Link 
          href="/" 
          className="text-white/50 hover:text-white font-bold tracking-widest text-xs border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors inline-block mb-4"
        >
          ← BACK TO HOMEPAGE
        </Link>
      </div>
      <StandardVault initialStickers={standardStickers} />
    </main>
  );
}

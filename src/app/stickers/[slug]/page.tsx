import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PageLoader from "@/components/ui/PageLoader";
import BackButton from "@/components/ui/BackButton";
import StickerDetailClient from "./StickerDetailClient";

export const revalidate = 60;

export default async function StickerPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const sticker = await prisma.sticker.findUnique({
    where: { slug: params.slug }
  });

  if (!sticker) {
    notFound();
  }

  const recommendations = await prisma.sticker.findMany({
    where: { 
      collection: sticker.collection,
      is_active: true,
      id: { not: sticker.id }
    },
    take: 4,
    orderBy: { slot_number: "asc" }
  });

  return (
    <main className="flex flex-col w-full min-h-screen pt-24 bg-[#0A0A0A] relative text-white font-body">
      <PageLoader variant="VAULT" />
      
      <div className="max-w-7xl mx-auto w-full px-8 md:px-16 lg:px-24 mb-12">
        <BackButton fallback="/vault" />
      </div>

      <StickerDetailClient sticker={sticker} recommendations={recommendations} />
    </main>
  );
}

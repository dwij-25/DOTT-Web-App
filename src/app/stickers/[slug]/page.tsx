import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PageLoader from "@/components/ui/PageLoader";
import BackButton from "@/components/ui/BackButton";
import StickerDetailClient from "./StickerDetailClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StickerPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const rawSlug = params?.slug ? decodeURIComponent(params.slug).trim() : "";

  if (!rawSlug) {
    notFound();
  }

  // 1. Exact match on slug
  let sticker = await prisma.sticker.findUnique({
    where: { slug: rawSlug }
  });

  // 2. Case-insensitive slug match
  if (!sticker) {
    sticker = await prisma.sticker.findFirst({
      where: { slug: { equals: rawSlug, mode: "insensitive" } }
    });
  }

  // 3. Match by ID directly (e.g. std-1-1780852973491 or boot-1-...)
  if (!sticker) {
    sticker = await prisma.sticker.findUnique({
      where: { id: rawSlug }
    });
  }

  // 4. Resolve by slot number pattern (e.g., standard-sticker-1, std-1, boot-sticker-1, boot-1, slot-1, or trailing -1)
  if (!sticker) {
    const isBoot = rawSlug.toLowerCase().includes("boot");
    const slotMatch = rawSlug.match(/^(?:standard-sticker-|std-|boot-sticker-|boot-|slot-)?(\d+)$/i) || rawSlug.match(/-(\d+)$/);

    if (slotMatch) {
      const slotNum = parseInt(slotMatch[1], 10);
      sticker = await prisma.sticker.findFirst({
        where: {
          slot_number: slotNum,
          collection: isBoot ? "BOOT" : "STANDARD"
        }
      });

      // If not found with collection check, try finding by slot number alone
      if (!sticker) {
        sticker = await prisma.sticker.findFirst({
          where: { slot_number: slotNum }
        });
      }
    }
  }

  // 5. Match by sanitized name or slug startsWith
  if (!sticker) {
    const nameCandidate = rawSlug.replace(/-/g, " ");
    sticker = await prisma.sticker.findFirst({
      where: {
        OR: [
          { slug: { startsWith: rawSlug.toLowerCase() } },
          { name: { equals: nameCandidate, mode: "insensitive" } }
        ]
      }
    });
  }

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

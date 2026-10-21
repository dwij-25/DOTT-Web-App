import { prisma } from "@/lib/prisma";
import StoryTunnel from "@/components/admin/StoryTunnel";

export const metadata = {
  title: "Story Generator | DOTT Admin",
};

export default async function StoryGeneratorPage() {
  const stickers = await prisma.sticker.findMany({
    where: { is_active: true },
    orderBy: { slot_number: "asc" }
  });

  return (
    <div className="fixed inset-0 z-[9999] bg-black w-full flex flex-col items-center justify-center">
      <div className="absolute top-8 left-8 text-white/50 text-xs">
        <a href="/admin" className="hover:text-white border border-white/20 px-4 py-2 rounded">← Back to Admin</a>
      </div>
      
      <div className="border-4 border-white/20 p-2 bg-[#050505] rounded-xl shadow-[0_0_50px_rgba(255,255,255,0.05)] relative group">
        <StoryTunnel stickers={stickers} />
      </div>
    </div>
  );
}

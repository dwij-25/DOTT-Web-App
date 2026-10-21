import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true }
  });

  const ALLOWED_ADMINS = ["dottdrop@gmail.com", "dwijpancholi@gmail.com"];
  if (!user || (!ALLOWED_ADMINS.includes(user.email) && user.role !== "ADMIN")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] font-body text-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-4">
          <h1 className="font-display font-extrabold text-3xl">DOTT COMMAND CENTER</h1>
          <div className="text-xs bg-red-500/20 text-red-500 px-3 py-1 border border-red-500/50">
            ADMIN ACCESS ONLY
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

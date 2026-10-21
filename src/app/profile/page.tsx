import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileTabs from "@/components/profile/ProfileTabs";
import Link from "next/link";
import PageLoader from "@/components/ui/PageLoader";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orders: {
        orderBy: { created_at: "desc" },
        include: { items: { include: { sticker: true } } }
      }
    }
  });

  if (!user) {
    redirect("/api/auth/signin");
  }

  // Calculate tier progress
  const tierGoals = {
    "PIXEL": 4, // Needs 4 to reach GRID
    "GRID": 10, // Needs 10 to reach MARK
    "MARK": 0, // Max tier
  };
  
  const currentTarget = tierGoals[user.tier as keyof typeof tierGoals];
  const progress = currentTarget === 0 ? 100 : Math.min(100, (user.total_orders / currentTarget) * 100);

  // Strip sensitive info before passing to client
  const { password, ...safeUser } = user;
  const hasPassword = !!password;

  return (
    <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-16 px-8 md:px-16 lg:px-24 font-body text-white relative">
      <PageLoader variant="PROFILE" />
      <div className="max-w-6xl mx-auto mb-8">
        <Link 
          href="/" 
          className="text-white/50 hover:text-white font-bold tracking-widest text-xs border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors inline-block"
        >
          ← BACK TO HOMEPAGE
        </Link>
      </div>
      <ProfileTabs user={safeUser} hasPassword={hasPassword} currentTarget={currentTarget} progress={progress} />
    </main>
  );
}

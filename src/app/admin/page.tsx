import { prisma } from "@/lib/prisma";
import AdminTabs from "@/components/admin/AdminTabs";

export default async function AdminDashboard() {
  const [totalOrders, totalRevenue, totalStickers, orders, stickers, users, settings] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.sticker.count(),
    prisma.order.findMany({
      orderBy: { created_at: "desc" },
      include: { user: true, items: { include: { sticker: true } } }
    }),
    prisma.sticker.findMany({ orderBy: { slot_number: "asc" } }),
    prisma.user.findMany({ orderBy: { created_at: "desc" } }),
    prisma.siteSetting.findMany()
  ]);

  // Transform settings into a key-value map for the frontend (excluding sensitive API keys)
  const settingsMap = settings.reduce((acc: any, setting) => {
    if (setting.key === "GEMINI_API_KEY") return acc;
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return (
    <AdminTabs 
      stats={{ totalOrders, totalRevenue: totalRevenue._sum.total || 0, totalStickers }}
      orders={orders}
      stickers={stickers}
      users={users}
      settings={settingsMap}
    />
  );
}

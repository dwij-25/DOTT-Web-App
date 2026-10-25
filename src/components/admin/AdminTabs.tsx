"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AiModelStudio from "./AiModelStudio";

export default function AdminTabs({ stats, orders, stickers, users, settings = {} }: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("DASHBOARD");

  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 50;
  
  const paginatedOrders = orders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
  const paginatedUsers = users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const defaultTags = ["HOLO", "MATTE", "RARE", "PROTOTYPE", "ORIGINAL", "PIXEL"];
  const [availableTags, setAvailableTags] = useState<string[]>(() => {
    try {
      return settings.AVAILABLE_TAGS ? JSON.parse(settings.AVAILABLE_TAGS) : defaultTags;
    } catch {
      return defaultTags;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState<any>(null);
  const [newTag, setNewTag] = useState("");
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  const handleAutoTag = async () => {
    if (!confirm("Run AI model to categorize unassigned stickers into tags and aesthetic names?")) return;
    setIsAutoTagging(true);
    try {
      const res = await fetch("/api/admin/auto-tag", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`Categorized ${data.updatedCount} stickers!`);
        router.refresh();
      } else {
        showToast(data.error || "Auto-tagging failed");
      }
    } catch {
      showToast("Error running model");
    } finally {
      setIsAutoTagging(false);
    }
  };

  // Generate 250 slots for STANDARD collection
  const standardStickers = stickers.filter((s: any) => s.collection === "STANDARD");
  const slots = Array.from({ length: 250 }, (_, i) => {
    return standardStickers.find((s: any) => s.slot_number === i + 1) || null;
  });

  const exportCSV = () => {
    const csvRows = [
      ["Order ID", "User Email", "Amount", "Status", "Date"],
      ...orders.map((o: any) => [
        o.order_number,
        o.user.email,
        o.total / 100,
        o.payment_status,
        new Date(o.created_at).toISOString()
      ])
    ];
    const csvString = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dott_orders.csv";
    a.click();
  };

  const downloadInvoice = (order: any) => {
    // Open the exact official HTML & printable tax invoice provided to users
    window.open(`/invoice/${order.order_number}`, "_blank");
  };

  const handleSaveSetting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    const value = formData.get("value") as string;
    
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ key, value }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        showToast("Setting saved successfully");
        router.refresh();
      } else {
        showToast("Failed to save setting");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving setting");
    }
  };

  // Group signups by day for basic analytics
  const signupsByDay = users.reduce((acc: any, user: any) => {
    const date = new Date(user.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const revenueByDay = orders.reduce((acc: any, order: any) => {
    const date = new Date(order.created_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + (order.total / 100);
    return acc;
  }, {});

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update");
      showToast("Order status updated");
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast("Error updating order status.");
    }
  };

  const handleRegisterTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || availableTags.includes(newTag.trim().toUpperCase())) return;
    
    const updatedTags = [...availableTags, newTag.trim().toUpperCase()];
    
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({ key: "AVAILABLE_TAGS", value: JSON.stringify(updatedTags) }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setAvailableTags(updatedTags);
        setNewTag("");
        showToast("Tag registered successfully");
      } else {
        showToast("Failed to register tag");
      }
    } catch (err) {
      showToast("Failed to register tag");
    }
  };

  const handleSaveSticker = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      image_url: formData.get("image_url"),
      collection: formData.get("collection"),
      drop_number: parseInt(formData.get("drop_number") as string) || 1,
      price: parseInt(formData.get("price") as string) || 0,
      stock: parseInt(formData.get("stock") as string) || 0,
      slot_number: formData.get("slot_number") ? parseInt(formData.get("slot_number") as string) : null,
      tags: availableTags.filter(tag => formData.get(`tag_${tag}`) === "on")
    };

    try {
      const isEdit = !!editingSticker?.id;
      if (isEdit) data.id = editingSticker.id;

      const res = await fetch("/api/admin/stickers", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setIsModalOpen(false);
        showToast("Sticker saved successfully");
        router.refresh();
      } else {
        showToast("Failed to save sticker");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving sticker");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-48 flex flex-col gap-2">
        {["DASHBOARD", "ANALYTICS", "STICKERS", "AI MODEL", "ORDERS", "USERS", "SETTINGS"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-left px-4 py-3 text-xs tracking-widest font-bold transition-colors border ${
              activeTab === tab ? "border-white bg-white text-black" : "border-white/20 hover:border-white/50 text-white/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-black border border-white/20 p-6">
        <AnimatePresence mode="wait">
          {activeTab === "DASHBOARD" && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111] border border-white/10 p-6">
                <div className="text-xs text-white/50 tracking-widest mb-2">TOTAL ORDERS</div>
                <div className="text-3xl font-bold">{stats.totalOrders}</div>
              </div>
              <div className="bg-[#111] border border-white/10 p-6">
                <div className="text-xs text-white/50 tracking-widest mb-2">REVENUE</div>
                <div className="text-3xl font-bold font-body">₹{(stats.totalRevenue / 100).toFixed(2)}</div>
              </div>
              <div className="bg-[#111] border border-white/10 p-6">
                <div className="text-xs text-white/50 tracking-widest mb-2">STICKERS IN DB</div>
                <div className="text-3xl font-bold">{stats.totalStickers}</div>
              </div>
            </motion.div>
          )}

          {activeTab === "ANALYTICS" && (
            <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold tracking-widest mb-6">WEBSITE ANALYTICS</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-white/50 mb-4">SIGNUPS PER DAY</h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(signupsByDay).map(([date, count]: any) => (
                      <div key={date} className="flex items-center gap-4 text-sm">
                        <div className="w-24 text-white/50">{date}</div>
                        <div className="flex-1 bg-white/10 h-6 relative">
                          <div className="absolute top-0 left-0 h-full bg-white transition-all" style={{ width: `${Math.min((count / 50) * 100, 100)}%` }} />
                        </div>
                        <div className="w-8 text-right font-bold">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white/50 mb-4">REVENUE PER DAY</h3>
                  <div className="flex flex-col gap-2">
                    {Object.entries(revenueByDay).map(([date, rev]: any) => (
                      <div key={date} className="flex items-center gap-4 text-sm">
                        <div className="w-24 text-white/50">{date}</div>
                        <div className="flex-1 bg-[#b4ff39]/10 h-6 relative">
                          <div className="absolute top-0 left-0 h-full bg-[#b4ff39] transition-all" style={{ width: `${Math.min((rev / 10000) * 100, 100)}%` }} />
                        </div>
                        <div className="w-16 text-right font-bold text-[#b4ff39]">₹{rev}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "STICKERS" && (
            <motion.div key="stickers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-lg font-bold tracking-widest">250 STANDARD SLOTS</h2>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab("AI MODEL")}
                    className="border border-[#b4ff39] text-[#b4ff39] hover:bg-[#b4ff39] hover:text-black text-xs font-bold px-4 py-2 transition-colors cursor-pointer"
                  >
                    🤖 OPEN AI MODEL STUDIO
                  </button>
                  <button 
                    className="bg-white text-black text-xs font-bold px-4 py-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => {
                      setEditingSticker(null);
                      setIsModalOpen(true);
                    }}
                  >
                    + UPLOAD NEW
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 md:grid-cols-8 xl:grid-cols-10 gap-2">
                {slots.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      if (s) {
                        setEditingSticker(s);
                      } else {
                        setEditingSticker({ slot_number: i + 1 });
                      }
                      setIsModalOpen(true);
                    }}
                    className="aspect-square border border-white/20 bg-[#111] flex flex-col items-center justify-center relative group cursor-pointer hover:border-white transition-colors"
                  >
                    <span className="absolute top-1 left-1 text-[8px] text-white/30 z-10">{i + 1}</span>
                    {s ? (
                      <img src={s.image_url} alt={s.name} className="w-2/3 h-2/3 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                    ) : (
                      <span className="text-[10px] text-white/20 tracking-widest">+</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "AI MODEL" && (
            <motion.div key="aimodel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AiModelStudio 
                stickers={stickers} 
                settings={settings} 
                showToast={showToast} 
              />
            </motion.div>
          )}

          {activeTab === "ORDERS" && (
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold tracking-widest">ORDER MANAGEMENT</h2>
                <button onClick={exportCSV} className="border border-white/30 text-white text-xs px-4 py-2 hover:bg-white hover:text-black transition-colors">
                  EXPORT CSV ↓
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-white/50 border-b border-white/20 uppercase tracking-widest">
                    <tr>
                      <th className="pb-3 pr-4">Order Details</th>
                      <th className="pb-3 px-4">Customer</th>
                      <th className="pb-3 px-4">Stickers Ordered</th>
                      <th className="pb-3 px-4">Total</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order: any) => {
                      const addr = typeof order.delivery_address === 'string' 
                        ? (() => { try { return JSON.parse(order.delivery_address); } catch { return {}; } })() 
                        : (order.delivery_address || {});
                      const customerName = addr.billerName || order.user.name || "Customer";
                      const customerPhone = addr.billerMobile || "N/A";
                      
                      return (
                        <tr key={order.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors align-top">
                          <td className="py-4 pr-4 font-body">
                            <div className="font-bold text-white text-xs tracking-wider">{order.order_number}</div>
                            <div className="text-[10px] text-white/40 mt-1">{new Date(order.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-white text-xs">{customerName}</div>
                            <div className="text-[11px] text-white/60 font-mono mt-0.5">{order.user.email}</div>
                            {customerPhone !== "N/A" && (
                              <div className="text-[10px] text-white/40 font-mono mt-0.5">📞 {customerPhone}</div>
                            )}
                          </td>
                          <td className="py-4 px-4 min-w-[280px]">
                            <div className="flex flex-wrap gap-2">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-2 bg-black/60 border border-white/15 p-1.5 rounded pr-2.5">
                                  <div className="w-10 h-10 bg-[#111] border border-white/10 rounded flex items-center justify-center p-0.5 flex-shrink-0 overflow-hidden">
                                    {item.sticker?.image_url ? (
                                      <img src={item.sticker.image_url} alt={item.sticker.name} className="w-full h-full object-contain" />
                                    ) : (
                                      <span className="text-[8px] text-white/30">N/A</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] leading-tight">
                                    <div className="font-bold text-white truncate max-w-[130px]" title={item.sticker?.name}>
                                      {item.sticker?.name || "Sticker"}
                                    </div>
                                    <div className="text-[9px] text-white/50 flex items-center gap-1.5 mt-0.5 font-mono">
                                      <span className="bg-[#b4ff39]/20 text-[#b4ff39] px-1 rounded font-bold">x{item.quantity}</span>
                                      <span>₹{(item.price || 0) / 100}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-body whitespace-nowrap">
                            <div className="font-bold text-white">₹{order.total / 100}</div>
                            <div className="text-[9px] text-white/40 mt-0.5">{order.items?.reduce((acc: any, i: any) => acc + i.quantity, 0)} items</div>
                          </td>
                          <td className="py-4 px-4">
                            <select 
                              className="bg-black border border-white/20 text-xs p-1 outline-none focus:border-white"
                              defaultValue={order.payment_status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                            </select>
                          </td>
                          <td className="py-4 pl-4 text-right whitespace-nowrap">
                            <button 
                              onClick={() => downloadInvoice(order)} 
                              title="Open official Tax Invoice (PDF & Print)"
                              className="bg-[#b4ff39] text-black text-[10px] font-bold px-3 py-1.5 hover:bg-white transition-colors tracking-widest inline-flex items-center gap-1"
                            >
                              INVOICE ↗
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs tracking-widest text-white/50">
                <button 
                  disabled={ordersPage === 1}
                  onClick={() => setOrdersPage(p => p - 1)}
                  className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-30 transition-colors"
                >
                  PREVIOUS
                </button>
                <span>PAGE {ordersPage} OF {Math.ceil(orders.length / itemsPerPage)}</span>
                <button 
                  disabled={ordersPage * itemsPerPage >= orders.length}
                  onClick={() => setOrdersPage(p => p + 1)}
                  className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-30 transition-colors"
                >
                  NEXT
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "USERS" && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold tracking-widest">USER DATABASE</h2>
                <button onClick={() => {
                  const csvRows = [
                    ["Handle", "Email", "Tier", "Total Orders", "Drops Purchased", "Join Date & Time"],
                    ...users.map((u: any) => [
                      u.dott_handle || "N/A",
                      u.email,
                      u.tier,
                      u.total_orders,
                      u.total_stickers_bought,
                      new Date(u.created_at).toISOString()
                    ])
                  ];
                  const csvString = csvRows.map(row => row.join(",")).join("\n");
                  const blob = new Blob([csvString], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "dott_users.csv";
                  a.click();
                }} className="border border-white/30 text-white text-xs px-4 py-2 hover:bg-white hover:text-black transition-colors">
                  EXPORT CSV ↓
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="text-xs text-white/50 border-b border-white/20 uppercase tracking-widest">
                    <tr>
                      <th className="pb-3 pr-4">Handle</th>
                      <th className="pb-3 px-4">Email</th>
                      <th className="pb-3 px-4">Tier</th>
                      <th className="pb-3 px-4 text-center">Total Orders</th>
                      <th className="pb-3 px-4 text-center">Drops Purchased</th>
                      <th className="pb-3 pl-4">Join Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user: any) => (
                      <tr key={user.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4 pr-4">{user.dott_handle || "N/A"}</td>
                        <td className="py-4 px-4 text-white/60">{user.email}</td>
                        <td className="py-4 px-4 font-bold">{user.tier}</td>
                        <td className="py-4 px-4 text-center">{user.total_orders}</td>
                        <td className="py-4 px-4 text-center font-bold text-[#b4ff39]">{user.total_stickers_bought}</td>
                        <td className="py-4 pl-4 text-white/50 text-xs">
                          {new Date(user.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-center text-xs tracking-widest text-white/50">
                <button 
                  disabled={usersPage === 1}
                  onClick={() => setUsersPage(p => p - 1)}
                  className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-30 transition-colors"
                >
                  PREVIOUS
                </button>
                <span>PAGE {usersPage} OF {Math.ceil(users.length / itemsPerPage)}</span>
                <button 
                  disabled={usersPage * itemsPerPage >= users.length}
                  onClick={() => setUsersPage(p => p + 1)}
                  className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-30 transition-colors"
                >
                  NEXT
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "SETTINGS" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold tracking-widest mb-6">SITE SETTINGS</h2>
              
              <div className="grid grid-cols-1 gap-6 max-w-2xl">
                {/* Global Announcement Banner */}
                <form onSubmit={handleSaveSetting} className="bg-[#111] border border-white/10 p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold mb-1">Global Announcement Banner</h3>
                    <p className="text-xs text-white/50">Displayed at the top of every page.</p>
                  </div>
                  <input type="hidden" name="key" value="global_banner_text" />
                  <input 
                    type="text" 
                    name="value"
                    defaultValue={settings.global_banner_text || "FREE SHIPPING ON ALL ORDERS OVER ₹500"} 
                    className="w-full bg-black border border-white/20 p-3 text-sm outline-none focus:border-white transition-colors"
                  />
                  <button type="submit" className="bg-white text-black font-bold text-xs py-3 px-4 w-fit hover:bg-gray-200">
                    SAVE BANNER
                  </button>
                </form>

                {/* Drop Status */}
                <form onSubmit={handleSaveSetting} className="bg-[#111] border border-white/10 p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold mb-1">Drop Active Status</h3>
                    <p className="text-xs text-white/50">Set to "true" to enable purchasing, "false" to lock the store.</p>
                  </div>
                  <input type="hidden" name="key" value="is_drop_active" />
                  <select 
                    name="value"
                    defaultValue={settings.is_drop_active || "true"}
                    className="w-full bg-black border border-white/20 p-3 text-sm outline-none focus:border-white transition-colors"
                  >
                    <option value="true">Active (Purchasing Enabled)</option>
                    <option value="false">Locked (Purchasing Disabled)</option>
                  </select>
                  <button type="submit" className="bg-white text-black font-bold text-xs py-3 px-4 w-fit hover:bg-gray-200">
                    SAVE STATUS
                  </button>
                </form>

                {/* Secret Drop Visibility */}
                <form onSubmit={handleSaveSetting} className="bg-[#111] border border-white/10 p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold mb-1">Secret Section Visibility</h3>
                    <p className="text-xs text-white/50">Set to "true" to reveal the 0x8F Vault link in navigation.</p>
                  </div>
                  <input type="hidden" name="key" value="show_secret_vault" />
                  <select 
                    name="value"
                    defaultValue={settings.show_secret_vault || "false"}
                    className="w-full bg-black border border-white/20 p-3 text-sm outline-none focus:border-white transition-colors"
                  >
                    <option value="true">Visible to Public</option>
                    <option value="false">Hidden (Require Secret Code)</option>
                  </select>
                  <button type="submit" className="bg-white text-black font-bold text-xs py-3 px-4 w-fit hover:bg-gray-200">
                    SAVE VISIBILITY
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticker Upload/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <div className="bg-[#0a0a0a] border border-white/20 w-full max-w-3xl my-8 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white"
              >
                ✕
              </button>
              
              <div className="p-6 border-b border-white/10">
                <h2 className="font-display font-bold text-xl tracking-widest">
                  {editingSticker?.id ? "EDIT STICKER" : "UPLOAD NEW STICKER"}
                </h2>
              </div>

              <div className="flex flex-col md:flex-row">
                <form id="sticker-form" onSubmit={handleSaveSticker} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">NAME</label>
                    <input name="name" defaultValue={editingSticker?.name} required className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">SLUG</label>
                    <input name="slug" defaultValue={editingSticker?.slug} required className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white" />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-white/50">DESCRIPTION</label>
                    <textarea name="description" defaultValue={editingSticker?.description} rows={2} className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white" />
                  </div>

                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-xs text-white/50">IMAGE URL</label>
                    <input name="image_url" defaultValue={editingSticker?.image_url} required placeholder="/stickers/boot/boot-1.png" className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white font-mono text-sm" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">PRICE (in paise)</label>
                    <input type="number" name="price" defaultValue={editingSticker?.price} required className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">STOCK</label>
                    <input type="number" name="stock" defaultValue={editingSticker?.stock} required className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">COLLECTION</label>
                    <select name="collection" defaultValue={editingSticker?.collection || "STANDARD"} className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white">
                      <option value="STANDARD">STANDARD</option>
                      <option value="BOOT">BOOT</option>
                      <option value="RARE">RARE</option>
                      <option value="CUSTOM">CUSTOM</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-white/50">SLOT NUMBER (1-250)</label>
                    <input type="number" name="slot_number" defaultValue={editingSticker?.slot_number} className="bg-black border border-white/20 px-3 py-2 outline-none focus:border-white" />
                  </div>
                </form>

                <div className="md:w-64 border-l border-white/10 p-6 flex flex-col bg-[#111]">
                  <h3 className="text-sm font-bold tracking-widest mb-4">TAGS</h3>
                  <div className="flex-1 overflow-y-auto pr-2 mb-4">
                    <div className="flex flex-col gap-2">
                      {availableTags.map(tag => (
                        <label key={tag} className="flex items-center gap-2 text-xs font-mono cursor-pointer hover:text-white text-white/70">
                          <input 
                            type="checkbox" 
                            name={`tag_${tag}`} 
                            form="sticker-form"
                            defaultChecked={editingSticker?.tags?.includes(tag)}
                            className="accent-[#b4ff39] w-4 h-4 bg-black border-white/20" 
                          />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-4 mt-auto">
                    <label className="text-[10px] text-white/50 mb-1 block">REGISTER NEW TAG</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTag} 
                        onChange={e => setNewTag(e.target.value)}
                        placeholder="NEW_TAG" 
                        className="w-full bg-black border border-white/20 px-2 py-1 text-xs uppercase outline-none focus:border-white" 
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRegisterTag(e as any);
                          }
                        }}
                      />
                      <button onClick={handleRegisterTag} type="button" className="bg-white text-black px-2 py-1 text-xs font-bold">ADD</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-black">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">CANCEL</button>
                <button type="submit" form="sticker-form" className="px-8 py-2 bg-[#b4ff39] text-black font-bold text-sm tracking-widest hover:bg-white transition-colors">
                  {editingSticker?.id ? "UPDATE" : "PUBLISH"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-white text-black border-2 border-black px-6 py-4 z-[100] shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
          >
            <div className="text-xs font-bold tracking-[0.2em]">{toastMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

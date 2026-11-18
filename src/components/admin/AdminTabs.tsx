"use client";

import React, { useState, useMemo } from "react";
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

  // Order filtering (ALL, DATE, MONTH) and expansion states
  const [orderFilterType, setOrderFilterType] = useState<"ALL" | "DATE" | "MONTH">("ALL");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  // Helper to format date in IST YYYY-MM-DD
  const getOrderDateKey = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(d);
  };

  const filteredOrders = useMemo(() => {
    if (orderFilterType === "DATE" && filterDate) {
      return orders.filter((o: any) => getOrderDateKey(o.created_at) === filterDate);
    }
    if (orderFilterType === "MONTH" && filterMonth) {
      return orders.filter((o: any) => getOrderDateKey(o.created_at).startsWith(filterMonth));
    }
    return orders;
  }, [orders, orderFilterType, filterDate, filterMonth]);

  const paginatedOrders = filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
  const paginatedUsers = users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sticker zip download states
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const formatOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "SHIPPED":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "DELIVERED":
        return "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "PENDING":
      default:
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    }
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
    const listToExport = filteredOrders;
    const csvRows = [
      ["Order ID", "Customer", "User Email", "Phone", "Amount (INR)", "Status", "Date"],
      ...listToExport.map((o: any) => {
        const addr = typeof o.delivery_address === 'string'
          ? (() => { try { return JSON.parse(o.delivery_address); } catch { return {}; } })()
          : (o.delivery_address || {});
        return [
          o.order_number,
          addr.billerName || o.user?.name || "Customer",
          o.user?.email || "N/A",
          addr.billerMobile || "N/A",
          o.total / 100,
          o.payment_status,
          new Date(o.created_at).toISOString()
        ];
      })
    ];
    const csvString = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dott_orders_${orderFilterType.toLowerCase()}.csv`;
    a.click();
  };

  const downloadInvoice = (order: any) => {
    // Open the exact official HTML & printable tax invoice provided to users
    window.open(`/invoice/${order.order_number}`, "_blank");
  };

  const downloadOrderStickersZip = async (order: any) => {
    setDownloadingOrderId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/download-stickers?orderId=${order.id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to download sticker archive");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${order.order_number}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Downloaded stickers for ${order.order_number}`);
    } catch (err: any) {
      console.error("Download error:", err);
      showToast(err.message || "Error downloading stickers zip");
    } finally {
      setDownloadingOrderId(null);
    }
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
            <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Header and Filter Controls */}
              <div className="flex flex-col gap-4 pb-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-widest text-white">ORDER MANAGEMENT</h2>
                    <div className="text-xs text-white/50 font-mono mt-0.5">
                      Showing {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"}
                    </div>
                  </div>

                  <button 
                    onClick={exportCSV} 
                    className="border border-white/30 text-white text-xs px-4 py-2 hover:bg-white hover:text-black transition-colors rounded font-mono cursor-pointer"
                  >
                    EXPORT CSV ↓
                  </button>
                </div>

                {/* Date & Month Filter Selector */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="inline-flex bg-[#111] border border-white/20 p-1 rounded">
                    <button
                      onClick={() => {
                        setOrderFilterType("ALL");
                        setFilterDate("");
                        setFilterMonth("");
                        setOrdersPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-colors cursor-pointer ${
                        orderFilterType === "ALL" ? "bg-white text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      ALL ({orders.length})
                    </button>

                    <button
                      onClick={() => {
                        setOrderFilterType("DATE");
                        setFilterMonth("");
                        setOrdersPage(1);
                        if (!filterDate) {
                          setFilterDate(getOrderDateKey(new Date()));
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-colors cursor-pointer ${
                        orderFilterType === "DATE" ? "bg-white text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      BY DATE
                    </button>

                    <button
                      onClick={() => {
                        setOrderFilterType("MONTH");
                        setFilterDate("");
                        setOrdersPage(1);
                        if (!filterMonth) {
                          setFilterMonth(getOrderDateKey(new Date()).slice(0, 7));
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded transition-colors cursor-pointer ${
                        orderFilterType === "MONTH" ? "bg-white text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      BY MONTH
                    </button>
                  </div>

                  {/* Date Input */}
                  {orderFilterType === "DATE" && (
                    <div className="flex items-center gap-2 bg-[#111] border border-white/20 px-3 py-1.5 rounded">
                      <span className="text-[10px] text-white/50 uppercase font-mono">DATE:</span>
                      <input 
                        type="date"
                        value={filterDate}
                        onChange={(e) => {
                          setFilterDate(e.target.value);
                          setOrdersPage(1);
                        }}
                        className="bg-black text-white text-xs px-2 py-1 border border-white/20 rounded font-mono outline-none focus:border-[#b4ff39]"
                      />
                      <button
                        onClick={() => {
                          setFilterDate(getOrderDateKey(new Date()));
                          setOrdersPage(1);
                        }}
                        className="text-[10px] font-bold px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors cursor-pointer font-mono"
                      >
                        TODAY
                      </button>
                    </div>
                  )}

                  {/* Month Input */}
                  {orderFilterType === "MONTH" && (
                    <div className="flex items-center gap-2 bg-[#111] border border-white/20 px-3 py-1.5 rounded">
                      <span className="text-[10px] text-white/50 uppercase font-mono">MONTH:</span>
                      <input 
                        type="month"
                        value={filterMonth}
                        onChange={(e) => {
                          setFilterMonth(e.target.value);
                          setOrdersPage(1);
                        }}
                        className="bg-black text-white text-xs px-2 py-1 border border-white/20 rounded font-mono outline-none focus:border-[#b4ff39]"
                      />
                    </div>
                  )}

                  {/* Reset filter button */}
                  {orderFilterType !== "ALL" && (
                    <button
                      onClick={() => {
                        setOrderFilterType("ALL");
                        setFilterDate("");
                        setFilterMonth("");
                        setOrdersPage(1);
                      }}
                      className="text-[11px] text-white/50 hover:text-white underline font-mono px-2 cursor-pointer"
                    >
                      RESET
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Card View (< md) */}
              <div className="space-y-3 md:hidden">
                {paginatedOrders.length === 0 ? (
                  <div className="text-center py-12 text-white/40 font-mono text-xs border border-white/10 p-6 rounded bg-[#111]">
                    No orders found for the selected filter.
                  </div>
                ) : (
                  paginatedOrders.map((order: any) => {
                    const isExpanded = expandedOrderId === order.id;
                    const addr = typeof order.delivery_address === 'string' 
                      ? (() => { try { return JSON.parse(order.delivery_address); } catch { return {}; } })() 
                      : (order.delivery_address || {});
                    const customerName = addr.billerName || order.user?.name || "Customer";
                    const totalStickerCount = order.items?.reduce((acc: any, i: any) => acc + i.quantity, 0) || 0;

                    return (
                      <div key={order.id} className="border border-white/15 bg-[#111] rounded-lg overflow-hidden transition-all">
                        {/* Mobile Card Header */}
                        <div 
                          onClick={() => toggleOrderExpand(order.id)}
                          className="p-4 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-bold text-white text-xs font-mono tracking-wider">{order.order_number}</span>
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${getStatusBadge(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                          </div>

                          <div className="text-xs text-white/90 font-medium truncate mb-0.5">
                            {customerName}
                          </div>
                          <div className="text-[11px] text-white/50 font-mono truncate mb-3">
                            {order.user?.email || "N/A"}
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 font-mono">
                            <span className="text-white/60">{formatOrderDate(order.created_at)}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white/50 text-[11px]">{totalStickerCount} {totalStickerCount === 1 ? 'sticker' : 'stickers'}</span>
                              <span className="font-bold text-white text-sm">₹{order.total / 100}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#b4ff39] font-mono tracking-widest uppercase py-1 bg-white/5 rounded border border-white/10">
                            <span>{isExpanded ? "HIDE DETAILS ▲" : "VIEW ORDER ▼"}</span>
                          </div>
                        </div>

                        {/* Mobile Expanded Drawer */}
                        {isExpanded && (
                          <div className="border-t border-white/15 bg-black p-4 space-y-4">
                            {/* Address & Customer details */}
                            <div className="bg-[#151515] border border-white/10 p-3 rounded text-xs space-y-2">
                              <div className="text-white/40 uppercase tracking-widest text-[9px] font-mono">DELIVERY ADDRESS</div>
                              <div className="font-bold text-white">{customerName}</div>
                              {addr.billerMobile && (
                                <div className="text-white/70 font-mono text-[11px]">📞 {addr.billerMobile}</div>
                              )}
                              <div className="text-white/70 leading-relaxed font-mono text-[11px]">
                                {addr.houseFlat ? `${addr.houseFlat}, ` : ""}
                                {addr.streetArea ? `${addr.streetArea}, ` : ""}
                                {addr.cityName ? `${addr.cityName}, ` : ""}
                                {addr.stateIso ? `${addr.stateIso} ` : ""}
                                {addr.pincode ? `PIN: ${addr.pincode}` : ""}
                                {!addr.cityName && !addr.houseFlat && "No address details provided"}
                              </div>
                            </div>

                            {/* Status Selector */}
                            <div className="bg-[#151515] border border-white/10 p-3 rounded flex items-center justify-between gap-2">
                              <span className="text-[10px] text-white/50 uppercase font-mono">STATUS:</span>
                              <select 
                                className="bg-black border border-white/30 text-xs px-2 py-1.5 rounded outline-none focus:border-[#b4ff39] font-mono text-white"
                                defaultValue={order.payment_status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="COMPLETED">COMPLETED</option>
                                <option value="SHIPPED">SHIPPED</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>

                            {/* Stickers Ordered */}
                            <div>
                              <div className="text-[10px] text-white/50 uppercase tracking-widest font-mono mb-2">
                                STICKERS ORDERED ({totalStickerCount})
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {order.items?.map((item: any) => (
                                  <div key={item.id} className="bg-[#151515] border border-white/10 p-2 rounded flex flex-col justify-between">
                                    <div className="aspect-square bg-black rounded flex items-center justify-center p-2 mb-2 overflow-hidden border border-white/5">
                                      {item.sticker?.image_url ? (
                                        <img src={item.sticker.image_url} alt={item.sticker.name} className="w-full h-full object-contain" />
                                      ) : (
                                        <span className="text-[9px] text-white/30">N/A</span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-bold text-white text-[11px] truncate" title={item.sticker?.name}>
                                        {item.sticker?.name || "Sticker"}
                                      </div>
                                      <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                                        <span className="bg-[#b4ff39]/20 text-[#b4ff39] px-1 py-0.5 rounded font-bold">x{item.quantity}</span>
                                        <span className="text-white/60">₹{(item.price || 0) / 100}</span>
                                      </div>
                                      <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                        {item.sticker?.size || "5cm"} · {item.sticker?.finish || "GLOSS"}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2 pt-2">
                              <button
                                onClick={() => downloadOrderStickersZip(order)}
                                disabled={downloadingOrderId === order.id}
                                className="w-full bg-white hover:bg-[#b4ff39] text-black font-bold text-xs py-3 rounded transition-colors tracking-wider text-center flex items-center justify-center disabled:opacity-50 cursor-pointer"
                              >
                                {downloadingOrderId === order.id ? "ZIPPING..." : "DOWNLOAD ZIP"}
                              </button>

                              <button
                                onClick={() => downloadInvoice(order)}
                                className="w-full bg-white/10 hover:bg-white hover:text-black border border-white/30 text-white font-bold text-xs py-3 rounded transition-colors tracking-wider text-center cursor-pointer"
                              >
                                INVOICE ↗
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block border border-white/15 rounded-lg overflow-hidden bg-black">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-white/50 border-b border-white/20 uppercase tracking-widest bg-[#111]">
                    <tr>
                      <th className="py-3 px-4">Order Details</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Stickers</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-white/40 font-mono text-xs">
                          No orders found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((order: any) => {
                        const isExpanded = expandedOrderId === order.id;
                        const addr = typeof order.delivery_address === 'string' 
                          ? (() => { try { return JSON.parse(order.delivery_address); } catch { return {}; } })() 
                          : (order.delivery_address || {});
                        const customerName = addr.billerName || order.user?.name || "Customer";
                        const customerPhone = addr.billerMobile || "N/A";
                        const totalStickers = order.items?.reduce((acc: any, i: any) => acc + i.quantity, 0) || 0;

                        return (
                          <React.Fragment key={order.id}>
                            {/* Summary Row (Clickable) */}
                            <tr 
                              onClick={() => toggleOrderExpand(order.id)}
                              className={`border-b border-white/10 transition-colors cursor-pointer select-none ${
                                isExpanded ? "bg-white/10" : "hover:bg-white/5"
                              }`}
                            >
                              <td className="py-4 px-4 font-body">
                                <div className="font-bold text-white text-xs tracking-wider font-mono">{order.order_number}</div>
                                <div className="text-[10px] text-white/40 mt-1 font-mono">{formatOrderDate(order.created_at)}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-semibold text-white text-xs">{customerName}</div>
                                <div className="text-[11px] text-white/60 font-mono mt-0.5 truncate max-w-[200px]">{order.user?.email}</div>
                                {customerPhone !== "N/A" && (
                                  <div className="text-[10px] text-white/40 font-mono mt-0.5">📞 {customerPhone}</div>
                                )}
                              </td>
                              <td className="py-4 px-4 font-mono text-xs">
                                <span className="bg-white/10 text-white px-2 py-1 rounded font-bold text-[11px]">
                                  {totalStickers} {totalStickers === 1 ? 'sticker' : 'stickers'}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-body whitespace-nowrap">
                                <div className="font-bold text-white text-sm">₹{order.total / 100}</div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded ${getStatusBadge(order.payment_status)}`}>
                                  {order.payment_status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadOrderStickersZip(order);
                                    }}
                                    disabled={downloadingOrderId === order.id}
                                    title={`Download ZIP of sticker images for ${order.order_number}`}
                                    className="bg-white/10 border border-white/25 hover:border-[#b4ff39] hover:bg-[#b4ff39] text-white hover:text-black text-[10px] font-bold px-3 py-1.5 transition-all tracking-wider rounded disabled:opacity-50 cursor-pointer"
                                  >
                                    {downloadingOrderId === order.id ? "ZIPPING..." : "DOWNLOAD ZIP"}
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadInvoice(order);
                                    }}
                                    className="bg-[#b4ff39] text-black text-[10px] font-bold px-3 py-1.5 hover:bg-white transition-colors tracking-wider rounded cursor-pointer"
                                  >
                                    INVOICE ↗
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleOrderExpand(order.id);
                                    }}
                                    className="text-white/60 hover:text-white px-2 py-1 text-xs font-mono"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                  >
                                    {isExpanded ? "▲" : "▼"}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Desktop Expanded Drawer */}
                            {isExpanded && (
                              <tr className="bg-[#0A0A0A] border-b border-white/20">
                                <td colSpan={6} className="p-6">
                                  <div className="space-y-6">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10 text-xs">
                                      {/* Customer Info */}
                                      <div className="bg-[#111] border border-white/10 p-4 rounded">
                                        <div className="text-white/40 uppercase tracking-widest text-[9px] font-mono mb-2">CUSTOMER DETAILS</div>
                                        <div className="font-bold text-white text-sm">{customerName}</div>
                                        <div className="text-white/70 font-mono mt-1 text-xs">{order.user?.email || "N/A"}</div>
                                        {customerPhone !== "N/A" && (
                                          <div className="text-white/60 font-mono mt-1 text-xs">📞 {customerPhone}</div>
                                        )}
                                      </div>

                                      {/* Delivery Address */}
                                      <div className="bg-[#111] border border-white/10 p-4 rounded">
                                        <div className="text-white/40 uppercase tracking-widest text-[9px] font-mono mb-2">DELIVERY ADDRESS</div>
                                        <div className="text-white/80 leading-relaxed font-mono text-xs">
                                          {addr.houseFlat ? `${addr.houseFlat}, ` : ""}
                                          {addr.streetArea ? `${addr.streetArea}, ` : ""}
                                          {addr.cityName ? `${addr.cityName}, ` : ""}
                                          {addr.stateIso ? `${addr.stateIso} ` : ""}
                                          {addr.pincode ? `PIN: ${addr.pincode}` : ""}
                                          {!addr.cityName && !addr.houseFlat && "No address details provided"}
                                        </div>
                                      </div>

                                      {/* Order Summary & Status Selector */}
                                      <div className="bg-[#111] border border-white/10 p-4 rounded flex flex-col justify-between">
                                        <div>
                                          <div className="text-white/40 uppercase tracking-widest text-[9px] font-mono mb-2">STATUS & TOTAL</div>
                                          <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="text-white/60 font-mono">Order Total:</span>
                                            <span className="font-bold text-white text-base font-mono">₹{order.total / 100}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                          <span className="text-[10px] text-white/50 uppercase font-mono">UPDATE STATUS:</span>
                                          <select 
                                            className="bg-black border border-white/30 text-xs px-2 py-1.5 rounded outline-none focus:border-[#b4ff39] font-mono text-white flex-1"
                                            defaultValue={order.payment_status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                          >
                                            <option value="PENDING">PENDING</option>
                                            <option value="COMPLETED">COMPLETED</option>
                                            <option value="SHIPPED">SHIPPED</option>
                                            <option value="DELIVERED">DELIVERED</option>
                                            <option value="CANCELLED">CANCELLED</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Stickers Gallery */}
                                    <div>
                                      <div className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
                                        ORDERED STICKERS ({totalStickers} items)
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {order.items?.map((item: any) => (
                                          <div key={item.id} className="bg-[#111] border border-white/15 p-2.5 rounded flex flex-col justify-between">
                                            <div className="aspect-square bg-black border border-white/10 rounded flex items-center justify-center p-2 mb-2 overflow-hidden">
                                              {item.sticker?.image_url ? (
                                                <img src={item.sticker.image_url} alt={item.sticker.name} className="w-full h-full object-contain" />
                                              ) : (
                                                <span className="text-[9px] text-white/30 font-mono">NO IMAGE</span>
                                              )}
                                            </div>
                                            <div>
                                              <div className="font-bold text-white text-xs truncate" title={item.sticker?.name}>
                                                {item.sticker?.name || "Sticker"}
                                              </div>
                                              <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                                                <span className="bg-[#b4ff39]/20 text-[#b4ff39] px-1.5 py-0.5 rounded font-bold">x{item.quantity}</span>
                                                <span className="text-white/70">₹{(item.price || 0) / 100}</span>
                                              </div>
                                              <div className="text-[10px] text-white/40 font-mono mt-0.5">
                                                {item.sticker?.size || "5cm"} · {item.sticker?.finish || "GLOSS"}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Bottom Action Buttons */}
                                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadOrderStickersZip(order);
                                        }}
                                        disabled={downloadingOrderId === order.id}
                                        className="bg-white hover:bg-[#b4ff39] text-black font-bold text-xs px-4 py-2.5 rounded transition-colors tracking-wider disabled:opacity-50 cursor-pointer"
                                      >
                                        {downloadingOrderId === order.id ? "ZIPPING..." : "DOWNLOAD ZIP"}
                                      </button>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          downloadInvoice(order);
                                        }}
                                        className="bg-white/10 hover:bg-white hover:text-black border border-white/30 text-white font-bold text-xs px-4 py-2.5 rounded transition-colors tracking-wider cursor-pointer"
                                      >
                                        INVOICE ↗
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex justify-between items-center text-xs tracking-widest text-white/50 font-mono">
                <button 
                  disabled={ordersPage === 1}
                  onClick={() => setOrdersPage(p => p - 1)}
                  className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-30 transition-colors cursor-pointer rounded"
                >
                  PREVIOUS
                </button>
                <span>PAGE {ordersPage} OF {Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))}</span>
                <button 
                  disabled={ordersPage * itemsPerPage >= filteredOrders.length}
                  onClick={() => setOrdersPage(p => p + 1)}
                  className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-30 transition-colors cursor-pointer rounded"
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

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottIdCard from "@/components/ui/DottIdCard";
import { toPng } from "html-to-image";
import { ShieldCheck, Package, Zap, History, Download, ArrowUpRight, Crosshair } from "lucide-react";
import TierPerksModal from "./TierPerksModal";

export default function ProfileTabs({ user, hasPassword, currentTarget, progress }: any) {
  const [activeTab, setActiveTab] = useState("DOTT ID");
  const [stars, setStars] = useState<{id: number, left: string, top: string, size: number, delay: number, duration: number, parallax: number}[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

  const displayOrders = user?.orders?.filter((o: any) => o.payment_status !== "PENDING") || [];

  useEffect(() => {
    setStars(Array.from({length: 1000}).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() > 0.9 ? 2 : 1,
      delay: Math.random() * 10,
      duration: Math.random() * 10 + 10,
      parallax: Math.random() * 100 - 50 // Parallax intensity
    })));
  }, []);

  const downloadIDCard = async () => {
    const element = document.getElementById("dott-id-card-render");
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { 
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "rgba(0,0,0,0)",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
        filter: (node) => {
          if (node.nodeType === 1) {
            return !(node as HTMLElement).classList?.contains('hide-on-download');
          }
          return true;
        }
      });
      const link = document.createElement("a");
      link.download = `DOTT-ID-${user.dott_handle || user.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to download image", e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Tabs Header */}
      <div className="flex md:justify-center border-b border-white/10 mb-8 overflow-x-auto no-scrollbar pb-1">
        {["DOTT ID", "OVERVIEW", "ORDERS", "SETTINGS"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 md:px-8 py-4 text-[10px] md:text-xs font-bold tracking-[0.2em] whitespace-nowrap transition-colors relative ${
              activeTab === tab ? "text-white" : "text-white/40 hover:text-white/80"
            }`}
          >
            {tab}
            {activeTab === tab && (
               <motion.div
                 layoutId="activeTabProfile"
                 className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
               />
            )}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === "OVERVIEW" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`relative border backdrop-blur-md p-6 flex flex-col justify-between aspect-square overflow-hidden group ${user.tier === 'GRID' ? 'border-[#b4ff39]/30 bg-[#b4ff39]/5 shadow-[inset_0_0_20px_rgba(180,255,57,0.05)]' : 'border-white/10 bg-white/5'}`}>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-start">
                    <div className={`text-[10px] tracking-widest ${user.tier === 'GRID' ? 'text-[#b4ff39]/70' : 'text-white/50'}`}>DROPS SECURED</div>
                    <Package className={`w-4 h-4 ${user.tier === 'GRID' ? 'text-[#b4ff39]/50' : 'text-white/30'}`} />
                  </div>
                  <div className={`font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter drop-shadow-md ${user.tier === 'GRID' ? 'text-[#b4ff39]' : 'text-white'}`}>{user.total_orders.toString().padStart(2, '0')}</div>
                </div>

                <div className={`relative border backdrop-blur-md p-6 flex flex-col justify-between aspect-square overflow-hidden group ${user.tier === 'GRID' ? 'border-[#b4ff39]/30 bg-[#b4ff39]/5 shadow-[inset_0_0_20px_rgba(180,255,57,0.05)]' : 'border-white/10 bg-white/5'}`}>
                  <div className="flex justify-between items-start">
                    <div className={`text-[10px] tracking-widest ${user.tier === 'GRID' ? 'text-[#b4ff39]/70' : 'text-white/50'}`}>VAULT STICKERS</div>
                    <Crosshair className={`w-4 h-4 ${user.tier === 'GRID' ? 'text-[#b4ff39]/50' : 'text-white/30'}`} />
                  </div>
                  <div className={`font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter drop-shadow-md ${user.tier === 'GRID' ? 'text-[#b4ff39]' : 'text-white'}`}>{user.total_stickers_bought || 0}</div>
                </div>

                <div className="relative border border-[#b4ff39]/20 bg-[#b4ff39]/5 backdrop-blur-md p-6 flex flex-col justify-between aspect-square overflow-hidden group shadow-[inset_0_0_20px_rgba(180,255,57,0.05)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,255,57,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="flex justify-between items-start z-10">
                    <div className="text-[10px] tracking-widest text-[#b4ff39]/70">ECHO POINTS</div>
                    <Zap className="w-4 h-4 text-[#b4ff39]/50" />
                  </div>
                  <div className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-[#b4ff39] drop-shadow-[0_0_12px_rgba(180,255,57,0.4)] z-10">{user.points || 0}</div>
                </div>

                <div className="relative border border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col justify-between aspect-square overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="text-[10px] tracking-widest text-white/50">MEMBER SINCE</div>
                    <History className="w-4 h-4 text-white/30" />
                  </div>
                  <div className="font-display text-sm md:text-xl font-extrabold uppercase tracking-tighter drop-shadow-md break-words">
                    {new Date(user.created_at).toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Tier Progress */}
              <div className="border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-md p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                
                <h3 className="font-bold tracking-[0.2em] text-sm mb-8 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> TIER STATUS
                </h3>
                
                <div className="flex-1 flex flex-col justify-center relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
                    <div>
                      <div className="text-[10px] text-white/50 tracking-widest mb-1">CURRENT RANKING</div>
                      <div className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{user.tier}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] tracking-widest mb-1 ${user.tier === 'GRID' ? 'text-[#b4ff39]/50' : 'text-white/50'}`}>NEXT ASCENSION</div>
                      <div className={`font-bold tracking-widest text-sm bg-white/10 px-3 py-1 rounded-sm border ${user.tier === 'GRID' ? 'border-[#b4ff39]/30 text-[#b4ff39]' : 'border-white/10'}`}>
                        {currentTarget > 0 ? `${user.total_orders} / ${currentTarget} DROPS` : "MAX TIER"}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar with glow dot */}
                  <div className="h-2 w-full bg-[#1A1A1A] relative rounded-full overflow-visible">
                    <motion.div 
                      className={`absolute top-0 left-0 h-full rounded-full ${user.tier === 'GRID' ? 'bg-gradient-to-r from-[#b4ff39]/50 to-[#b4ff39] shadow-[0_0_15px_rgba(180,255,57,0.8)]' : 'bg-gradient-to-r from-white/50 to-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'}`} 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                    >
                      <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full translate-x-1/2 ${user.tier === 'GRID' ? 'bg-[#b4ff39] shadow-[0_0_15px_rgba(180,255,57,1)]' : 'bg-white shadow-[0_0_12px_rgba(255,255,255,1)]'}`} />
                    </motion.div>
                  </div>
                  
                  {currentTarget > 0 && (
                    <div className="mt-6 text-[10px] tracking-widest text-white/50 text-right flex justify-end items-center gap-2">
                      <ArrowUpRight className="w-3 h-3" />
                      {currentTarget - user.total_orders} MORE DROPS TO REACH {user.tier === "PIXEL" ? "GRID" : "MARK"}
                    </div>
                  )}

                  <button 
                    onClick={() => setIsTierModalOpen(true)}
                    className="mt-8 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all text-[10px] font-bold tracking-[0.2em] py-4 px-6 w-full shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                  >
                    EXPLORE ASCENSION TIERS & PERKS
                  </button>
                </div>

                {/* Badges Preview */}
                <div className="mt-12 pt-8 border-t border-white/10">
                  <div className="text-[10px] tracking-widest text-white/50 mb-4">ACQUIRED BADGES</div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full border border-white/40 bg-white/5 flex items-center justify-center text-[10px] font-bold tracking-wider shadow-[0_0_10px_rgba(255,255,255,0.1)]">PXL</div>
                    {user.total_orders >= 1 && <div className="w-12 h-12 rounded-full border border-[#b4ff39]/50 bg-[#b4ff39]/10 text-[#b4ff39] flex items-center justify-center text-[10px] font-bold tracking-wider shadow-[0_0_10px_rgba(180,255,57,0.2)]">1ST</div>}
                    {user.tier !== "PIXEL" && <div className="w-12 h-12 rounded-full border border-white/40 bg-white/5 flex items-center justify-center text-[10px] font-bold tracking-wider">TR2</div>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "ORDERS" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {displayOrders.length === 0 ? (
                <div className="border border-white/10 bg-white/5 backdrop-blur-md p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="mb-8 opacity-20"
                  >
                    <Package className="w-24 h-24" />
                  </motion.div>
                  <div className="font-display text-2xl font-bold tracking-widest mb-2 text-white/80">NO DROPS SECURED</div>
                  <div className="tracking-widest text-xs text-white/40 max-w-sm">
                    YOUR SHIPPING MANIFEST IS CURRENTLY EMPTY. SECURE YOUR FIRST STICKER DROP TO INITIALIZE TRACKING.
                  </div>
                </div>
              ) : (
                displayOrders.map((order: any) => (
                  <div key={order.id} className="border border-white/20 bg-[#050505] overflow-hidden group hover:border-white/40 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-white/10 bg-white/[0.02]">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-display font-bold tracking-[0.2em] text-lg text-white/90">{order.order_number}</span>
                          <span className={`text-[9px] px-2 py-1 tracking-[0.2em] font-bold ${
                            order.payment_status === "COMPLETED" ? "bg-white text-black" : "bg-red-500/10 text-red-500 border border-red-500/30"
                          }`}>
                            {order.payment_status === "COMPLETED" ? "SECURED" : "FAILED"}
                          </span>
                        </div>
                        <div className="text-xs text-white/40 tracking-widest font-mono">
                          {new Date(order.created_at).toLocaleString()}
                          {order.payment_status !== "COMPLETED" && order.razorpay_payment_id && (
                            <>
                              <span className="mx-2">•</span>
                              <span>TXN: {order.razorpay_payment_id}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0 flex items-center gap-8">
                        <div className="text-right">
                          <div className="font-display font-bold text-xl">₹{(order.total / 100).toFixed(2)}</div>
                          <div className="text-[9px] text-white/40 tracking-[0.2em]">TOTAL SECURED</div>
                        </div>
                        {order.payment_status === "COMPLETED" ? (
                          <a 
                            href={`/invoice/${order.order_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 border px-4 py-3 text-[10px] font-bold tracking-[0.2em] transition-colors border-white/30 hover:bg-white hover:text-black cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            INVOICE
                          </a>
                        ) : (
                          <button 
                            disabled
                            className="flex items-center gap-2 border px-4 py-3 text-[10px] font-bold tracking-[0.2em] transition-colors border-white/10 text-white/30 cursor-not-allowed"
                          >
                            <Download className="w-3 h-3" />
                            INVOICE
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="text-[10px] text-white/30 tracking-[0.2em] mb-4">MANIFEST CONTENTS</div>
                      <div className="flex flex-wrap gap-3">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 pr-6 hover:bg-white/10 transition-colors">
                            <div className="w-10 h-10 bg-black flex items-center justify-center p-1 border border-white/5">
                              <img src={item.sticker.image_url} alt={item.sticker.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <div className="text-xs font-bold tracking-wider mb-1 text-white/90">{item.sticker.name}</div>
                              <div className="text-[10px] text-white/50 font-mono tracking-widest">QTY: {item.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "DOTT ID" && (
            <motion.div
              key="dott-id"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePosition({
                  x: (e.clientX - rect.left) / rect.width - 0.5,
                  y: (e.clientY - rect.top) / rect.height - 0.5
                });
              }}
              className="relative flex flex-col items-center justify-center py-12 min-h-[600px] border border-white/10 bg-gradient-to-b from-white/5 to-[#000000] overflow-hidden"
            >
              {/* Ambient pulsating background light */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 blur-[100px] rounded-full pointer-events-none" />
              
              {/* Retro Perspective Grid */}
              <div className="absolute bottom-0 left-0 w-full h-[60%] overflow-hidden pointer-events-none z-0">
                {/* Fade out at the horizon */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#000000] to-transparent z-10" />
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200vw] h-[100vh] origin-bottom"
                  style={{ perspective: "1000px" }}
                >
                  <div 
                    className="w-full h-full border-t border-white/20"
                    style={{ 
                      transform: "rotateX(75deg)",
                      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)",
                      backgroundSize: "40px 40px"
                    }}
                  />
                </div>
              </div>

              {/* Space Galaxy Pixel Stars Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
                {stars.map((star) => (
                  <motion.div
                    key={star.id}
                    className="absolute bg-white"
                    style={{
                      width: star.size,
                      height: star.size,
                      left: star.left,
                      top: star.top,
                      transform: `translate(${mousePosition.x * star.parallax}px, ${mousePosition.y * star.parallax}px)`
                    }}
                    animate={{
                      y: [0, -200]
                    }}
                    transition={{
                      duration: star.duration,
                      repeat: Infinity,
                      ease: "linear",
                      delay: star.delay
                    }}
                  />
                ))}
              </div>



              <div id="dott-id-card-render" className="relative p-8 pb-16 flex flex-col items-center justify-center w-full z-10">
                <DottIdCard 
                  user={{
                    name: user.name || "UNKNOWN",
                    dott_handle: user.dott_handle || user.id.slice(0,8),
                    tier: user.tier,
                    member_since: user.created_at,
                    orders: user.total_orders,
                    points: user.points,
                    avatar_url: user.avatar_url,
                  }} 
                />
                

              </div>
              
              <button 
                onClick={downloadIDCard}
                className="relative z-20 mt-8 flex items-center gap-2 bg-white text-black px-8 py-4 text-xs font-bold tracking-[0.2em] hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <Download className="w-4 h-4" />
                EXPORT DIGITAL ID
              </button>
            </motion.div>
          )}

          {activeTab === "SETTINGS" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-xl mx-auto space-y-12 py-8 px-4"
            >
              {/* Name Update */}
              <div className="space-y-4">
                <h3 className="font-display font-bold tracking-widest border-b border-white/10 pb-2">FULL NAME</h3>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    id="nameInput"
                    defaultValue={user.name || ""}
                    placeholder="ENTER FULL NAME"
                    className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:border-white transition-colors uppercase"
                  />
                  <button 
                    onClick={async () => {
                      const input = document.getElementById('nameInput') as HTMLInputElement;
                      const val = input.value;
                      if (!val) return;
                      try {
                        const res = await fetch('/api/user/settings', {
                          method: 'POST', body: JSON.stringify({ type: 'name', payload: val })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert("NAME UPDATED SUCCESSFULLY");
                          window.location.reload();
                        } else {
                          alert(data.error);
                        }
                      } catch (e) {
                        alert("ERROR UPDATING NAME");
                      }
                    }}
                    className="bg-white text-black font-bold tracking-[0.2em] text-xs py-3 px-6 hover:bg-gray-200 transition-colors w-max"
                  >
                    UPDATE NAME
                  </button>
                </div>
              </div>

              {/* Username Update */}
              <div className="space-y-4">
                <h3 className="font-display font-bold tracking-widest border-b border-white/10 pb-2">USERNAME</h3>
                <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    id="usernameInput"
                    defaultValue={user.dott_handle || ""}
                    placeholder="ENTER NEW USERNAME"
                    className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:border-white transition-colors uppercase"
                  />
                  <button 
                    onClick={async () => {
                      const input = document.getElementById('usernameInput') as HTMLInputElement;
                      const val = input.value;
                      if (!val) return;
                      try {
                        const res = await fetch('/api/user/settings', {
                          method: 'POST', body: JSON.stringify({ type: 'username', payload: val })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert("USERNAME UPDATED SUCCESSFULLY");
                          window.location.reload();
                        } else {
                          alert(data.error);
                        }
                      } catch (e) {
                        alert("ERROR UPDATING USERNAME");
                      }
                    }}
                    className="bg-white text-black font-bold tracking-[0.2em] text-xs py-3 px-6 hover:bg-gray-200 transition-colors w-max"
                  >
                    UPDATE USERNAME
                  </button>
                </div>
              </div>

              {/* Password Update */}
              <div className="space-y-4">
                <h3 className="font-display font-bold tracking-widest border-b border-white/10 pb-2">PASSWORD</h3>
                {!hasPassword && (
                  <p className="text-[10px] text-white/50 tracking-[0.2em] mb-4">
                    /// SYSTEM DETECTS G-AUTH LOGIN. NO PASSWORD SET. 
                    <br/>
                    /// SET A PASSWORD BELOW TO ENABLE DIRECT EMAIL LOGIN.
                  </p>
                )}
                <div className="flex flex-col gap-2">
                  <input 
                    type="password" 
                    id="passwordInput"
                    placeholder={hasPassword ? "ENTER NEW PASSWORD" : "SET A PASSWORD"}
                    className="w-full bg-transparent border border-white/20 px-4 py-3 text-sm font-bold tracking-widest focus:outline-none focus:border-white transition-colors"
                  />
                  <button 
                    onClick={async () => {
                      const input = document.getElementById('passwordInput') as HTMLInputElement;
                      const val = input.value;
                      if (!val) return;
                      try {
                        const res = await fetch('/api/user/settings', {
                          method: 'POST', body: JSON.stringify({ type: 'password', payload: val })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert("PASSWORD UPDATED SUCCESSFULLY");
                          input.value = "";
                        } else {
                          alert(data.error);
                        }
                      } catch (e) {
                        alert("ERROR UPDATING PASSWORD");
                      }
                    }}
                    className="bg-white text-black font-bold tracking-[0.2em] text-xs py-3 px-6 hover:bg-gray-200 transition-colors w-max"
                  >
                    {hasPassword ? "CHANGE PASSWORD" : "SET PASSWORD"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <TierPerksModal isOpen={isTierModalOpen} onClose={() => setIsTierModalOpen(false)} currentDrops={user.total_orders} />
    </div>
  );
}

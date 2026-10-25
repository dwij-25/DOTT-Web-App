"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Sticker } from "@prisma/client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useCartStore, useUIStore } from "@/lib/store";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function StandardVault({ initialStickers, limit }: { initialStickers: Sticker[], limit?: number }) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<"STICKERS" | "STAMPS" | "POSTERS">("STICKERS");
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  // Compute tag frequencies across all active stickers, sorted by most used first
  const tagFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    initialStickers.forEach(st => {
      (st.tags || []).forEach(rawTag => {
        const t = rawTag.trim().toUpperCase();
        if (t && t !== "STANDARD" && t !== "BOOT" && t !== "DROP") {
          counts[t] = (counts[t] || 0) + 1;
        }
      });
    });
    // Most used tag first, least used last
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [initialStickers]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute live suggestions when user types in search
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { tags: [], stickers: [] };

    const matchingTags = tagFrequencies
      .filter(([tag]) => tag.toLowerCase().includes(q))
      .slice(0, 5);

    const matchingStickers = initialStickers
      .filter(st => {
        const nameMatch = st.name.toLowerCase().includes(q);
        const tagMatch = st.tags?.some(t => t.toLowerCase().includes(q));
        return nameMatch || tagMatch;
      })
      .slice(0, 6);

    return { tags: matchingTags, stickers: matchingStickers };
  }, [search, tagFrequencies, initialStickers]);

  // We generate at least 250 slots, but if there are more stickers we extend the vault.
  const maxSlot = Math.max(250, ...initialStickers.map(st => st.slot_number || 0));
  const slots = useMemo(() => {
    return Array.from({ length: maxSlot }, (_, i) => {
      const s = initialStickers.find(st => st.slot_number === i + 1);
      return s || { slot_number: i + 1, is_empty: true };
    });
  }, [maxSlot, initialStickers]);

  const filteredSlots = useMemo(() => {
    return slots.filter((slot: any) => {
      const tags: string[] = slot.tags || [];
      const isStamp = tags.includes("STAMP");
      const isPoster = tags.includes("POSTER");
      
      if (activeTab === "STAMPS" && !isStamp) return false;
      if (activeTab === "POSTERS" && !isPoster) return false;
      if (activeTab === "STICKERS" && (isStamp || isPoster)) return false;

      // Empty slot handling
      if (slot.is_empty) {
        if (activeTab !== "STICKERS") return false;
        // If user is searching or has selected a tag, hide empty slots
        if (search.trim() !== "" || selectedTag !== null) return false;
        return true;
      }
      
      // Selected tag filter
      if (selectedTag) {
        const hasTag = tags.some(t => t.toUpperCase() === selectedTag.toUpperCase());
        if (!hasTag) return false;
      }

      // Search text filter: matches sticker name OR any of its tags
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const nameMatch = slot.name?.toLowerCase().includes(q);
        const tagMatch = tags.some((t: string) => t.toLowerCase().includes(q));
        if (!nameMatch && !tagMatch) return false;
      }
        
      return true;
    });
  }, [slots, activeTab, search, selectedTag]);

  const [visibleCount, setVisibleCount] = useState(limit || 40);
  const displayedSlots = limit ? filteredSlots.slice(0, limit) : filteredSlots.slice(0, visibleCount);

  return (
    <section className="relative w-full min-h-screen bg-[#0A0A0A] p-8 md:p-16 lg:p-24 overflow-hidden z-10 font-body">
      <div className="max-w-7xl mx-auto">
        {/* Futuristic Marquee Header */}
        <div className="relative overflow-hidden mb-12 border-y border-white/20 py-6 -mx-8 md:-mx-16 lg:-mx-24 bg-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 pointer-events-none" />
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex w-max"
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-16 px-8 text-2xl md:text-4xl font-pixel text-white tracking-[0.2em] uppercase items-center">
                <span className="text-[#b4ff39]">///</span>
                <span>THE VAULT</span>
                <span className="text-[#b4ff39]">///</span>
                <span>SECURE YOUR MANIFEST</span>
                <span className="text-[#b4ff39]">///</span>
                <span>THE VAULT</span>
                <span className="text-[#b4ff39]">///</span>
                <span>SYSTEM OVERRIDE</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Custom Stickers Long Button (Only on full vault) */}
        {!limit && (
          <div className="mb-12">
            <Link 
              href="/custom"
              className="group relative flex flex-col md:flex-row md:items-center justify-between w-full border border-white/20 bg-[#0D0D0D] p-6 hover:border-[#b4ff39]/50 transition-colors overflow-hidden gap-6"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px]" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex flex-col">
                  <div className="text-[#b4ff39] font-pixel text-[10px] tracking-[0.2em] mb-1">/// SYSTEM OVERRIDE</div>
                  <h2 className="font-display font-black text-2xl uppercase group-hover:text-[#b4ff39] transition-colors">CREATE CUSTOM STICKERS</h2>
                </div>
                <p className="text-white/50 text-xs max-w-xl md:ml-8 leading-relaxed">
                  Your identity. Your design. Create a custom text sticker or upload your own artwork to be printed on premium vinyl.
                </p>
              </div>
              <div className="relative z-10 flex-shrink-0">
                <span className="inline-block bg-white text-black font-bold tracking-widest text-[10px] px-6 py-4 transition-colors uppercase shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(180,255,57,0.2)] group-hover:bg-[#b4ff39]">
                  ACCESS STUDIO ↗
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8 relative z-40">
          <div className="inline-flex bg-black border-2 border-white/20 p-1 font-pixel text-xs">
            {(["STICKERS", "STAMPS", "POSTERS"] as const).map(tab => {
              const isActive = activeTab === tab;
              const bgColorClass = tab === "STICKERS" ? "bg-[#E83C3C]" : tab === "STAMPS" ? "bg-[#A855F7]" : "bg-[#b4ff39]";
              const textColorClass = isActive 
                ? (tab === "POSTERS" ? "text-black" : "text-white") 
                : "text-white hover:text-white/70";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-6 py-3 transition-colors ${textColorClass}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className={`absolute inset-0 ${bgColorClass}`}
                      style={{ zIndex: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Popular Tags Section */}
        {pathname !== '/' && (
          <div ref={searchRef} className="mb-12 relative z-50">
            {/* Search Input Bar */}
            <div className="bg-[#121212] border-2 border-white/20 p-3.5 flex items-center gap-3 rounded-lg shadow-xl focus-within:border-[#b4ff39] transition-colors relative">
              <span className="text-[#b4ff39] font-mono text-sm">✦</span>
              <input
                type="text"
                placeholder="Search stickers by name or tag (e.g. anime, cassette, retro)..."
                className="bg-transparent border-none outline-none text-white w-full font-body text-sm placeholder:text-white/30"
                value={search}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
              />
              {search && (
                <button 
                  onClick={() => {
                    setSearch("");
                    setShowSuggestions(false);
                  }} 
                  className="text-white/50 hover:text-white px-2 text-sm font-mono cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Autocomplete Suggestions Dropdown */}
            {showSuggestions && search.trim().length > 0 && (suggestions.tags.length > 0 || suggestions.stickers.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#0E0E0E] border-2 border-[#b4ff39]/60 rounded-lg shadow-[0_10px_35px_rgba(0,0,0,0.9)] overflow-hidden z-[60] backdrop-blur-xl animate-in fade-in duration-200">
                {/* Matching Tags */}
                {suggestions.tags.length > 0 && (
                  <div className="p-3 border-b border-white/10">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#b4ff39] mb-2 flex items-center gap-2">
                      <span>🏷️</span> MATCHING TAGS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.tags.map(([tag, count]) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(tag);
                            setSearch("");
                            setShowSuggestions(false);
                          }}
                          className="bg-white/10 hover:bg-[#b4ff39] hover:text-black text-white text-xs px-2.5 py-1 rounded font-mono uppercase tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{tag}</span>
                          <span className="text-[10px] opacity-60">({count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matching Stickers */}
                {suggestions.stickers.length > 0 && (
                  <div className="p-2">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#b4ff39] px-2 py-1 flex items-center gap-2">
                      <span>⚡</span> MATCHING STICKERS
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-1">
                      {suggestions.stickers.map((stk) => (
                        <Link
                          key={stk.id}
                          href={`/stickers/${stk.slug}`}
                          onClick={() => setShowSuggestions(false)}
                          className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-md transition-colors group cursor-pointer"
                        >
                          <div className="relative w-10 h-10 bg-black/60 rounded border border-white/10 shrink-0 overflow-hidden">
                            <Image
                              src={stk.image_url}
                              alt={cleanDisplayName(stk.name)}
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-[#b4ff39] truncate uppercase font-display">
                              {cleanDisplayName(stk.name)}
                            </div>
                            <div className="text-[10px] font-mono text-white/50 flex items-center gap-2">
                              <span>₹{stk.price / 100}</span>
                              {stk.tags?.[0] && <span>· {stk.tags[0]}</span>}
                            </div>
                          </div>
                          <span className="text-white/40 group-hover:text-[#b4ff39] text-xs font-mono">→</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Popular Tags Horizontal Bar (Ordered: Most used first -> least used last) */}
            {tagFrequencies.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50 font-mono text-[10px] tracking-widest uppercase flex items-center gap-1.5">
                    <span className="text-[#b4ff39]">///</span> FILTER BY POPULAR TAGS (MOST USED FIRST):
                  </span>
                  {(selectedTag || search) && (
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSearch("");
                      }}
                      className="text-[#b4ff39] hover:underline text-[10px] font-mono uppercase tracking-wider cursor-pointer"
                    >
                      RESET FILTERS ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {/* ALL Pill */}
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      selectedTag === null
                        ? "bg-[#b4ff39] text-black font-extrabold shadow-[0_0_12px_rgba(180,255,57,0.4)]"
                        : "bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    ALL ({initialStickers.length})
                  </button>

                  {/* Individual Tags sorted by frequency: highest to lowest */}
                  {tagFrequencies.map(([tag, count]) => {
                    const isSelected = selectedTag?.toUpperCase() === tag.toUpperCase();
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-[#b4ff39] text-black font-extrabold shadow-[0_0_12px_rgba(180,255,57,0.4)]"
                            : "bg-white/5 border border-white/15 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30"
                        }`}
                      >
                        <span>{tag}</span>
                        <span className={`text-[10px] ${isSelected ? "text-black/70 font-bold" : "text-white/40"}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Grid Layouts */}
        {activeTab === "STICKERS" && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {displayedSlots.map((slot: any) => (
              <VaultCard key={`slot-${slot.slot_number}`} slot={slot} />
            ))}
          </div>
        )}

        {activeTab === "STAMPS" && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {displayedSlots.length === 0 ? (
              <div className="col-span-full py-20 text-center font-pixel text-white/50">NO STAMPS ACQUIRED</div>
            ) : (
              displayedSlots.map((slot: any) => (
                <StampCard key={`stamp-${slot.slot_number}`} slot={slot} />
              ))
            )}
          </div>
        )}

        {activeTab === "POSTERS" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedSlots.length === 0 ? (
              <div className="col-span-full py-32 text-center font-pixel text-white/50 border border-white/10 border-dashed">NO POSTERS ARCHIVED</div>
            ) : (
              displayedSlots.map((slot: any) => (
                <VaultCard key={`poster-${slot.slot_number}`} slot={slot} />
              ))
            )}
          </div>
        )}

        {/* Progressive Load More Button for Full Vault */}
        {!limit && visibleCount < filteredSlots.length && (
          <div className="mt-16 flex flex-col items-center justify-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 40)}
              className="border border-[#b4ff39] text-[#b4ff39] font-mono tracking-widest text-xs px-10 py-4 hover:bg-[#b4ff39] hover:text-black transition-all shadow-[0_0_15px_rgba(180,255,57,0.2)] font-bold uppercase cursor-pointer"
            >
              LOAD MORE SIGNALS ({filteredSlots.length - visibleCount} REMAINING) ↓
            </button>
            <span className="text-[10px] text-white/40 font-mono tracking-widest mt-3">
              SHOWING {displayedSlots.length} OF {filteredSlots.length} SLOTS
            </span>
          </div>
        )}

        {/* View More Link for Homepage */}
        {limit && (
          <div className="mt-16 flex justify-center">
            <Link 
              href="/vault" 
              className="border border-[#b4ff39]/50 text-[#b4ff39] font-pixel tracking-widest text-xs px-12 py-5 hover:bg-[#b4ff39] hover:text-black transition-colors shadow-[0_0_15px_rgba(180,255,57,0.2)]"
            >
              ACCESS FULL VAULT DIRECTORY →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

const DotChevron = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 12 16" className={`w-2.5 h-3.5 fill-current ${className}`}>
    <circle cx="2" cy="2" r="1.2" />
    <circle cx="5" cy="5" r="1.2" />
    <circle cx="8" cy="8" r="1.2" />
    <circle cx="5" cy="11" r="1.2" />
    <circle cx="2" cy="14" r="1.2" />
  </svg>
);

function cleanDisplayName(name?: string) {
  if (!name) return "VINYL DROP";
  const trimmed = name.trim();
  if (/^STANDARD\s+\d+$/i.test(trimmed)) {
    return "AESTHETIC VINYL";
  }
  if (/^BOOT\s+(STICKER\s+)?\d+$/i.test(trimmed)) {
    return "BOOTLEG CULTURE";
  }
  return trimmed.replace(/\s*#\d+\s*$/, "").trim();
}

function Y2KSliderButton({ 
  slot, 
  themeColor = "#E83C3C", 
  onAdd, 
  isOutOfStock 
}: { 
  slot: any; 
  themeColor?: string; 
  onAdd: () => void; 
  isOutOfStock: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Constraints for drag
  const [dragWidth, setDragWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setDragWidth(containerRef.current.offsetWidth - 42);
    }
  }, [containerRef.current?.offsetWidth]);

  // Map drag position to width of background block
  const bgWidth = useTransform(dragX, [0, dragWidth || 1], [42, (dragWidth || 1) + 42]);

  const handleDragEnd = () => {
    const currentX = dragX.get();
    if (currentX >= dragWidth - 15) {
      triggerAdd();
    } else {
      animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  const triggerAdd = () => {
    setIsSliding(true);
    setIsAdded(false);
    onAdd();
    
    // Animate background to full width
    animate(dragX, dragWidth, { type: "tween", duration: 0.25 });

    setTimeout(() => {
      setIsAdded(true);
      
      setTimeout(() => {
        setIsAdded(false);
        setIsSliding(false);
        animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
      }, 1800);
    }, 1000);
  };

  // Desktop click handler
  const handleDesktopClick = (e: React.MouseEvent) => {
    if (isOutOfStock || isAdded) return;
    
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) {
      triggerAdd();
    }
  };

  const glowColors = {
    "#E83C3C": "rgba(232, 60, 60, 0.9)",
    "#A855F7": "rgba(168, 85, 247, 0.9)",
    "#b4ff39": "rgba(180, 255, 57, 0.9)",
  };
  const activeGlow = glowColors[themeColor as keyof typeof glowColors] || "rgba(255, 255, 255, 0.8)";

  return (
    <div 
      ref={containerRef} 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full h-[52px] bg-[#080808] overflow-hidden select-none border-t border-black/20 group transition-all"
    >
      {/* Decorative cyber corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 z-12 pointer-events-none" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20 z-12 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 z-12 pointer-events-none" />

      {/* Background slide fill bar */}
      <motion.div 
        className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center overflow-hidden pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        style={{ 
          width: isSliding ? "100%" : bgWidth, 
          backgroundColor: themeColor,
          transition: isSliding ? "width 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : "none"
        }}
      >
        <div 
          className="flex gap-2 items-center justify-center w-full px-4 text-black font-extrabold"
          style={{ opacity: isSliding || isAdded ? 1 : 0, transition: "opacity 0.2s" }}
        >
          {isAdded ? (
            <span className="font-mono text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-black flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-sm">✓</span> ADDED TO PACK
            </span>
          ) : (
            <div className="flex gap-2 text-black items-center">
              <DotChevron className="animate-[pulseChevron_1.5s_infinite] [animation-delay:0ms]" />
              <DotChevron className="animate-[pulseChevron_1.5s_infinite] [animation-delay:200ms]" />
              <DotChevron className="animate-[pulseChevron_1.5s_infinite] [animation-delay:400ms]" />
              <DotChevron className="animate-[pulseChevron_1.5s_infinite] [animation-delay:600ms]" />
              <DotChevron className="animate-[pulseChevron_1.5s_infinite] [animation-delay:800ms]" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Decorative Tactile Slider Thumb - Mobile */}
      {!isOutOfStock && !isAdded && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: dragWidth }}
          dragElastic={0.05}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{ x: dragX }}
          className="absolute left-0 top-0 bottom-0 w-[42px] z-20 flex items-center justify-center cursor-grab active:cursor-grabbing md:hidden"
        >
          <div 
            className="w-full h-full flex flex-col items-center justify-center gap-1 shadow-[2px_0_10px_rgba(0,0,0,0.6)] border-r border-black/20" 
            style={{ backgroundColor: themeColor }}
          >
            <div className="w-3.5 h-[1.5px] bg-black/60 rounded-full" />
            <DotChevron className="text-black scale-110" />
            <div className="w-3.5 h-[1.5px] bg-black/60 rounded-full" />
          </div>
        </motion.div>
      )}

      {/* Decorative Tactile Thumb - Desktop */}
      {!isOutOfStock && !isAdded && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-[42px] z-20 hidden md:flex flex-col items-center justify-center gap-1 shadow-[2px_0_10px_rgba(0,0,0,0.6)] border-r border-black/20 group-hover:brightness-110 transition-all"
          style={{ backgroundColor: themeColor }}
        >
          <div className="w-3.5 h-[1.5px] bg-black/60 rounded-full" />
          <DotChevron className="text-black scale-110 group-hover:translate-x-0.5 transition-transform" />
          <div className="w-3.5 h-[1.5px] bg-black/60 rounded-full" />
        </div>
      )}

      {/* Click / Swipe Label */}
      <button 
        onClick={handleDesktopClick}
        className="absolute inset-0 w-full h-full bg-transparent flex items-center z-15 pointer-events-auto cursor-pointer"
        disabled={isOutOfStock || isAdded}
      >
        <div className="w-[42px] shrink-0 h-full" />
        <div className="flex-1 flex items-center justify-center px-2">
          <span 
            className="font-mono text-[9px] md:text-[10.5px] font-black tracking-[0.18em] uppercase text-white transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
            style={{ 
              opacity: isSliding || isAdded ? 0 : 1,
              textShadow: isHovered ? `0 0 10px ${activeGlow}` : "none",
              color: isHovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.9)"
            }}
          >
            {/* Mobile label */}
            <span className="md:hidden flex items-center gap-1.5 text-white/95">
              <span>SWIPE TO ADD</span>
              <span className="text-[11px] animate-pulse">»»</span>
            </span>
            {/* Desktop label */}
            <span className="hidden md:flex items-center gap-2 group-hover:text-white">
              <span className="tracking-[0.22em]">CLICK TO ADD</span>
              <span className="text-xs transition-transform group-hover:translate-x-1" style={{ color: themeColor }}>+</span>
            </span>
          </span>
        </div>
      </button>
    </div>
  );
}

function VaultCard({ slot }: { slot: any }) {
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const [notifyMode, setNotifyMode] = useState(false);
  const [email, setEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  if (slot.is_empty) {
    return (
      <div className="aspect-[3/4] rounded-lg border border-[#1A1A1A] bg-[#0D0D0D] flex flex-col items-center justify-center p-4 text-center">
        <div className="text-white/10 font-display text-2xl md:text-3xl mb-2">✦</div>
        <div className="text-[10px] text-white/30 tracking-widest animate-pulse font-pixel">COMING SOON</div>
      </div>
    );
  }

  const isOutOfStock = slot.stock === 0;
  const soldPercentage = slot.stock + slot.sold > 0 
    ? (slot.sold / (slot.stock + slot.sold)) * 100 
    : 0;

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!email) return;
    
    setNotifyStatus("loading");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sticker_id: slot.id })
      });
      const data = await res.json();
      
      if (res.ok) {
        setNotifyStatus("success");
      } else {
        setNotifyStatus("error");
        setErrorMessage(data.error || "Failed to subscribe.");
      }
    } catch (err) {
      setNotifyStatus("error");
      setErrorMessage("Network error.");
    }
  };

  // Determine card color based on tags
  const colors = ["#00FFFF", "#FF00FF", "#b4ff39", "#FFA500", "#FF1493", "#39ff14"];
  let cardColor = "#b4ff39"; // default neon green
  if (slot.tags && slot.tags.length > 0) {
    const tag = slot.tags[0].toUpperCase();
    if (tag.includes("RARE") || tag.includes("HOLO")) cardColor = "#FF00FF";
    else if (tag.includes("SECRET")) cardColor = "#00FFFF";
    else cardColor = colors[tag.charCodeAt(0) % colors.length];
  }

  // Generate some deterministic random pixel positions for this card
  const pixelBlocks = useMemo(() => {
    const blocks = [];
    const seed = slot.slot_number * 1337;
    for (let i = 0; i < 8; i++) {
      blocks.push({
        left: `${((seed * (i + 1)) % 90)}%`,
        top: `${((seed * (i + 7)) % 80) + 10}%`,
        size: ((seed * i) % 3) + 1 // 1, 2, or 3
      });
    }
    return blocks;
  }, [slot.slot_number]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') || 
      (e.target as HTMLElement).closest('form') || 
      (e.target as HTMLElement).closest('input')
    ) {
      return;
    }
    router.push(`/stickers/${slot.slug}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative w-full aspect-[3/4] cursor-pointer"
    >
      <div className="w-full h-full rounded-lg overflow-hidden flex flex-col bg-[#111] border border-white/10 shadow-lg">
        {/* Top Image Section */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          {/* Retro subtle texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-0 pointer-events-none" />
          
          {/* Floating color pixels behind the image */}
          {pixelBlocks.map((px, i) => (
            <div 
              key={i}
              className="absolute z-10 pointer-events-none mix-blend-screen"
              style={{
                left: px.left,
                top: px.top,
                width: `${px.size * 6}px`,
                height: `${px.size * 6}px`,
                backgroundColor: "#E83C3C" // RED
              }}
            />
          ))}

          <Image 
            src={slot.image_url} 
            fill 
            sizes="(max-width: 768px) 50vw, 20vw"
            className={`object-contain p-6 z-20 filter transition-all duration-500 sepia-[0.3] ${isOutOfStock ? 'opacity-30 grayscale' : 'group-hover:scale-105'}`} 
            alt={slot.name} 
          />

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="bg-black/90 text-[#E83C3C] border-2 border-[#E83C3C] px-3 py-1 font-pixel font-bold tracking-widest text-[10px] shadow-[2px_2px_0_0_#E83C3C]">
                SOLD OUT
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Section (Solid Color Block) */}
        <div className="relative h-[38%] z-30 flex flex-col justify-between" style={{ backgroundColor: "#FFFFFF" }}>
          
          {/* Pixelated transition edge at the top */}
          <div className="absolute top-0 left-0 w-full h-8 -translate-y-full flex items-end opacity-100 text-white">
            {/* Manual stepped pixel pattern */}
            <div className="w-[15%] h-[12px] bg-current" />
            <div className="w-[10%] h-[4px] bg-current" />
            <div className="w-[12%] h-[24px] bg-current" />
            <div className="w-[8%] h-[8px] bg-current" />
            <div className="w-[20%] h-[16px] bg-current" />
            <div className="w-[15%] h-[6px] bg-current" />
            <div className="w-[10%] h-[20px] bg-current" />
            <div className="w-[10%] h-[10px] bg-current" />
          </div>

          {/* Top metadata tags & Price */}
          <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2 relative z-10">
            <span 
              className="text-black font-extrabold text-[10px] md:text-[11px] font-display uppercase tracking-tight truncate max-w-[145px]" 
              title={cleanDisplayName(slot.name)}
            >
              {cleanDisplayName(slot.name)}
            </span>
            
            {/* Price display with discounted original price */}
            <div className="flex items-baseline gap-1 font-sans text-xs md:text-sm shrink-0">
              <span className="text-black/35 line-through text-[9px] md:text-[10px] font-medium">₹49</span>
              <span className="text-black font-extrabold tracking-tight">₹{slot.price ? (slot.price / 100) : 19}</span>
            </div>
          </div>
          
          {/* Full-width Y2K Dot Chevron Slider Button (extended to bottom) */}
          <div className="relative w-full z-10 mt-1">
            <style>{`
              @keyframes pulseChevron {
                0%, 100% { opacity: 0.15; }
                50% { opacity: 1; }
              }
            `}</style>

            {!isOutOfStock ? (
              <Y2KSliderButton 
                slot={slot} 
                themeColor="#E83C3C" 
                onAdd={() => addItem(slot as Sticker)} 
                isOutOfStock={isOutOfStock} 
              />
            ) : !notifyMode ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setNotifyMode(true);
                }}
                className="w-full bg-[#E83C3C] text-white hover:bg-red-700 h-[52px] text-[9px] font-pixel uppercase font-bold tracking-wider cursor-pointer border-t border-black"
              >
                NOTIFY ME
              </button>
            ) : notifyStatus === "success" ? (
              <div className="w-full bg-zinc-800 text-zinc-400 h-[52px] flex items-center justify-center text-[9px] font-pixel uppercase font-bold tracking-wider text-center border-t border-black">
                SUBBED
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex border-t border-black w-full h-[52px] overflow-hidden" onClick={e => e.stopPropagation()}>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="EMAIL..."
                  required
                  className="bg-white text-black px-3 py-1 text-[8px] font-pixel outline-none min-w-0 flex-1"
                />
                <button type="submit" className="bg-black text-[#b4ff39] text-[9px] font-pixel px-3">→</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StampCard({ slot }: { slot: any }) {
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const isOutOfStock = slot.stock === 0;

  if (slot.is_empty) return null;

  // Generate some deterministic random pixel positions for this card
  const pixelBlocks = useMemo(() => {
    const blocks = [];
    const seed = slot.slot_number * 1337;
    for (let i = 0; i < 8; i++) {
      blocks.push({
        left: `${((seed * (i + 1)) % 90)}%`,
        top: `${((seed * (i + 7)) % 80) + 10}%`,
        size: ((seed * i) % 3) + 1 // 1, 2, or 3
      });
    }
    return blocks;
  }, [slot.slot_number]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') || 
      (e.target as HTMLElement).closest('form') || 
      (e.target as HTMLElement).closest('input')
    ) {
      return;
    }
    router.push(`/stickers/${slot.slug}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group relative w-full aspect-[3/4] cursor-pointer"
    >
      <div className="w-full h-full rounded-lg overflow-hidden flex flex-col bg-[#111] border border-white/10 shadow-lg">
        {/* Top Image Section */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          {/* Retro subtle texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] opacity-10 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-0 pointer-events-none" />
          
          {/* Floating color pixels behind the image - PURPLE */}
          {pixelBlocks.map((px, i) => (
            <div 
              key={i}
              className="absolute z-10 pointer-events-none mix-blend-screen"
              style={{
                left: px.left,
                top: px.top,
                width: `${px.size * 6}px`,
                height: `${px.size * 6}px`,
                backgroundColor: "#A855F7" // PURPLE
              }}
            />
          ))}

          <Image 
            src={slot.image_url} 
            fill 
            sizes="(max-width: 768px) 50vw, 20vw"
            className={`object-contain p-6 z-20 filter transition-all duration-500 sepia-[0.3] ${isOutOfStock ? 'opacity-30 grayscale' : 'group-hover:scale-105'}`} 
            alt={slot.name} 
          />

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div className="bg-black/90 text-[#E83C3C] border-2 border-[#E83C3C] px-3 py-1 font-pixel font-bold tracking-widest text-[10px] shadow-[2px_2px_0_0_#E83C3C]">
                SOLD OUT
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Section (Solid Color Block) */}
        <div className="relative h-[38%] z-30 flex flex-col justify-between" style={{ backgroundColor: "#FFFFFF" }}>
          
          {/* Pixelated transition edge at the top */}
          <div className="absolute top-0 left-0 w-full h-8 -translate-y-full flex items-end opacity-100 text-white">
            {/* Manual stepped pixel pattern */}
            <div className="w-[15%] h-[12px] bg-current" />
            <div className="w-[10%] h-[4px] bg-current" />
            <div className="w-[12%] h-[24px] bg-current" />
            <div className="w-[8%] h-[8px] bg-current" />
            <div className="w-[20%] h-[16px] bg-current" />
            <div className="w-[15%] h-[6px] bg-current" />
            <div className="w-[10%] h-[20px] bg-current" />
            <div className="w-[10%] h-[10px] bg-current" />
          </div>

          {/* Top metadata tags & Price */}
          <div className="px-3 pt-2 pb-1 flex items-center justify-between gap-2 relative z-10">
            <span 
              className="text-black font-extrabold text-[10px] md:text-[11px] font-display uppercase tracking-tight truncate max-w-[145px]" 
              title={cleanDisplayName(slot.name)}
            >
              {cleanDisplayName(slot.name)}
            </span>
            
            {/* Price display with discounted original price */}
            <div className="flex items-baseline gap-1 font-sans text-xs md:text-sm shrink-0">
              <span className="text-black/35 line-through text-[9px] md:text-[10px] font-medium">₹49</span>
              <span className="text-black font-extrabold tracking-tight">₹{slot.price ? (slot.price / 100) : 19}</span>
            </div>
          </div>
          
          {/* Full-width Y2K Dot Chevron Slider Button - PURPLE ACCENTED (extended to bottom) */}
          <div className="relative w-full z-10 mt-1">
            {!isOutOfStock ? (
              <Y2KSliderButton 
                slot={slot} 
                themeColor="#A855F7" 
                onAdd={() => addItem(slot as Sticker)} 
                isOutOfStock={isOutOfStock} 
              />
            ) : (
              <span className="w-full text-red-500 font-pixel font-bold py-[18px] text-[9px] uppercase tracking-wider text-center block bg-black border-t border-black">
                SOLD OUT
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

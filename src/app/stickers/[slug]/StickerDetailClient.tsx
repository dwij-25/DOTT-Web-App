"use client";

import { Sticker } from "@prisma/client";
import { useCartStore, useUIStore } from "@/lib/store";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

function cleanDisplayName(name?: string) {
  if (!name) return "VINYL STICKER";
  const trimmed = name.trim();
  if (/^STANDARD\s+\d+$/i.test(trimmed)) {
    return "AESTHETIC VINYL DROP";
  }
  if (/^BOOT\s+(STICKER\s+)?\d+$/i.test(trimmed)) {
    return "BOOTLEG CULTURE DROP";
  }
  return trimmed.replace(/\s*#\d+\s*$/, "").trim();
}

export default function StickerDetailClient({ 
  sticker,
  recommendations = []
}: { 
  sticker: Sticker;
  recommendations?: Sticker[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const isOutOfStock = sticker.stock === 0;

  const priceInRs = sticker.price ? sticker.price / 100 : 20;
  const freeShippingThreshold = 350;
  const minStickersForFreeShipping = Math.max(1, Math.ceil(freeShippingThreshold / priceInRs));
  const freeShippingTotal = minStickersForFreeShipping * priceInRs;

  const handleAdd = (itemToAdd: Sticker = sticker) => {
    addItem(itemToAdd);
    useUIStore.getState().setToastMessage(`ADDED ${cleanDisplayName(itemToAdd.name)} TO PACK`);
    setTimeout(() => useUIStore.getState().setToastMessage(null), 2000);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto w-full px-8 md:px-16 lg:px-24 pb-24 flex flex-col lg:flex-row gap-12 lg:gap-24">
      
      {/* Left: Image Viewer */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1"
      >
        <div className="relative w-full aspect-square border border-[#1A1A1A] bg-[#0D0D0D] flex items-center justify-center overflow-hidden">
          {/* Subtle noise */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          <Image 
            src={sticker.image_url} 
            alt={cleanDisplayName(sticker.name)} 
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="p-8 md:p-16 object-contain z-10" 
          />
        </div>
      </motion.div>

      {/* Right: Details & Add to Cart */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col justify-center"
      >
        <div className="text-[#b4ff39] font-pixel text-xs tracking-[0.2em] mb-4 uppercase">
          /// {sticker.collection} DROP · OFFICIAL VINYL EDITION
        </div>
        
        <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter mb-4 break-words">
          {cleanDisplayName(sticker.name)}
        </h1>
        
        <div className="font-display font-bold text-3xl mb-6 text-white flex items-center gap-3">
          <span>₹{priceInRs}</span>
          <span className="text-xs font-mono text-white/40 tracking-wider font-normal">/ sticker</span>
        </div>

        <p className="text-white/60 text-sm md:text-base mb-8 leading-relaxed font-body">
          {sticker.description}
        </p>

        <div className="flex gap-2 flex-wrap mb-8">
          {sticker.tags.map(tag => (
            <span key={tag} className="border border-white/20 px-3 py-1 text-[10px] md:text-xs tracking-widest text-white/70 uppercase">
              {tag}
            </span>
          ))}
        </div>

        {/* Highlighted Specs: Gloss Finish & Standard 5cm Size */}
        <div className="mb-8 grid grid-cols-2 gap-3 p-4 bg-[#141414] border-2 border-white/20 rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-xl shrink-0">
              ✨
            </div>
            <div>
              <span className="block text-[9px] text-white/50 font-mono tracking-widest uppercase">FINISH</span>
              <span className="text-white font-extrabold text-sm md:text-base tracking-wide uppercase font-mono">
                {sticker.finish || "GLOSS"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#b4ff39]/20 to-[#b4ff39]/5 border border-[#b4ff39]/40 flex items-center justify-center text-xl shrink-0">
              📐
            </div>
            <div>
              <span className="block text-[9px] text-white/50 font-mono tracking-widest uppercase">SIZE</span>
              <span className="text-white font-extrabold text-sm md:text-base tracking-wide uppercase font-mono">
                STANDARD 5 CM
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Decorative Add to Pack Button */}
        <div className="pt-2 flex flex-col gap-4">
          {sticker.stock > 0 && sticker.stock <= 5 && (
            <div className="text-[#FF4E50] font-pixel text-[10px] tracking-[0.2em] text-center animate-pulse">
              /// WARNING: ONLY {sticker.stock} LEFT IN STOCK
            </div>
          )}
          <button 
            onClick={() => handleAdd(sticker)}
            disabled={isOutOfStock}
            className="relative group w-full bg-[#b4ff39] hover:bg-white text-black font-display font-black tracking-[0.2em] text-sm md:text-base px-8 py-4 text-center transition-all duration-300 uppercase disabled:opacity-50 disabled:hover:bg-white cursor-pointer shadow-[0_0_25px_rgba(180,255,57,0.35)] hover:shadow-[0_0_35px_rgba(255,255,255,0.6)] rounded-sm overflow-hidden"
          >
            {/* Cyberpunk corner notches */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-black z-10" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-black z-10" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-black z-10" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-black z-10" />
            
            <span className="relative z-10 flex items-center justify-center gap-2 group-hover:scale-105 transition-transform">
              <span>{isOutOfStock ? "SOLD OUT" : "CLICK TO ADD TO PACK"}</span>
              {!isOutOfStock && <span className="text-xl leading-none font-sans font-bold">+</span>}
            </span>
          </button>
        </div>

        {/* Bundle & Save Recommendation */}
        <div className="mt-8 border border-white/15 bg-black/70 p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[#b4ff39] text-xs font-mono font-bold">⚡</span>
              <span className="font-mono text-xs font-bold tracking-wider text-white uppercase">BUY IN PACKS & SAVE</span>
            </div>
            <span className="bg-[#b4ff39]/20 text-[#b4ff39] font-mono text-[9px] px-2 py-0.5 rounded font-bold tracking-widest border border-[#b4ff39]/30">SAVINGS PERK</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-white/10 bg-white/5 p-3 rounded-md">
              <div className="font-bold text-white text-xs mb-1 flex items-center justify-between">
                <span>PACK OF {minStickersForFreeShipping}+ (₹{freeShippingTotal})</span>
                <span className="text-[#b4ff39] font-mono text-[10px] font-bold">FREE DELIVERY</span>
              </div>
              <p className="text-white/70 text-[11px] leading-relaxed">
                Add <strong className="text-white">{minStickersForFreeShipping} stickers</strong> to cross ₹{freeShippingThreshold} and unlock 100% free express delivery anywhere in India.
              </p>
            </div>
            <div className="border border-white/10 bg-white/5 p-3 rounded-md">
              <div className="font-bold text-white text-xs mb-1 flex items-center justify-between">
                <span>TIER REWARDS & PERKS</span>
                <span className="text-[#b4ff39] font-mono text-[10px] font-bold">UP TO 15% OFF</span>
              </div>
              <p className="text-white/70 text-[11px] leading-relaxed">
                Collect 5+ stickers to advance toward GRID & MARK member tiers for automatic checkout discounts.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

    </div>

    {/* Recommendations Section */}
    {recommendations.length > 0 && (
      <div className="max-w-7xl mx-auto w-full px-8 md:px-16 lg:px-24 pb-20 border-t border-white/10 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-[#b4ff39] font-pixel text-[10px] tracking-[0.2em] mb-1">/// COMPLETE YOUR PACK</div>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl uppercase tracking-tight">RECOMMENDED SIGNALS</h2>
          </div>
          <div className="text-xs font-mono text-white/50">
            Pick {minStickersForFreeShipping} or more stickers for free delivery across India
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {recommendations.map((rec) => (
            <div 
              key={rec.id} 
              className="group border border-white/10 bg-[#111] p-4 flex flex-col justify-between hover:border-[#b4ff39]/50 transition-all rounded"
            >
              <Link href={`/stickers/${rec.slug}`} className="block relative aspect-square w-full mb-3 bg-black/60 border border-white/5 rounded p-4 overflow-hidden">
                <Image 
                  src={rec.image_url} 
                  alt={cleanDisplayName(rec.name)} 
                  fill 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" 
                />
              </Link>
              
              <div>
                <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase mb-1">
                  {rec.collection} EDITION
                </div>
                <Link href={`/stickers/${rec.slug}`} className="font-bold text-sm md:text-base text-white hover:text-[#b4ff39] transition-colors truncate block">
                  {cleanDisplayName(rec.name)}
                </Link>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="font-display font-bold text-sm text-white">₹{rec.price / 100}</span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleAdd(rec);
                    }}
                    className="bg-white/10 hover:bg-[#b4ff39] hover:text-black text-white text-[9px] font-mono font-bold px-2.5 py-1.5 rounded transition-colors uppercase tracking-wider"
                  >
                    + ADD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </>
  );
}

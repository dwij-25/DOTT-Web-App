"use client";

import { Sticker } from "@prisma/client";
import { useCartStore, useUIStore } from "@/lib/store";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function StickerDetailClient({ 
  sticker,
  recommendations = []
}: { 
  sticker: Sticker;
  recommendations?: Sticker[];
}) {
  const addItem = useCartStore((state) => state.addItem);
  const isOutOfStock = sticker.stock === 0;

  const handleAdd = (itemToAdd: Sticker = sticker) => {
    addItem(itemToAdd);
    useUIStore.getState().setToastMessage(`ADDED ${itemToAdd.name} TO PACK`);
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
            alt={sticker.name} 
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
          /// {sticker.collection} {sticker.slot_number ? sticker.slot_number.toString().padStart(3, "0") : "000"}
        </div>
        
        <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter mb-4 break-words">
          {sticker.name}
        </h1>
        
        <div className="font-display font-bold text-2xl mb-8">
          ₹{sticker.price / 100}
        </div>

        <p className="text-white/50 text-sm md:text-base mb-8 leading-relaxed">
          {sticker.description}
        </p>

        <div className="flex gap-2 flex-wrap mb-12">
          {sticker.tags.map(tag => (
            <span key={tag} className="border border-white/20 px-3 py-1 text-[10px] md:text-xs tracking-widest text-white/70 uppercase">
              {tag}
            </span>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col gap-4">
          {sticker.stock > 0 && sticker.stock <= 5 && (
            <div className="text-[#FF4E50] font-pixel text-[10px] tracking-[0.2em] text-center animate-pulse">
              /// WARNING: ONLY {sticker.stock} LEFT IN STOCK
            </div>
          )}
          <button 
            onClick={() => handleAdd(sticker)}
            disabled={isOutOfStock}
            className="w-full bg-white text-black font-bold tracking-widest text-sm md:text-base px-6 py-4 text-center hover:bg-gray-200 transition-colors uppercase disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
          >
            {isOutOfStock ? "SOLD OUT" : "ADD TO PACK +"}
          </button>
        </div>

        {/* Bundle & Save Recommendation */}
        <div className="mt-6 border border-white/15 bg-black/60 p-4 rounded">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#b4ff39] text-xs font-mono font-bold">⚡</span>
              <span className="font-mono text-[11px] font-bold tracking-wider text-white uppercase">BUY IN PACKS & SAVE</span>
            </div>
            <span className="bg-[#b4ff39]/20 text-[#b4ff39] font-mono text-[9px] px-2 py-0.5 rounded font-bold tracking-widest">PERK</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="border border-white/10 bg-white/5 p-2.5 rounded">
              <div className="font-bold text-white text-[11px] mb-0.5 flex items-center justify-between">
                <span>PACK OF 3+</span>
                <span className="text-[#b4ff39] font-mono text-[10px]">FREE SHIPPING</span>
              </div>
              <p className="text-white/60 text-[10px] leading-tight">
                Cross ₹350 for free express delivery across India.
              </p>
            </div>
            <div className="border border-white/10 bg-white/5 p-2.5 rounded">
              <div className="font-bold text-white text-[11px] mb-0.5 flex items-center justify-between">
                <span>PACK OF 5+</span>
                <span className="text-[#b4ff39] font-mono text-[10px]">TIER REWARDS</span>
              </div>
              <p className="text-white/60 text-[10px] leading-tight">
                Unlock higher member tiers (GRID & MARK) for up to 15% off.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-[10px] text-white/30 tracking-widest font-bold uppercase">
          <div>
            <span className="block text-white/50 mb-1">FINISH</span>
            {sticker.finish}
          </div>
          <div>
            <span className="block text-white/50 mb-1">SIZE</span>
            {sticker.size || "Standard 5cm"}
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
            Pick 3 or more for free shipping at ₹350
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
                  alt={rec.name} 
                  fill 
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" 
                />
              </Link>
              
              <div>
                <div className="text-[10px] text-white/50 font-mono tracking-widest uppercase mb-1">
                  {rec.collection} #{rec.slot_number ? rec.slot_number.toString().padStart(3, "0") : "000"}
                </div>
                <Link href={`/stickers/${rec.slug}`} className="font-bold text-sm text-white hover:text-[#b4ff39] transition-colors truncate block">
                  {rec.name}
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

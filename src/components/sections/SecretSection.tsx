"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sticker } from "@prisma/client";
import { useCartStore, useUIStore } from "@/lib/store";
import Link from "next/link";
import Image from "next/image";

export default function SecretSection({ rareStickers = [] }: { rareStickers?: Sticker[] }) {
  const addItem = useCartStore(state => state.addItem);
  const [code, setCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would verify against an API endpoint
    // For now, we simulate the environment variable check
    const validCodes = ["DOTT", "MARK", "SIGNAL", "SHADOW", "PIXEL"];
    
    if (validCodes.includes(code.toUpperCase())) {
      setIsUnlocked(true);
      setError(false);
      // Would also update user session here
    } else {
      setError(true);
      setTimeout(() => setError(false), 1000);
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-black flex flex-col items-center justify-center p-8 overflow-hidden font-body">
      {/* Heavy noise overlay specific to this section */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%221.5%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')] opacity-10 pointer-events-none mix-blend-overlay" />

      <AnimatePresence mode="wait">
        {!isUnlocked ? (
          <motion.div
            key="locked"
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            className="z-10 flex flex-col items-center max-w-md w-full"
          >
            <div className="text-white/30 text-xs tracking-[0.2em] mb-12 text-center uppercase">
              Some drops aren't announced.<br/>They're discovered.
            </div>

            <form onSubmit={handleUnlock} className="w-full flex flex-col items-center">
              <motion.input
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className={`w-full bg-transparent border-b-2 text-center text-3xl font-display font-bold tracking-[0.5em] py-4 outline-none transition-colors ${
                  error ? "border-red-500 text-red-500" : "border-white/20 text-white focus:border-white"
                }`}
                maxLength={10}
              />
              
              <div className="h-8 mt-2 flex items-center justify-center">
                {error && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs tracking-widest">
                    WRONG CODE. KEEP LOOKING ●
                  </motion.span>
                )}
              </div>

              <button
                type="submit"
                className="mt-8 border border-white px-12 py-4 text-sm font-bold tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                UNLOCK →
              </button>
            </form>
            

          </motion.div>
        ) : (
          <motion.div
            key="unlocked"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1 }}
            className="w-full max-w-7xl mx-auto z-10"
          >
            <div className="flex justify-between items-end mb-12">
              <div>
                <div className="text-green-500 border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs tracking-widest inline-flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 bg-green-500 animate-pulse" />
                  ✦ ACCESS GRANTED
                </div>
                <h2 className="font-display font-extrabold text-4xl sm:text-5xl md:text-7xl tracking-tighter break-words">Shadow Drop</h2>
              </div>
              <div className="text-xs text-white/50 tracking-widest text-right">
                SECURE CONNECTION<br/>[RARE COLLECTION]
              </div>
            </div>

            {/* Grid for rare stickers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {rareStickers.map((sticker) => (
                <div key={sticker.id} className="group relative aspect-[4/5] md:aspect-square border border-white/20 bg-black overflow-hidden flex flex-col">
                  <div className="absolute top-2 left-2 border border-[#B8860B] text-[#B8860B] text-[8px] px-2 py-1 tracking-widest z-20">
                    RARE ◈
                  </div>
                  
                  {sticker.tags && sticker.tags.length > 0 && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-30 items-end pointer-events-none">
                      {sticker.tags.map((tag: string) => (
                        <span key={tag} className="text-[8px] bg-black/50 backdrop-blur-sm border border-white/20 text-[#B8860B] px-1 py-0.5 tracking-widest uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Link href={`/stickers/${sticker.slug}`} className="absolute inset-x-0 top-0 bottom-[80px] flex items-center justify-center p-4 cursor-pointer">
                    <Image src={sticker.image_url} alt={sticker.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
                  </Link>
                  
                  <div className="absolute bottom-0 left-0 w-full bg-black border-t border-white/10 p-2 md:p-3">
                    <div className="text-[10px] md:text-xs text-white/50 mb-2">₹{sticker.price / 100}</div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addItem(sticker);
                        useUIStore.getState().setToastMessage(`ADDED ${sticker.name} TO PACK`);
                        setTimeout(() => useUIStore.getState().setToastMessage(null), 2000);
                      }}
                      className="w-full bg-[#B8860B] text-black text-[8px] md:text-[10px] font-bold py-2 tracking-widest hover:bg-yellow-500 transition-colors relative z-20"
                    >
                      ADD TO PACK +
                    </button>
                  </div>
                </div>
              ))}
              
              {rareStickers.length === 0 && (
                <div className="col-span-2 md:col-span-4 text-center py-12 text-white/50 text-xs tracking-widest">
                  NO SECRETS DETECTED.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

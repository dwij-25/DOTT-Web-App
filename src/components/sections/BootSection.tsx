"use client";

import { Sticker } from "@prisma/client";
import { motion } from "framer-motion";
import { useCartStore, useUIStore } from "@/lib/store";
import { useEffect, useState, useRef } from "react";
import PreviewModal from "@/components/ui/PreviewModal";
import Image from "next/image";
import { Codystar } from "next/font/google";

const codystar = Codystar({ weight: "400", subsets: ["latin"] });

const BOOT_STORIES: Record<number, { design: string, why: string }> = {
  1: {
    design: "Vibrant pixel-art Ganesha in bold orange.",
    why: "Invoking the Vighnaharta for an auspicious start. Merges ancient reverence with digital creation."
  },
  2: {
    design: "Block-print style Hanuman in Anjali Mudra.",
    why: "The ultimate symbol of strength and protection. Wards off negativity in fearless devotion."
  },
  3: {
    design: "High-contrast road map of Ahmedabad with coordinates.",
    why: "A homage to our birthplace—representing the chaotic, beautiful home ground where dott.drop began."
  },
  4: {
    design: "Regal vintage stamp of Kohli in RCB jersey.",
    why: "A tribute to ultimate perseverance and victory. A daily reminder to keep pushing boundaries."
  },
  5: {
    design: "Surreal vintage stamp of Van Gogh exploding into blooms.",
    why: "Represents sheer artistic vision and the creative madness needed to build compelling aesthetics."
  },
  6: {
    design: "Classic yellow Pac-Man in sharp pixel art.",
    why: "A retro gaming nod to relentless pursuit and always moving forward to the next level."
  },
  7: {
    design: "Faithful pixel-art recreation of the Uno Reverse card.",
    why: "The ultimate game-changer. When the industry expects one thing, flip the script."
  }
};

const LAUNCH_DATE = new Date("2026-06-13T05:17:00+05:30").getTime();

export default function BootSection({ stickers }: { stickers: Sticker[] }) {
  // Always display slots even if empty. Ensure 6 slots minimum for layout.
  const slots = Array.from({ length: Math.max(stickers.length, 6) }, (_, i) => 
    stickers.find(s => s.slot_number === i + 1) || null
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slots.length);
    setFlippedIndex(null);
  };
  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slots.length) % slots.length);
    setFlippedIndex(null);
  };

  useEffect(() => {
    if (flippedIndex !== null) return;
    const autoScroll = setInterval(() => {
      handleNext();
    }, 3000);
    return () => clearInterval(autoScroll);
  }, [slots.length, flippedIndex]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;
      
      if (distance <= 0) {
        setIsLive(true);
        setTimeLeft("00:00:00:00");
      } else {
        setIsLive(false);
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(`${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeIndex = (index: number) => {
    const half = Math.floor(slots.length / 2);
    let rel = (index - activeIndex) % slots.length;
    if (rel < -half) rel += slots.length;
    if (rel > half) rel -= slots.length;
    return rel;
  };

  const getCardStyle = (relativeIndex: number) => {
    const abs = Math.abs(relativeIndex);
    const sign = Math.sign(relativeIndex);
    
    if (abs === 0) {
      return { x: "0%", scale: 1, opacity: 1, zIndex: 10, filter: "blur(0px)" };
    } else if (abs === 1) {
      return { x: `${sign * 90}%`, scale: 0.8, opacity: 0.8, zIndex: 5, filter: "blur(1px)" }; 
    } else if (abs === 2) {
      return { x: `${sign * 160}%`, scale: 0.6, opacity: 0.3, zIndex: 3, filter: "blur(4px)" };
    } else {
      return { x: `${sign * 200}%`, scale: 0.4, opacity: 0, zIndex: 1, filter: "blur(8px)" };
    }
  };

  return (
    <section id="boot-section" className="relative w-full min-h-screen bg-[#050505] p-8 md:p-16 lg:p-24 overflow-hidden text-white font-body">
      {/* Background layer */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Borders and Brackets */}
      <div className="absolute inset-4 border border-white/15 pointer-events-none" />
      
      {/* Corner L-brackets */}
      <div className="absolute top-4 left-4 w-[30px] h-[30px] border-t-2 border-l-2 border-white pointer-events-none" />
      <div className="absolute top-4 right-4 w-[30px] h-[30px] border-t-2 border-r-2 border-white pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-[30px] h-[30px] border-b-2 border-l-2 border-white pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-[30px] h-[30px] border-b-2 border-r-2 border-white pointer-events-none" />

      {/* Left Edge Gradient Bar */}
      <div className="absolute top-8 left-4 bottom-8 w-[3px] bg-gradient-to-b from-white to-transparent opacity-80 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8">
          <div>
            <div className="text-xs tracking-[0.3em] text-white/70 mb-4 border border-white/20 inline-block px-3 py-1">
              EXCLUSIVE · DROP 001 · FIRST RELEASE · LIMITED
            </div>
            <h2 className="font-display font-extrabold text-[50px] sm:text-[80px] md:text-[140px] leading-[0.9] tracking-[-0.05em] mb-6 text-glitch" data-text="BOOT">
              BOOT
            </h2>
            <div className="text-white/60 max-w-md">
              <p className="mb-2">Built for builders. Terminal culture. First runs.</p>
              <p>For the ones who start from nothing.</p>
            </div>
          </div>
          
          <div className="flex flex-col items-start lg:items-end gap-4">
            <div className="font-display font-bold text-4xl">₹20 <span className="text-sm font-body text-white/50">/ sticker</span></div>

            <div className="border border-white/30 px-4 py-2 text-xs tracking-widest">
              DOTT BOOT COLLECTION
            </div>
            
            {/* Conditional Display: Countdown when locked */}
            <div className="w-full lg:w-64 mt-2">
              {!isLive ? (
                <div className="flex flex-col">
                   <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[10px] tracking-widest mb-2 text-[#FF4E50] gap-1">
                     <span>SYSTEM LOCKED</span>
                     <span className="animate-pulse">WAITING FOR UPLINK</span>
                   </div>
                   <div className="font-mono text-xl font-bold tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
                     T-{timeLeft}
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-mono text-[#b4ff39]">
                  <span className="w-2 h-2 rounded-full bg-[#b4ff39] animate-pulse" />
                  <span className="tracking-widest uppercase text-[10px]">IN STOCK · IMMEDIATE DISPATCH</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coverflow Container */}
        <div 
          className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center mt-12"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndEvent}
        >
          {/* Left Arrow */}
          <button 
            onClick={handlePrev}
            className="absolute left-0 lg:left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-black/50 border border-white/20 flex items-center justify-center opacity-30 hover:opacity-100 hover:bg-white hover:text-black transition-all"
          >
            ←
          </button>

          {/* Right Arrow */}
          <button 
            onClick={handleNext}
            className="absolute right-0 lg:right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-black/50 border border-white/20 flex items-center justify-center opacity-30 hover:opacity-100 hover:bg-white hover:text-black transition-all"
          >
            →
          </button>

          {/* Cards */}
          {slots.map((sticker, idx) => {
            const rel = getRelativeIndex(idx);
            const style = getCardStyle(rel);
            
            return (
              <motion.div
                key={sticker?.id || `empty-${idx}`}
                initial={false}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                  filter: style.filter
                }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="absolute w-[280px] md:w-[350px] lg:w-[400px] cursor-pointer"
                onClick={() => {
                  if (rel !== 0) setActiveIndex(idx);
                }}
              >
                <div className={`transition-all duration-300 w-full h-full ${rel !== 0 ? 'pointer-events-none' : ''}`}>
                  <BootCard 
                    sticker={sticker} 
                    index={idx + 1} 
                    isActive={rel === 0} 
                    isFlipped={flippedIndex === idx}
                    onToggleFlip={() => setFlippedIndex(flippedIndex === idx ? null : idx)}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BootCard({ sticker, index, isActive, isFlipped, onToggleFlip }: { sticker: Sticker | null; index: number; isActive?: boolean; isFlipped?: boolean; onToggleFlip?: () => void }) {
  const addItem = useCartStore(state => state.addItem);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setIsLive(new Date().getTime() >= LAUNCH_DATE);
    const timer = setInterval(() => {
      setIsLive(new Date().getTime() >= LAUNCH_DATE);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!sticker) {
    return (
      <div className="relative aspect-[3/4] border border-white/15 bg-black/40 flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />
        <div className="text-center z-10">
          <div className="text-white/20 font-display text-3xl mb-2">✦</div>
          <div className="text-xs tracking-widest text-white/40 border border-white/20 px-3 py-1">UPLOADING SOON</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full aspect-[3/4]"
      style={{ perspective: 1000 }}
      onClick={() => {
        if (isActive && isLive && sticker && onToggleFlip) onToggleFlip();
      }}
    >
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* FRONT FACE */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          <motion.div 
            className="group relative aspect-[3/4] w-full h-full border border-white/35 bg-[#0A0A0A] overflow-hidden flex flex-col transition-colors duration-500 hover:border-white/70"
            whileHover={isActive ? { y: -5 } : {}}
          >
      {/* Top Header Bar */}
      <div className="h-8 border-b border-white/35 flex justify-between items-center px-3 z-20 bg-black">
        <span className="text-[10px] tracking-widest">DOTT — BOOT</span>
        <div className="border border-white/30 w-4 h-4 flex items-center justify-center text-[10px]">✕</div>
      </div>

      <div className="flex-1 flex relative">
        {/* Measurement Ruler (left) */}
        <div className="w-6 border-r border-white/20 flex flex-col items-center py-2 z-20 bg-black">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="flex-1 w-full flex items-center justify-end pr-1 border-b border-white/10 text-[8px] text-white/30">
              {i % 5 === 0 && i !== 0 ? i : "-"}
            </div>
          ))}
        </div>

        {/* Center Image Zone */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          {/* Target marks */}
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20" />
          <div className="absolute left-1/2 top-0 h-full w-[1px] bg-white/20" />
          <div className="absolute top-4 left-4 text-xs text-white/30">○</div>
          <div className="absolute top-4 right-4 text-xs text-white/30">○</div>
          <div className="absolute bottom-4 left-4 text-xs text-white/30">○</div>
          <div className="absolute bottom-4 right-4 text-xs text-white/30">○</div>

          {/* Sparkles */}
          <div className="absolute top-12 right-12 text-white/40 text-[10px]">✦</div>
          <div className="absolute bottom-20 left-10 text-white/40 text-[8px]">✦</div>

          {/* Hover Glow & Scan Line */}
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500 z-0" />
          <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_linear_infinite] z-30" />

          {/* The Sticker Image */}
          <Image 
            src={sticker.image_url} 
            alt={sticker.name} 
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={index <= 3}
            className={`relative z-10 p-6 object-contain drop-shadow-2xl transition-all duration-500 ${isLive ? 'group-hover:scale-105' : 'blur-md opacity-50'}`} 
          />
          
          {/* Locked Overlay */}
          {!isLive && (
            <div className="absolute inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/40">
              <div className="border border-white/30 bg-black px-4 py-2 text-xs font-bold tracking-widest text-white/70">
                UNLOCKS AT LAUNCH
              </div>
            </div>
          )}
          
          {/* Hover CTA */}
          {isLive && !isFlipped && (
            <div className="absolute inset-0 flex items-center justify-center z-40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
               <div className="flex gap-2 mt-32 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 transition-transform">
                 <button 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     addItem(sticker); 
                     useUIStore.getState().setToastMessage(`ADDED ${sticker.name} TO PACK`);
                     setTimeout(() => useUIStore.getState().setToastMessage(null), 2000);
                   }}
                   className="bg-white text-black font-bold px-4 py-2 tracking-widest text-[10px] hover:bg-gray-200 shadow-xl border border-black/10"
                 >
                    ADD TO PACK +
                 </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Data Panel */}
      <div className="h-24 border-t border-white/35 bg-black p-3 z-20 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2 overflow-hidden">
            <h4 className="text-white font-bold text-xs md:text-sm tracking-wide uppercase truncate max-w-[220px] font-display" title={sticker.name}>
              {sticker.name}
            </h4>
          </div>
          <div className="font-body font-bold text-sm shrink-0">₹{sticker.price / 100}</div>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-1.5 text-white/50 text-[9px] font-mono tracking-widest uppercase">
            <span>OFFICIAL EDITION</span>
            <span>·</span>
            <span>5 CM</span>
          </div>
          
          <div className="text-right">
            <div className="text-[8px] tracking-widest text-white/50 mb-1">▶ ‖ ○○○</div>
            <div className="w-12 h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(255,255,255,0.3)_2px,rgba(255,255,255,0.3)_4px)]" />
          </div>
        </div>
      </div>
          </motion.div>
        </div>

        {/* BACK FACE */}
        {sticker && (
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <motion.div 
              className="group relative aspect-[3/4] w-full h-full border border-black/10 bg-white flex flex-col transition-colors duration-500"
              whileHover={isActive ? { y: -5 } : {}}
            >
              {/* Top Bar */}
              <div className="h-10 border-b border-black/10 bg-white p-2 flex justify-between items-center z-20">
                <span className="text-black/80 text-xs font-bold tracking-[0.3em] uppercase font-mono">DATA LOG</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFlip?.(); }}
                  className="w-6 h-6 border border-black/10 flex items-center justify-center hover:bg-black/5 transition-colors"
                >
                  <span className="text-black/50 text-[10px]">✕</span>
                </button>
              </div>
              
              <div className="flex-1 p-6 flex flex-col gap-6 relative justify-center min-h-0">
                {/* Background Textures */}
                <div className="absolute inset-0 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] bg-[size:12px_12px] opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/95 to-neutral-100/90" />
                
                {/* Premium Hardware/Tech Frame */}
                <div className="absolute inset-2 border border-black/10 flex flex-col justify-between pointer-events-none p-2">
                  <div className="flex justify-between items-start">
                    <div className="w-8 h-8 border-t-2 border-l-2 border-black/20" />
                    <div className="w-8 h-8 border-t-2 border-r-2 border-black/20" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-8 h-8 border-b-2 border-l-2 border-black/20" />
                    <div className="w-8 h-8 border-b-2 border-r-2 border-black/20" />
                  </div>
                </div>

                <div className="relative z-10 flex flex-col h-full p-2 md:p-4 min-h-0" style={{ transform: "translateZ(30px)" }}>
                  {/* Header Bar */}
                  <div className="flex items-center justify-between border-b border-black/10 pb-3 mb-4 shrink-0">
                    <div className="flex flex-col">
                      <h3 className="font-bold text-xl md:text-2xl tracking-tighter uppercase text-black leading-none font-display">
                        {sticker.name}
                      </h3>
                    </div>
                    <div className="px-2.5 py-1 rounded bg-black text-white flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold font-mono tracking-widest">
                        BOOT
                      </span>
                    </div>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 text-left">
                    {sticker.slot_number && BOOT_STORIES[sticker.slot_number] ? (
                      <div className="flex flex-col gap-6 text-sm md:text-base text-black font-display py-2">
                        <div className="relative pl-5 border-l-[3px] border-black/80">
                          <div className="text-[10px] font-bold tracking-[0.25em] text-black/60 mb-2 uppercase flex items-center gap-2 font-mono">
                            <div className="w-1.5 h-1.5 bg-black/60 rotate-45" /> THE STORY
                          </div>
                          <p className="leading-relaxed text-black/90 font-medium text-sm md:text-base">{sticker.slot_number ? BOOT_STORIES[sticker.slot_number]?.why : ""}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex flex-col gap-2 text-sm md:text-base text-black font-display font-medium`}>
                        <p className="leading-relaxed">{sticker.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Bar */}
                  <div className="mt-auto pt-4 border-t border-black/10 flex items-center justify-start">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-4 w-1 ${i % 2 === 0 ? 'bg-black/60' : 'bg-black/20'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-12 border-t border-black/10 bg-gray-50 p-2 z-20 flex flex-col justify-center items-center hover:bg-gray-200 transition-colors">
                 <span className="text-[10px] tracking-widest text-black font-bold font-mono">CLICK TO FLIP BACK ↩</span>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

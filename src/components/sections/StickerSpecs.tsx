"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo, useEffect, useState } from "react";

const FEATURES = [
  {
    icon: "💧",
    title: "WATERPROOF",
    desc: "Survives rain, condensation, daily wear.",
  },
  {
    icon: "🔩",
    title: "SCRATCHPROOF",
    desc: "UV coat. Keys, bags, pockets — nothing gets through.",
  },
  {
    icon: "○",
    title: "ZERO RESIDUE",
    desc: "Peel off clean. No marks. No adhesive. No regret.",
  },
  {
    icon: "✦",
    title: "PIXEL PRECISION",
    desc: "Laser-cut edges. Every pixel exactly as designed.",
  },
  {
    icon: "◈",
    title: "EXTREME DURABILITY",
    desc: "Outdoor-grade adhesive. Built to last.",
  },
  {
    icon: "⬡",
    title: "LIMITED DROPS",
    desc: "Numbered runs. When it's gone, it's gone.",
  }
];

export default function StickerSpecs() {
  const carouselItems = [...FEATURES, ...FEATURES, ...FEATURES, ...FEATURES];

  return (
    <section className="relative w-full py-32 bg-[#0A0A0A] overflow-hidden">
      <div className="relative z-10 w-full">
        <div className="text-center mb-16 px-8">
          <h2 className="font-display font-extrabold text-4xl md:text-6xl tracking-tighter text-white inline-block relative">
            Engineered to Stick
            <div className="absolute -bottom-4 left-0 w-full h-1 bg-white/20">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                viewport={{ once: true }}
              />
            </div>
          </h2>
        </div>

        {/* The Continuous Decoding Scanner Area */}
        <div className="relative w-full h-[250px] overflow-hidden flex items-center">
          {/* Subtle gradient edges for fading out the track */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent z-40 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent z-40 pointer-events-none" />

          {/* 1. The Vertical Scanner Beam */}
          {/* Positioned at right 25% of the screen */}
          <div className="absolute right-[15%] md:right-[25%] top-4 bottom-4 w-[2px] bg-white shadow-[0_0_20px_4px_rgba(255,255,255,0.9)] z-50 pointer-events-none" />

          {/* 2. BOTTOM LAYER: Raw Binary Track */}
          {/* This track spans the whole width and shows the raw binary version of cards */}
          <div className="absolute inset-0 flex items-center">
            <motion.div 
              className="flex gap-8 pl-8"
              style={{ width: "max-content" }}
              animate={{ x: ["0%", "-25%"] }} // -25% because we have 4 sets of features
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            >
              {carouselItems.map((feat, i) => (
                <div key={`binary-${i}`} className="w-[300px] flex-shrink-0">
                  <RawBinaryCard />
                </div>
              ))}
            </motion.div>
          </div>

          {/* 3. TOP LAYER: Decoded UI Track */}
          {/* This track is CLIPPED exactly at the scanner beam line. 
              Only the left side is visible, masking the decoded cards over the binary ones. */}
          <div className="absolute top-0 bottom-0 left-0 right-[15%] md:right-[25%] overflow-hidden flex items-center z-30 pointer-events-none">
            <motion.div 
              className="flex gap-8 pl-8"
              style={{ width: "max-content" }}
              animate={{ x: ["0%", "-25%"] }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            >
              {carouselItems.map((feat, i) => (
                <div key={`decoded-${i}`} className="w-[300px] flex-shrink-0 pointer-events-auto">
                  <DecodedCard feat={feat} />
                </div>
              ))}
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

// Separate components for Binary and Decoded states to run in synced tracks

function RawBinaryCard() {
  const [binaryText, setBinaryText] = useState("");
  
  useEffect(() => {
    // Generate static block first
    setBinaryText(
      Array.from({ length: 600 })
        .map(() => (Math.random() > 0.5 ? "1" : "0"))
        .join("")
    );

    // Flicker it
    const interval = setInterval(() => {
      setBinaryText(prev => 
        prev.split('').map(c => Math.random() > 0.95 ? (c === '1' ? '0' : '1') : c).join('')
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[220px] bg-[#050505] overflow-hidden border border-green-500/10">
      <div className="absolute inset-0 p-4 font-mono text-[10px] text-green-500/40 break-all leading-none select-none">
        {binaryText}
      </div>
    </div>
  );
}

function DecodedCard({ feat }: { feat: any }) {
  return (
    <div className="relative w-full min-h-[220px] h-auto bg-black/90 backdrop-blur-md border border-white/20 p-6 flex flex-col gap-4">
      <div className="text-4xl text-white">{feat.icon}</div>
      <div>
        <h3 className="font-display font-bold text-xl mb-2 text-white">{feat.title}</h3>
        <p className="font-body text-xs text-white/60 leading-relaxed whitespace-normal">{feat.desc}</p>
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/10 w-full">
        <div className="flex justify-between text-[8px] tracking-widest text-white/40 mb-1">
          <span>SYSTEM CHECK</span>
          <span>VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

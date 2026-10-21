"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function KickoffOverlays() {
  return (
    <div className="w-screen">
      {/* PAGE 1: Intro */}
      <div className="h-screen w-full flex flex-col items-center justify-center pointer-events-none relative">
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: false }}
          className="text-5xl md:text-8xl text-white text-center uppercase leading-tight z-10"
          style={{ fontFamily: "var(--font-start2p)" }}
        >
          INTO THE<br />
          <span className="text-[#E83C3C]">UNIVERSE</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-white/60 mt-8 text-xl max-w-lg text-center font-body"
        >
          Scroll to explore the next dimension of the DOTT collection.
        </motion.p>
        
        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-70"
        >
          <span className="text-white/50 text-sm tracking-[0.2em] mb-4">SCROLL</span>
          <div className="w-[2px] h-[40px] bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </div>

      {/* PAGE 2: Floating text left */}
      <div className="h-screen w-full flex items-center justify-start px-10 md:px-32 pointer-events-none">
        <div className="max-w-xl">
          <motion.h2 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, margin: "-20%" }}
            className="text-4xl md:text-6xl text-white uppercase mb-6"
            style={{ fontFamily: "var(--font-start2p)", textShadow: "4px 4px 0 #E83C3C" }}
          >
            BEYOND THE PITCH
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/80 font-body leading-relaxed bg-black/30 p-6 rounded-xl backdrop-blur-sm border border-white/10"
          >
            Experience a world where pixel art meets physical reality. The Kickoff Collection pushes the boundaries of what a sticker can be.
          </motion.p>
        </div>
      </div>

      {/* PAGE 3: Floating text right */}
      <div className="h-screen w-full flex items-center justify-end px-10 md:px-32 pointer-events-none">
        <div className="max-w-xl text-right">
          <motion.h2 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: false, margin: "-20%" }}
            className="text-4xl md:text-6xl text-white uppercase mb-6"
            style={{ fontFamily: "var(--font-start2p)", textShadow: "-4px 4px 0 #6A0A09" }}
          >
            PIXEL PERFECT
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/80 font-body leading-relaxed bg-black/30 p-6 rounded-xl backdrop-blur-sm border border-white/10 inline-block text-left"
          >
            Every block, every color, meticulously crafted. Over 350+ unique designs floating in the void, waiting to be pulled into reality.
          </motion.p>
        </div>
      </div>
      
      {/* PAGE 4: Floating text center */}
      <div className="h-screen w-full flex items-center justify-center px-10 pointer-events-none text-center">
        <div className="max-w-2xl flex flex-col items-center">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.8 }}
             viewport={{ once: false }}
             className="w-32 h-32 border-4 border-[#E83C3C] mb-8 flex items-center justify-center rotate-45"
          >
            <div className="w-16 h-16 bg-white -rotate-45" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: false }}
            className="text-3xl md:text-5xl text-white uppercase"
            style={{ fontFamily: "var(--font-start2p)" }}
          >
            THE FRONTIER AWAITS
          </motion.h2>
        </div>
      </div>

      {/* PAGE 5: CTA */}
      <div className="h-screen w-full flex flex-col items-center justify-center pointer-events-none">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          className="text-5xl md:text-7xl text-[#E83C3C] text-center uppercase mb-12"
          style={{ fontFamily: "var(--font-start2p)" }}
        >
          DOTT X KICKOFF
        </motion.h1>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: false }}
          className="pointer-events-auto"
        >
          <Link href="/">
            <button className="group relative px-12 py-6 bg-white text-black text-xl uppercase font-bold overflow-hidden transition-transform active:scale-95">
              <div className="absolute inset-0 bg-[#E83C3C] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 group-hover:text-white transition-colors duration-300" style={{ fontFamily: "var(--font-start2p)" }}>
                PRE-ORDER NOW
              </span>
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

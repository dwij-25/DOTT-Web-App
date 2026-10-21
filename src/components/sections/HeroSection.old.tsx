"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
const LAUNCH_DATE = new Date("2026-06-13T05:17:00+05:30").getTime();

export default function HeroSection() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Initial load sequence timing
    setTimeout(() => setLoaded(true), 1800);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;

      if (distance < 0) {
        setIsLive(true);
        clearInterval(timer);
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <section className="relative w-full h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {loaded && [...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000) - 100],
              opacity: [null, 0.8, 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center text-center px-4">
        <AnimatePresence mode="wait">
          {!isLive && timeLeft ? (
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              className="flex flex-col items-center"
            >
              <div className="mb-4 tracking-[0.2em] text-xs font-bold text-dott-dim border border-dott-border px-4 py-1">
                DROP 001 BOOT — GOES LIVE IN
              </div>
              <div className="flex items-baseline gap-1 md:gap-4 font-display text-[clamp(1.5rem,8vw,4rem)] md:text-[clamp(60px,8vw,120px)] leading-none font-extrabold w-full max-w-[95vw] px-4 justify-center">
                <div className="flex flex-col items-center">
                  <span>{formatNumber(timeLeft.d)}</span>
                </div>
                <span className="text-dott-dim animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span>{formatNumber(timeLeft.h)}</span>
                </div>
                <span className="text-dott-dim animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <span>{formatNumber(timeLeft.m)}</span>
                </div>
                <span className="text-dott-dim animate-pulse">:</span>
                <div className="flex flex-col items-center">
                  <motion.span
                    key={timeLeft.s}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatNumber(timeLeft.s)}
                  </motion.span>
                </div>
              </div>
              <div className="mt-6 text-xs md:text-sm text-dott-dim tracking-widest text-center">
                JUNE 13 // 05:17 AM // INDIAN STANDARD TIME
              </div>
            </motion.div>
          ) : isLive ? (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex flex-col items-center w-full px-4"
            >
              <div className="flex flex-wrap justify-center mb-6 gap-2">
                <div className="w-4 h-4 bg-white" />
                <div className="w-4 h-4 bg-white" />
                <div className="w-4 h-4 bg-white" />
                <div className="w-4 h-4 bg-white" />
              </div>
              
              <h1 className="font-display font-extrabold text-[clamp(48px,10vw,140px)] leading-[0.8] tracking-tighter mb-6 flex items-end">
                Make your mark
                <span className="inline-block w-3 h-3 md:w-8 md:h-8 bg-white animate-pulse ml-2 mb-2 md:mb-4" />
              </h1>
              
              <p className="text-base md:text-xl text-dott-dim tracking-wide mb-8 text-center max-w-md">
                Pixel stickers. Drop culture. No residue.
              </p>
              
              <div className="border border-white text-white px-4 md:px-6 py-2 text-xs md:text-sm tracking-widest font-bold mb-10 bg-white/5 backdrop-blur-sm text-center">
                DROP 001 // BOOT // LIVE NOW
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full md:w-auto">
                <button 
                  onClick={() => document.getElementById('boot-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-white text-black font-bold px-8 py-4 hover:scale-105 active:scale-95 transition-transform w-full md:w-auto"
                >
                  Enter Drop
                </button>
                <button className="border border-white/30 text-white font-bold px-8 py-4 hover:bg-white/10 active:scale-95 transition-all w-full md:w-auto">
                  Notify Me
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Marquee Strips */}
      <div className="absolute bottom-0 w-full overflow-hidden border-t border-dott-border flex flex-col bg-dott-bg z-20">
        <div className="relative flex whitespace-nowrap border-b border-dott-border py-2">
          <motion.div
            className="flex whitespace-nowrap text-xs tracking-[4px]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          >
            {[...Array(4)].map((_, i) => (
              <span key={i} className="pr-4">
                DOTT · MAKE YOUR MARK · DROP 001 · BOOT · WATERPROOF · SCRATCHPROOF · ZERO RESIDUE · PIXEL PRECISE · LIMITED DROPS ·&nbsp;
              </span>
            ))}
          </motion.div>
        </div>
        <div className="relative flex whitespace-nowrap py-2 text-dott-dim">
          <motion.div
            className="flex whitespace-nowrap text-xs tracking-[4px]"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          >
            {[...Array(4)].map((_, i) => (
              <span key={i} className="pr-4">
                @DOTT.DROP · 250+ STICKERS · ₹19 EACH · FREE DELIVERY ₹300+ · MARK QUIET ECHO LOUD · SIGNALS NOT STICKERS ·&nbsp;
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

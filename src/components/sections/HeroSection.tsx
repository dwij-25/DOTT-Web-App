"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap, useGSAP } from "@/lib/animations";
import { Lock, Unlock } from "lucide-react";
import LiveState from "./LiveState";
import StarryBackground from "@/components/ui/StarryBackground";

const LAUNCH_DATE = new Date("2026-06-12T05:17:00+05:30").getTime(); // Temporarily set to past date

// Custom component for animating digits with GSAP
const AnimatedDigit = ({ value, label }: { value: string; label: string }) => {
  const digitRef = useRef<HTMLDivElement>(null);
  const prevValue = useRef(value);

  useGSAP(() => {
    if (prevValue.current !== value && digitRef.current) {
      // GSAP slam and blur effect when number changes
      gsap.fromTo(digitRef.current,
        { y: "-50%", scale: 1.5, opacity: 0, filter: "blur(10px)" },
        { y: "0%", scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "elastic.out(1, 0.7)" }
      );
      prevValue.current = value;
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center mx-0.5 md:mx-4">
      {/* Moved the font-size clamp classes to this wrapper so h-[1.2em] scales correctly */}
      <div className="relative overflow-hidden h-[1.2em] px-1 md:px-2 flex justify-center items-center leading-none font-extrabold text-[clamp(1.8rem,5vw,5rem)] md:text-[clamp(60px,10vw,140px)]">
        <div ref={digitRef} className="will-change-transform font-display">
          {value}
        </div>
      </div>
      <div className="text-[9px] md:text-sm tracking-[0.2em] text-dott-dim uppercase mt-1 md:mt-2">
        {label}
      </div>
    </div>
  );
};


const AnimatedDropText = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const letters = containerRef.current.querySelectorAll('.letter');
    
    gsap.to(letters, {
      y: -4,
      opacity: 0.5,
      stagger: {
        each: 0.1,
        yoyo: true,
        repeat: -1,
      },
      duration: 1,
      ease: "sine.inOut"
    });
  }, { scope: containerRef });

  const text = "DROP 001 BOOT";

  return (
    <div ref={containerRef} className="mb-8 md:mb-12 flex items-center justify-center cursor-default pointer-events-none">
      <div className="flex text-[10px] md:text-xs font-bold text-white uppercase tracking-[0.5em] md:tracking-[0.8em]">
        {text.split('').map((char, i) => (
          <span 
            key={i} 
            className="letter inline-block will-change-transform"
            style={{ 
              textShadow: "0 0 10px rgba(255,255,255,0.3)",
              marginRight: char === ' ' ? '1em' : '0' 
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default function HeroSection() {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  // Intro Refs
  const introContainer = useRef<HTMLDivElement>(null);
  const introDot = useRef<HTMLDivElement>(null);
  const textMake = useRef<HTMLDivElement>(null);
  const textYour = useRef<HTMLDivElement>(null);
  const textMark = useRef<HTMLDivElement>(null);
  const textFinal = useRef<HTMLDivElement>(null);
  const countdownContainer = useRef<HTMLDivElement>(null);
  const liveStateContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date().getTime();
      const distance = LAUNCH_DATE - now;

      if (distance < 0) {
        setIsLive(true);
        return true; // stop timer
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
        return false;
      }
    };
    
    // Initial call
    if (!updateTime()) {
      const timer = setInterval(() => {
        if (updateTime()) clearInterval(timer);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIntroFinished(true);
        if (introContainer.current) introContainer.current.style.display = "none";
      }
    });

    // Phase 1: Dot pulse
    tl.fromTo(introDot.current, 
      { scale: 0, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }
    )
    .to(introDot.current, { scale: 0.8, duration: 0.2, ease: "power1.inOut" })
    .to(introDot.current, { scale: 100, opacity: 0, duration: 0.4, ease: "power4.in" }, "+=0.3");

    // Phase 2: MAKE. YOUR. MARK.
    const slamIn = { scale: 3, opacity: 0, filter: "blur(20px)" };
    const slamOut = { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.3, ease: "power4.out" };

    tl.fromTo(textMake.current, slamIn, slamOut, "-=0.2")
      .to(textMake.current, { opacity: 0, duration: 0.1 }, "+=0.4");
    
    tl.fromTo(textYour.current, slamIn, slamOut)
      .to(textYour.current, { opacity: 0, duration: 0.1 }, "+=0.4");
    
    tl.fromTo(textMark.current, slamIn, { ...slamOut, duration: 0.5, ease: "elastic.out(1, 0.5)" })
      .to(textMark.current, { scale: 1.1, duration: 1.5, ease: "power1.inOut" }) // Hold "MARK."
      .to(textMark.current, { scale: 5, opacity: 0, filter: "blur(20px)", duration: 0.3, ease: "power2.in" });

    // Phase 4: Final text
    tl.fromTo(textFinal.current, { y: 50, opacity: 0, letterSpacing: "0.5em" }, { y: 0, opacity: 1, letterSpacing: "1em", duration: 1, ease: "power3.out" })
      .to(textFinal.current, { opacity: 0, scale: 1.5, filter: "blur(10px)", duration: 0.5, ease: "power2.in" }, "+=0.5");

    // Phase 5: Reveal Countdown or Live State
    tl.to(introContainer.current, { opacity: 0, duration: 1, ease: "power2.inOut" }, "-=0.2");
    tl.fromTo([countdownContainer.current, liveStateContainer.current], 
      { scale: 0.8, opacity: 0, filter: "blur(20px)" }, 
      { scale: 1, opacity: 1, filter: "blur(0px)", duration: 1, ease: "elastic.out(1, 0.8)" }, "<"
    );

  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <section className="relative w-full h-[85vw] min-h-[350px] max-h-[100dvh] md:h-[100dvh] flex flex-col justify-center items-center overflow-hidden bg-black">
      <StarryBackground />
      {/* Intro Sequence Overlay */}
      <div ref={introContainer} className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden bg-black">
        <div ref={introDot} className="absolute w-4 h-4 bg-white rounded-none mix-blend-difference opacity-0" />
        
        <div ref={textMake} className="absolute font-display font-extrabold text-[15vw] leading-none uppercase text-white opacity-0 whitespace-nowrap">MAKE.</div>
        <div ref={textYour} className="absolute font-display font-extrabold text-[15vw] leading-none uppercase text-white opacity-0 whitespace-nowrap">YOUR.</div>
        <div ref={textMark} className="absolute font-display font-extrabold text-[15vw] leading-none uppercase text-white opacity-0 whitespace-nowrap">MARK.</div>
        
        <div ref={textFinal} className="absolute font-sans font-bold text-xs md:text-sm text-dott-dim uppercase opacity-0 flex flex-col items-center justify-center">
          {isLive && (
            <div className="relative w-4 h-4 md:w-5 md:h-5 mb-3 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: 8.5, duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Lock className="w-full h-full text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 8.7, duration: 0.5, type: "spring", bounce: 0.5 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Unlock className="w-full h-full text-white" />
              </motion.div>
            </div>
          )}
          {isLive ? "DROP 001 UNLOCKED" : "THE DROP BEGINS IN"}
        </div>
      </div>

      {/* Main Hero Content */}
      <div ref={countdownContainer} className="z-10 flex flex-col items-center text-center px-4 opacity-0">
        {!isLive && timeLeft ? (
          <div className="flex flex-col items-center">
            <AnimatedDropText />
            
            <div className="flex items-center justify-center font-display leading-none w-full max-w-[95vw]">
              <AnimatedDigit value={formatNumber(timeLeft.d)} label="Days" />
              <span className="text-dott-dim animate-pulse text-[clamp(2rem,6vw,4rem)] mb-6 md:mb-10 mx-1 md:mx-2">:</span>
              <AnimatedDigit value={formatNumber(timeLeft.h)} label="Hours" />
              <span className="text-dott-dim animate-pulse text-[clamp(2rem,6vw,4rem)] mb-6 md:mb-10 mx-1 md:mx-2">:</span>
              <AnimatedDigit value={formatNumber(timeLeft.m)} label="Mins" />
              <span className="text-dott-dim animate-pulse text-[clamp(2rem,6vw,4rem)] mb-6 md:mb-10 mx-1 md:mx-2">:</span>
              <AnimatedDigit value={formatNumber(timeLeft.s)} label="Secs" />
            </div>

            <div className="mt-12 text-[10px] md:text-sm text-dott-dim tracking-widest text-center">
              JUNE 13 // 05:17 AM // INDIAN STANDARD TIME
            </div>
          </div>
        ) : null}
      </div>

      {/* Live State Component Layer */}
      <div ref={liveStateContainer} className="absolute inset-0 z-10 w-full h-full opacity-0 pointer-events-none">
        {isLive && (
          <div className="pointer-events-auto w-full h-full">
            <LiveState />
          </div>
        )}
      </div>

      {/* Marquee Strips */}
      <div className="absolute bottom-0 w-full overflow-hidden border-t border-dott-border flex flex-col bg-black z-[60]">
        <div className="relative flex whitespace-nowrap border-b border-dott-border py-2">
          <motion.div
            className="flex whitespace-nowrap text-xs tracking-[4px] will-change-transform"
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
            className="flex whitespace-nowrap text-xs tracking-[4px] will-change-transform"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
          >
            {[...Array(4)].map((_, i) => (
              <span key={i} className="pr-4">
                @DOTT.DROP · 350+ STICKERS · ₹19 EACH · FREE DELIVERY ₹350+ · MARK QUIET ECHO LOUD · SIGNALS NOT STICKERS ·&nbsp;
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

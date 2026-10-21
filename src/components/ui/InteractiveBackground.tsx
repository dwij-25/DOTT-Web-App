"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/animations";

const MarqueeText = ({ text, direction, speed = 1 }: { text: string, direction: "left" | "right", speed?: number }) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;
    const items = container.current.children;
    const totalWidth = items[0].clientWidth;

    gsap.to(items, {
      x: direction === "left" ? `-=${totalWidth}` : `+=${totalWidth}`,
      duration: 20 / speed,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize((x) => {
          const val = parseFloat(x);
          return direction === "left" ? val % totalWidth : (val + totalWidth) % totalWidth;
        })
      }
    });
  }, [direction, speed]);

  return (
    <div className="flex whitespace-nowrap overflow-hidden select-none font-display font-extrabold text-[8vw] text-dott-dim/10 uppercase tracking-widest">
      <div ref={container} className="flex">
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
        <span className="px-8">{text}</span>
      </div>
    </div>
  );
};

export default function InteractiveBackground() {
  const container = useRef<HTMLDivElement>(null);
  const parallaxGroup = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Parallax quick setters
    const pX = gsap.quickTo(parallaxGroup.current, "x", { duration: 1, ease: "power2.out" });
    const pY = gsap.quickTo(parallaxGroup.current, "y", { duration: 1, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      // Instantly update CSS variables for the exact flashlight tracking
      if (container.current) {
        container.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        container.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }

      // Calculate parallax offset
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      pX(dx * -30);
      pY(dy * -30);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Float animations for abstract geometric elements
  useGSAP(() => {
    gsap.utils.toArray(".floating-item").forEach((item: any) => {
      gsap.to(item, {
        y: `+=${Math.random() * 40 + 20}`,
        x: `+=${Math.random() * 40 - 20}`,
        rotation: Math.random() * 90 - 45,
        duration: Math.random() * 5 + 5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: Math.random() * -5,
      });
    });
  }, []);

  return (
    <div ref={container} className="absolute inset-0 z-0 overflow-hidden bg-[#030303] pointer-events-none">
      
      {/* 1. Base Dark Faint Grid */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px" // Premium architectural size
        }}
      />

      {/* 2. Soft Ambient Orb following the cursor */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: "radial-gradient(clamp(150px, 40vw, 500px) circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), rgba(255,255,255,0.06), transparent 100%)",
        }}
      />

      {/* 3. The Bright Illuminated Masked Grid */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.25) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(clamp(80px, 20vw, 200px) circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(clamp(80px, 20vw, 200px) circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black 0%, transparent 100%)"
        }}
      />

      {/* Interactive Parallax Group */}
      <div ref={parallaxGroup} className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Live Marquee Text Background */}
        <div className="absolute inset-0 flex flex-col justify-center gap-[10vh] opacity-30 transform -skew-y-6 scale-110">
          <MarqueeText text="DOTT • PIXEL PRECISE • ZERO RESIDUE •" direction="left" speed={0.8} />
          <MarqueeText text="DROP 001 • THE VAULT • UNLOCK THE DROP •" direction="right" speed={1.2} />
          <MarqueeText text="DOTT • PIXEL PRECISE • ZERO RESIDUE •" direction="left" speed={0.9} />
        </div>

        {/* Floating Abstract Geometric Elements */}
        <div className="floating-item absolute top-[20%] left-[15%] w-8 h-8 border-[2px] border-white/10 opacity-50" />
        <div className="floating-item absolute top-[70%] left-[10%] text-white/10 font-bold text-4xl opacity-50">+</div>
        <div className="floating-item absolute top-[30%] right-[20%] w-4 h-4 bg-white/10 opacity-50" />
        <div className="floating-item absolute top-[60%] right-[15%] text-white/10 font-bold text-6xl opacity-50">+</div>
        <div className="floating-item absolute bottom-[15%] right-[40%] w-12 h-2 bg-white/10 opacity-50" />
      </div>

      {/* Vignette to blend the edges to black */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] pointer-events-none mix-blend-multiply" />
    </div>
  );
}

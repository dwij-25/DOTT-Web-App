"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/animations";

export default function GlobalFlashlight() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Instantly update CSS variables for the exact flashlight tracking
      if (container.current) {
        container.current.style.setProperty('--mouse-x', `${e.clientX}px`);
        container.current.style.setProperty('--mouse-y', `${e.clientY}px`);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={container} 
      className="fixed inset-0 pointer-events-none z-[-40]"
    >
      {/* Soft Ambient Orb following the cursor globally */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: "radial-gradient(clamp(150px, 40vw, 500px) circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), rgba(255,255,255,0.06), transparent 100%)",
        }}
      />
    </div>
  );
}

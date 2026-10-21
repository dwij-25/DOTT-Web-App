"use client";
import { useEffect, useState } from "react";

export default function GlobalPixelAnim() {
  const [pixels, setPixels] = useState<{id: number, left: string, delay: number, duration: number, size: number}[]>([]);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    // Reduced from 40 to 15 for massive performance gains
    setPixels(Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      delay: Math.random() * 20,
      duration: Math.random() * 15 + 20, // Slower float up
      size: Math.random() > 0.8 ? 6 : 3, // Blocky pixel sizes
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-45] overflow-hidden">
      {pixels.map((p) => (
        <div 
          key={p.id}
          className="absolute bg-[#b4ff39]/20"
          style={{
            left: p.left,
            width: `${p.size}px`,
            height: `${p.size}px`,
            bottom: "-20px",
            willChange: "transform, opacity",
            animation: `floatUp ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`
          }}
        />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function StarryBackground() {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate static stars once on client to avoid hydration mismatch
    const numStars = 150;
    const generated = Array.from({ length: numStars }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage
      y: Math.random() * 100, // percentage
      // Randomly pick size: most are 1px, some are 2px
      size: Math.random() > 0.85 ? 2 : 1, 
      delay: Math.random() * 5, // random animation delay
      duration: Math.random() * 3 + 2, // random duration between 2s and 5s
    }));
    setStars(generated);
  }, []);

  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-none opacity-80"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animation: `star-twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.1; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

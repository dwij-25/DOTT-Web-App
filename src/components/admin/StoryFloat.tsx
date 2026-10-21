"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";

interface Sticker {
  id: string;
  name: string;
  image_url: string;
}

interface FloatPosition {
  x: number;
  y: number;
  z: number;
  rot: number;
  scale: number;
  blur: number;
  opacity: number;
  flipX: number;
}

// Pseudo-random number generator for consistent layouts
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export default function StoryFloat({ stickers }: { stickers: Sticker[] }) {
  const [positions, setPositions] = useState<FloatPosition[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [seed, setSeed] = useState(Date.now()); // Allows regenerating the layout

  useEffect(() => {
    if (stickers.length === 0) return;

    const random = mulberry32(seed);
    const newPositions: FloatPosition[] = [];
    
    // We want a dense field, let's generate 150 items
    // We'll loop through our stickers and reuse them
    for (let i = 0; i < 150; i++) {
      let x = 0, y = 0, z = 0, rot = 0, scale = 1;
      let inCenter = true;

      // Keep generating until it falls OUTSIDE the immediate center logo area
      // or if it's very deep in the Z axis, it's fine.
      while (inCenter) {
        x = (random() - 0.5) * 160; // -80% to 80%
        y = (random() - 0.5) * 160; // -80% to 80%
        z = (random() - 0.5) * 2000; // -1000 to 1000 depth
        
        // Center avoidance radius
        const distFromCenter = Math.sqrt(x * x + y * y);
        // If it's close to the camera (Z > -200) and close to center, reject it
        if (distFromCenter < 30 && z > -200) {
          inCenter = true;
        } else {
          inCenter = false;
        }
      }

      rot = random() * 360;
      scale = 0.5 + random() * 1.5;
      
      // Calculate depth of field blur
      // If z is deeply negative (far away), blur it more.
      // If z is highly positive (close to camera), maybe slightly blur it or keep it sharp.
      let blur = 0;
      if (z < -400) {
        blur = Math.min(8, Math.abs(z + 400) / 100);
      } else if (z > 600) {
        blur = Math.min(4, (z - 600) / 100);
      }

      // Opacity fades out heavily in the distance to blend into the darkness
      let opacity = 1;
      if (z < -500) {
        opacity = Math.max(0.2, 1 - Math.abs(z + 500) / 800);
      }

      // Randomly flip horizontally for variety
      const flipX = random() > 0.5 ? -1 : 1;

      newPositions.push({ x, y, z, rot, scale, blur, opacity, flipX });
    }

    setPositions(newPositions);
  }, [stickers, seed]);

  const handleExport = async () => {
    setIsExporting(true);
    
    // Allow UI to hide
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(null);
        };
      });

      // Wait a tiny bit for the video frame to be painted
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `DOTT_ZeroGravity_${Date.now()}.png`;
        a.click();
      }

      stream.getTracks().forEach(track => track.stop());

    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to capture screen. Please make sure you grant permission and select the current tab.");
    } finally {
      setIsExporting(false);
    }
  };

  const regenerateLayout = () => {
    setSeed(Date.now());
  };

  if (stickers.length === 0) {
    return <div className="flex h-screen items-center justify-center text-white">No active stickers found.</div>;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#050505] font-sans selection:bg-white selection:text-black">
      
      {/* EXPORT OVERLAY UI (HIDDEN ON EXPORT) */}
      <div className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-500 ${isExporting ? 'opacity-0' : 'opacity-100'}`}>
        <div className="p-8 flex justify-between items-start pointer-events-auto">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-black/50 p-3 rounded-lg border border-white/10 backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm tracking-widest uppercase">Back to Admin</span>
          </Link>

          <div className="flex flex-col items-end gap-4">
            <button
              onClick={regenerateLayout}
              className="flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg border border-white/10 backdrop-blur-md transition-all font-medium uppercase tracking-widest text-sm group"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              Shuffle Field
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-zinc-200 transition-all font-bold uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              <Download className="w-4 h-4" />
              Capture Image
            </button>
            <p className="text-xs text-zinc-500 max-w-xs text-right mt-2 uppercase tracking-wider">
              Select "This Tab" when prompted to capture a clean high-res image of the field.
            </p>
          </div>
        </div>
      </div>

      {/* ZERO GRAVITY 3D SCENE */}
      <div className="w-full h-full flex items-center justify-center">
        {/* Aspect Ratio Constraint for Instagram Story (9:16) */}
        <div 
          className="relative w-full max-w-[500px] aspect-[9/16] bg-black overflow-hidden ring-1 ring-white/10 shadow-2xl"
          style={{ perspective: "1200px" }}
        >
          
          {/* Deep Space Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/20 to-black pointer-events-none" />
          
          {/* Floating Stickers Container */}
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {positions.map((pos, i) => {
              // Pick a random sticker from our pool
              const sticker = stickers[i % stickers.length];
              
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-32 h-32 -ml-16 -mt-16 flex items-center justify-center"
                  style={{
                    transform: `translate3d(${pos.x}%, ${pos.y}%, ${pos.z}px) rotate(${pos.rot}deg) scale(${pos.scale}) scaleX(${pos.flipX})`,
                    opacity: pos.opacity,
                    filter: `blur(${pos.blur}px) drop-shadow(0 20px 30px rgba(0,0,0,0.8))`,
                    zIndex: Math.round(pos.z + 2000), // Ensure proper layering even with 3D
                    willChange: "transform",
                  }}
                >
                  <img 
                    src={sticker.image_url} 
                    alt={sticker.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              );
            })}
          </div>

          {/* DOTT Logo Floating in the exact center */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ 
              transformStyle: "preserve-3d",
              transform: "translateZ(100px)", // Pop the logo forward slightly
            }}
          >
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-white/20 blur-[50px] rounded-full scale-150" />
              {/* Logo text */}
              <h1 className="text-white text-6xl md:text-7xl font-black tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] z-50">
                ::DOTT
              </h1>
            </div>
          </div>

          {/* Vignette Overlay to darken edges and focus center */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-50" />

        </div>
      </div>
    </div>
  );
}

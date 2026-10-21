"use client";

import { motion } from "framer-motion";
import { Pixelify_Sans } from "next/font/google";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Barcode, Lock, Unlock } from "lucide-react";

const pixelFont = Pixelify_Sans({ weight: ["400", "700"], subsets: ["latin"] });

const InstaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const PixelPatternBackground = () => {
  const blocks = [
    [1,1], [2,1], [1,2], [3,1], [1,3], [2,2], [4,2], [2,4], [5,1], [1,5], [3,3], [6,2], [2,6], [4,4], [7,1], [1,7], [5,3], [3,5], [8,2], [2,8], [6,4], [4,6], [9,1], [1,9], [7,3], [3,7], [5,5], [10,2], [2,10]
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[16px] md:rounded-none">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.02] transition-opacity" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '16px 16px', backgroundPosition: 'center center' }} />
      
      {/* Corner Pixel Clouds */}
      <div className="absolute inset-0 opacity-[0.15] group-hover:opacity-5 transition-opacity">
        {[
          { top: 0, left: 0 },
          { top: 0, right: 0 },
          { bottom: 0, left: 0 },
          { bottom: 0, right: 0 }
        ].map((c, ci) => (
          <div key={ci} className="absolute w-[100px] h-[100px] md:w-[150px] md:h-[150px]" style={c}>
            {blocks.map((b, i) => {
              if (i % 3 === ci % 3) return null;
              return (
                <div key={i} className="absolute w-1.5 h-1.5 md:w-2 md:h-2 bg-white group-hover:bg-black transition-colors"
                     style={{
                       [c.left !== undefined ? 'left' : 'right']: b[0] * 8 + (ci % 2 * 4),
                       [c.top !== undefined ? 'top' : 'bottom']: b[1] * 8 + (ci % 3 * 4),
                       opacity: 1 - (b[0] + b[1]) / 15
                     }} 
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Uses ACTUAL container dimensions (not window) so SVG box & button are always pixel-perfect aligned
const PerspectiveRoom = ({ W, H, boxW, boxH, isMobile }: { W: number; H: number; boxW: number; boxH: number, isMobile: boolean }) => {
  const bx = (W - boxW) / 2;
  const by = (H - boxH) / 2;
  const lc = "rgba(255,255,255,0.28)";
  const lw = 0.7;
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  const dX = 7;
  const dY = isMobile ? 3 : 7; // Fewer grid lines on left/right walls in mobile so they are spaced out

  for (let i = 0; i <= dX; i++) {
    const t = i / dX;
    lines.push({ x1: t * W, y1: 0, x2: bx + t * boxW, y2: by });
    lines.push({ x1: t * W, y1: H, x2: bx + t * boxW, y2: by + boxH });
  }
  for (let i = 0; i <= dY; i++) {
    const t = i / dY;
    lines.push({ x1: 0, y1: t * H, x2: bx, y2: by + t * boxH });
    lines.push({ x1: W, y1: t * H, x2: bx + boxW, y2: by + t * boxH });
  }
  
  const dTrans = isMobile ? 4 : 7;
  for (let i = 1; i < dTrans; i++) {
    const p = i / dTrans;
    lines.push({ x1: p * bx, y1: p * by, x2: p * (bx + boxW) + (1 - p) * W, y2: p * by });
    lines.push({ x1: p * bx, y1: p * (by + boxH) + (1 - p) * H, x2: p * (bx + boxW) + (1 - p) * W, y2: p * (by + boxH) + (1 - p) * H });
    lines.push({ x1: p * bx, y1: p * by, x2: p * bx, y2: p * (by + boxH) + (1 - p) * H });
    lines.push({ x1: p * (bx + boxW) + (1 - p) * W, y1: p * by, x2: p * (bx + boxW) + (1 - p) * W, y2: p * (by + boxH) + (1 - p) * H });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {lines.map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={lc} strokeWidth={lw} />)}
      <rect x={bx} y={by} width={boxW} height={boxH} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth={1} rx={isMobile ? 16 : 0} ry={isMobile ? 16 : 0} />
    </svg>
  );
};

const Cube = ({ size, pos, mv, dur }: { size: number; pos: Record<string, string>; mv: { y: number[]; x: number[]; rx: string; ry: string }; dur: number }) => {
  const h = size / 2;
  return (
    <motion.div className="absolute z-10 will-change-transform"
      style={{ width: size, height: size, transformStyle: "preserve-3d", ...pos }}
      animate={{ rotateX: mv.rx === "r" ? [360, 0] : [0, 360], rotateY: mv.ry === "r" ? [360, 0] : [0, 360], y: mv.y, x: mv.x }}
      transition={{
        rotateX: { repeat: Infinity, duration: dur, ease: "linear" },
        rotateY: { repeat: Infinity, duration: dur * 1.3, ease: "linear" },
        y: { repeat: Infinity, duration: dur * 0.9, ease: "easeInOut", repeatType: "mirror" },
        x: { repeat: Infinity, duration: dur * 1.1, ease: "easeInOut", repeatType: "mirror" },
      }}>
      {[`translateZ(${h}px)`, `translateZ(-${h}px) rotateY(180deg)`, `translateX(${h}px) rotateY(90deg)`, `translateX(-${h}px) rotateY(-90deg)`, `translateY(${h}px) rotateX(-90deg)`, `translateY(-${h}px) rotateX(90deg)`]
        .map((t, i) => <div key={i} className="absolute inset-0 border border-white/35 bg-black/60" style={{ transform: t }} />)}
    </motion.div>
  );
};

const Tag = ({ children, cls = "", inv, ay, ax, dur }: { children: React.ReactNode; cls?: string; inv?: boolean; ay?: number[]; ax?: number[]; dur: number }) => (
  <motion.div
    className={`absolute border flex items-center justify-center w-[90px] h-[24px] md:w-[170px] md:h-[40px] z-40 will-change-transform ${inv ? "border-black/50 bg-white/90 text-black" : "border-white/50 bg-black/90 text-white"} ${cls}`}
    animate={{ y: ay, x: ax }}
    transition={{ repeat: Infinity, duration: dur, ease: "easeInOut", repeatType: "mirror" }}>
    <span className="text-[7px] md:text-sm font-bold tracking-widest whitespace-nowrap">{children}</span>
  </motion.div>
);

export default function LiveState() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1440, h: 900 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
      setReady(true);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Box: always landscape 8:5 ratio on desktop and mobile
  const isMobile = dims.w < 768;
  const boxWFrac = isMobile ? 0.65 : 0.46;
  const boxW = dims.w * boxWFrac;
  const boxH = boxW / 1.6;

  const bx = (dims.w - boxW) / 2;
  const by = (dims.h - boxH) / 2;

  // Cube scale: scaled proportionally for mobile
  const cs = (n: number) => Math.max(12, Math.round(n * (isMobile ? 0.35 : 1)));

  // Center elements more on mobile
  const leftEdge = isMobile ? "18%" : "10%";
  const rightEdge = isMobile ? "18%" : "10%";

  const tagOffset = isMobile ? 8 : 30;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className={`absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden ${pixelFont.className}`}
    >
      {ready && <PerspectiveRoom W={dims.w} H={dims.h} boxW={boxW} boxH={boxH} isMobile={isMobile} />}

      {/* Scattered Cubes */}
      <Cube size={cs(42)} pos={{ top: isMobile ? "5%" : "16%", left: isMobile ? "5%" : leftEdge }} mv={{ y: [-20, 20], x: [-12, 12], rx: "n", ry: "n" }} dur={15} />
      <Cube size={cs(58)} pos={{ bottom: isMobile ? "10%" : "20%", right: isMobile ? "10%" : rightEdge }} mv={{ y: [28, -28], x: [12, -12], rx: "r", ry: "n" }} dur={20} />
      <Cube size={cs(30)} pos={{ top: "55%", left: isMobile ? "85%" : "82%" }} mv={{ y: [-35, 35], x: [-18, 18], rx: "n", ry: "r" }} dur={12} />
      <Cube size={cs(72)} pos={{ top: "8%", right: isMobile ? "8%" : rightEdge }} mv={{ y: [-14, 14], x: [-7, 7], rx: "n", ry: "n" }} dur={25} />
      <Cube size={cs(46)} pos={{ bottom: "15%", left: isMobile ? "15%" : "18%" }} mv={{ y: [22, -22], x: [-26, 26], rx: "r", ry: "r" }} dur={18} />
      <Cube size={cs(34)} pos={{ top: "35%", left: isMobile ? "2%" : "3%" }} mv={{ y: [-30, 30], x: [-10, 10], rx: "n", ry: "r" }} dur={14} />
      <Cube size={cs(44)} pos={{ bottom: "35%", right: isMobile ? "2%" : "3%" }} mv={{ y: [16, -16], x: [20, -20], rx: "r", ry: "n" }} dur={16} />

      {/* Labels perfectly centered on the 4 corners (crosshair effect), z-40 so they sit on top of the z-30 main box */}
      <div className="absolute z-40" style={{ top: by - tagOffset, left: bx - tagOffset, transform: "translate(-50%, -50%)" }}>
        <Tag ay={[-10, 10]} dur={4}>
          <a 
            href="https://www.instagram.com/dott.drop" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1 md:gap-2 hover:text-[#b4ff39] transition-colors cursor-pointer"
          >
            <InstaIcon className="w-2 h-2 md:w-3 md:h-3" /> @dott.drop
          </a>
        </Tag>
      </div>
      <div className="absolute z-40" style={{ top: by - tagOffset, left: bx + boxW + tagOffset, transform: "translate(-50%, -50%)" }}>
        <Tag ay={[10, -10]} dur={5} inv>350+ STICKERS</Tag>
      </div>
      <div className="absolute z-40" style={{ top: by + boxH + tagOffset, left: bx - tagOffset, transform: "translate(-50%, -50%)" }}>
        <Tag ay={[-8, 8]} dur={3.5} inv>PIXEL PRECISE</Tag>
      </div>
      <div className="absolute z-40" style={{ top: by + boxH + tagOffset, left: bx + boxW + tagOffset, transform: "translate(-50%, -50%)" }}>
        <Tag ay={[8, -8]} dur={6}>ZERO RESIDUE</Tag>
      </div>

      {/* CENTER BOX — BLACK DEFAULT / WHITE HOVER + ID CARD FONTS */}
      <motion.button
        onClick={() => document.getElementById("boot-section")?.scrollIntoView({ behavior: "smooth" })}
        style={{ width: boxW, height: boxH }}
        className="relative z-30 flex flex-col items-center justify-center gap-2 md:gap-5
                   bg-black/90 backdrop-blur-md group overflow-hidden
                   shadow-[0_0_40px_rgba(255,255,255,0.08)] hover:shadow-[0_0_80px_rgba(255,255,255,0.2)]
                   will-change-transform rounded-[16px] md:rounded-none"
        animate={{ y: [-4, 4] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", repeatType: "mirror" }}
        whileHover={{ scale: 1.03, y: 0 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Hover Wipe Fill */}
        <div className="absolute inset-0 bg-white translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-0" />
        
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(255,255,255,0.08)] group-hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] pointer-events-none z-10 transition-shadow duration-500" />

        <div className="relative z-20 flex flex-col items-center justify-center h-full py-4 md:py-6 px-4 md:px-6 w-full gap-4 md:gap-6">
          <PixelPatternBackground />

          {/* LOGO: filter-none on black box, invert on white hover box */}
          <Image
            src="/dott-logo.png"
            alt="DOTT"
            width={400} height={200}
            style={{ width: Math.round(boxW * 0.65), height: "auto" }}
            className="object-contain filter-none group-hover:invert transition-all duration-500 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:drop-shadow-none"
          />
          
          {/* PIXEL TEXT */}
          <div className="flex flex-col items-center gap-1 md:gap-2">
            <span style={{ fontSize: Math.max(8, Math.round(boxW * 0.05)) }} className={`text-white group-hover:text-black tracking-[0.2em] md:tracking-[0.3em] uppercase drop-shadow-md group-hover:drop-shadow-none ${pixelFont.className}`}>
              MAKE YOUR MARK.
            </span>
            <span className="text-[8px] md:text-[10px] text-white/60 group-hover:text-black/60 tracking-widest font-bold uppercase transition-colors duration-500 mt-1">
              DROP 101 UNLOCKED
            </span>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

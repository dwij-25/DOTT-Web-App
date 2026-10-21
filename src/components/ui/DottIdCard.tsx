"use client";

import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface DottIdCardProps {
  user: {
    name: string;
    dott_handle: string;
    tier: string;
    member_since: string;
    orders: number;
    points: number;
    avatar_url?: string;
  };
}

const AVATAR_OPTIONS = [
  "/avatars/custom-2.jpg",
  "/avatars/custom-3.jpg",
  "/avatars/custom-4.jpg",
  "/avatars/custom-5.jpg",
  "/avatars/custom-6.jpg",
  "/avatars/custom-7.jpg",
  "/avatars/custom-8.jpg",
  "/avatars/custom-9.jpg",
  "/avatars/custom-12.jpg",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=dott1",
];

export default function DottIdCard({ user }: DottIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Mouse position relative to center of card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for 3D tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), { stiffness: 150, damping: 20 });

  // Spring for the lanyard swing effect based on mouse moving
  const swing = useSpring(0, { stiffness: 50, damping: 10 });

  // Drag logic
  const dragY = useMotionValue(0);
  const dragX = useMotionValue(0);
  
  // Stretch the lanyard visually by mapping drag values to the bezier control points
  const lanyardCurve = useTransform(
    [dragX, dragY],
    ([x, y]: number[]) => {
      const stretchY = Math.max(0, y) * 0.4;
      const stretchX = x * 0.2;
      return `M 20 0 C ${40 + stretchX} ${80 + stretchY}, ${60 + stretchX} ${80 + stretchY}, 80 0`;
    }
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current || isAvatarModalOpen) return;
      const rect = cardRef.current.getBoundingClientRect();
      
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      
      mouseX.set(x);
      mouseY.set(y);
      swing.set(x * 10);
    };

    const handleMouseLeave = () => {
      if (isAvatarModalOpen) return;
      mouseX.set(0);
      mouseY.set(0);
      swing.set(0);
    };

    const element = cardRef.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (element) {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [mouseX, mouseY, swing, isAvatarModalOpen]);

  // Handle Avatar Update
  const handleSelectAvatar = async (url: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: url })
      });
      if (res.ok) {
        setAvatarUrl(url);
        setIsAvatarModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="relative flex flex-col items-center pt-24 pb-8" style={{ perspective: 1200 }}>
        {/* Dynamic Lanyard String */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 pointer-events-none z-0">
          <motion.svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]" fill="none">
            <defs>
              <pattern id="lanyard-pattern" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                <rect width="15" height="15" fill="#111" />
                <image href="/dott-icon.jpg" x="1.5" y="1.5" width="12" height="12" preserveAspectRatio="xMidYMid slice" opacity="0.9" />
              </pattern>
            </defs>
            {/* Lanyard Band shadow/base */}
            <motion.path d={lanyardCurve} stroke="#000" strokeWidth="13" strokeLinecap="round" />
            {/* Textured Lanyard Band */}
            <motion.path d={lanyardCurve} stroke="url(#lanyard-pattern)" strokeWidth="12" strokeLinecap="round" />
          </motion.svg>
          {/* Lanyard Top Attachment point */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-4 h-6 bg-[#111] rounded-sm border border-white/20 shadow-xl z-20" />
        </div>

        <motion.div
          ref={cardRef}
          drag={!isAvatarModalOpen}
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.4}
          style={{
            x: dragX,
            y: dragY,
            rotateX: isAvatarModalOpen ? 0 : rotateX,
            rotateY: isAvatarModalOpen ? 0 : rotateY,
            rotateZ: isAvatarModalOpen ? 0 : swing,
            zIndex: 10,
          }}
          whileTap={{ cursor: isAvatarModalOpen ? "auto" : "grabbing", scale: isAvatarModalOpen ? 1 : 1.02 }}
          className={`relative w-[80vw] max-w-[288px] aspect-[2/3.2] bg-[#111] border border-[#222] rounded-[24px] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] font-body group flex flex-col ${isAvatarModalOpen ? '' : 'cursor-grab'} ${user.tier === "GRID" ? "shadow-[0_20px_50px_rgba(180,255,57,0.2)]" : ""} ${user.tier === "MARK" ? "shadow-[0_20px_50px_rgba(255,255,255,0.3)]" : ""}`}
        >
          {/* Holographic overlay on holder */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay rounded-[24px]" />
          
          {/* Clip hole at top for the hanger */}
          <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-12 h-6 bg-[#1A1A1A] rounded-md border border-[#333] shadow-[0_5px_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center">
            <div className="w-6 h-1.5 bg-black rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]" />
          </div>
          
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black rounded-full opacity-50" />

          {/* Inner Card */}
          <div className={`flex-1 mt-6 relative rounded-lg overflow-hidden border shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] ${
            user.tier === "PIXEL" 
              ? "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 border-orange-400"
              : user.tier === "MARK" 
              ? "bg-gradient-to-br from-[#E65C00] via-[#F9D423] to-[#FF4E50] border-[#FF8C00]/50" 
              : user.tier === "GRID"
              ? "bg-[#050505] border-[#b4ff39]/50"
              : "bg-gradient-to-br from-[#d7d2cc] via-[#f5f5f5] to-[#d7d2cc] border-white/50"
          }`}>
            
            {/* Subtle grid pattern on card */}
            <div className={`absolute inset-0 bg-[size:10px_10px] ${
              user.tier === "GRID" 
                ? "bg-[linear-gradient(rgba(180,255,57,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(180,255,57,0.1)_1px,transparent_1px)]"
                : "bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)]"
            }`} />
            
            {/* Left Vertical Text Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center border-r z-10 pointer-events-none ${
              user.tier === "GRID" ? "bg-[#b4ff39]/10 border-[#b4ff39]/20" : "bg-black/5 border-black/20"
            }`}>
               <div className={`transform -rotate-90 text-[7px] font-black tracking-[0.3em] whitespace-nowrap ${
                 user.tier === "GRID" ? "text-[#b4ff39]" : "text-black/80"
               }`}>
                 DOTT. IDENTIFICATION // {new Date(user.member_since).getFullYear()} // SECURE
               </div>
            </div>

            {/* Stacked Background Typography */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none pl-8 pt-4 ${
              user.tier === "GRID" ? "text-[#b4ff39]" : "text-black"
            }`}>
              <div className="font-display font-black text-5xl tracking-tighter leading-none uppercase">{user.tier}</div>
              <div className="font-display font-black text-5xl tracking-tighter leading-none uppercase">{user.tier}</div>
              <div className="font-display font-black text-5xl tracking-tighter leading-none uppercase">{user.tier}</div>
              <div className="font-display font-black text-5xl tracking-tighter leading-none uppercase">{user.tier}</div>
            </div>

            {/* Top Right Logo */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-lg overflow-hidden p-1 ${
                user.tier === "GRID" ? "bg-[#b4ff39] border-[#b4ff39]" : "bg-black border-white/20"
              }`}>
                 <img src="/dott-icon.jpg" alt="DOTT." className={`w-full h-full object-cover rounded-full ${user.tier === "GRID" ? "mix-blend-multiply" : ""}`} />
              </div>
            </div>

            {/* Center Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-between pl-8 pr-4 py-8">
              
              {/* Avatar Placeholder / Diamond */}
              <button 
                onClick={() => setIsAvatarModalOpen(true)}
                className="mt-8 relative group/avatar cursor-pointer outline-none hover:scale-105 transition-transform"
              >
                <div className={`w-24 h-24 rotate-45 flex items-center justify-center overflow-hidden shadow-2xl relative z-10 border-2 ${
                  user.tier === "GRID" ? "bg-[#111] border-[#b4ff39]" : "bg-black border-black"
                }`}>
                   <div className="-rotate-45 w-[150%] h-[150%] flex-shrink-0 flex items-center justify-center">
                     {avatarUrl ? (
                       <img src={avatarUrl} alt="Avatar" className="w-full h-full object-contain scale-[0.85]" />
                     ) : (
                       <span className={`font-display font-black text-4xl ${user.tier === "GRID" ? "text-[#b4ff39]" : "text-white"}`}>
                         {user.name ? user.name.charAt(0).toUpperCase() : user.dott_handle.charAt(0).toUpperCase()}
                       </span>
                     )}
                   </div>
                </div>
                <div className={`absolute -inset-2 border rotate-45 scale-110 transition-colors ${
                  user.tier === "GRID" ? "border-[#b4ff39]/40 group-hover/avatar:border-[#b4ff39]" : "border-black/20 group-hover/avatar:border-white/50"
                }`} />
                
                {/* Hover Edit Indicator */}
                <div className="absolute inset-0 flex items-center justify-center z-20 opacity-100 md:opacity-0 md:group-hover/avatar:opacity-100 transition-opacity pointer-events-none hide-on-download">
                  <div className={`text-[8px] font-bold tracking-widest px-2 py-1 rounded-sm rotate-0 mt-16 md:-mt-2 shadow-lg border ${
                    user.tier === "GRID" ? "bg-[#b4ff39] text-black border-black" : "bg-black/80 text-white border-white/20"
                  }`}>
                    EDIT
                  </div>
                </div>
              </button>

              {/* Bottom Geometric Name Plates */}
              <div className="w-full flex flex-col items-center gap-2 mt-auto pb-4 pointer-events-none">
                {/* Name Plate */}
                <div className={`relative w-full max-w-[90%] px-4 py-2 flex justify-center clip-path-slant shadow-xl ${
                  user.tier === "GRID" ? "bg-[#b4ff39] text-black" : "bg-black text-white"
                }`}>
                  <div className={`absolute inset-0 border ${user.tier === "GRID" ? "border-black/20" : "border-white/10"}`} />
                  <span className="font-display font-bold uppercase tracking-widest text-xs relative z-10 truncate max-w-full">
                    {user.name || `@${user.dott_handle}`}
                  </span>
                  {/* Decorative cutouts */}
                  <div className={`absolute top-0 left-0 w-2 h-full ${user.tier === "GRID" ? "bg-black" : "bg-[#E65C00]"}`} />
                </div>

                {/* Role/Handle Plate */}
                <div className={`relative w-full max-w-[80%] border px-4 py-1.5 flex justify-center clip-path-slant shadow-md ${
                  user.tier === "GRID" ? "bg-[#111] border-[#b4ff39] text-[#b4ff39]" : user.tier === "MARK" ? "bg-[#FF4E50] border-black/50 text-black" : user.tier === "PIXEL" ? "bg-white border-black/50 text-black" : "bg-white border-black/50 text-black"
                }`}>
                  <span className="font-bold uppercase tracking-[0.2em] text-[10px] truncate max-w-full">
                    {user.name ? `@${user.dott_handle}` : user.tier + " MEMBER"}
                  </span>
                </div>
              </div>

            </div>

            {/* Barcode and bottom tech details */}
            <div className="absolute bottom-2 right-2 flex flex-col items-end z-10 pointer-events-none">
              <div className={`w-24 h-6 mix-blend-overlay ${
                user.tier === "GRID" ? "bg-[repeating-linear-gradient(90deg,rgba(180,255,57,0.4),rgba(180,255,57,0.4)_2px,transparent_2px,transparent_4px,rgba(180,255,57,0.6)_4px,rgba(180,255,57,0.6)_5px,transparent_5px,transparent_8px)]" : "bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.8),rgba(0,0,0,0.8)_2px,transparent_2px,transparent_4px,rgba(0,0,0,0.9)_4px,rgba(0,0,0,0.9)_5px,transparent_5px,transparent_8px)]"
              }`} />
              <div className={`text-[6px] font-mono font-bold tracking-widest mt-1 ${user.tier === "GRID" ? "text-[#b4ff39]" : "text-black"}`}>ID: {user.orders.toString().padStart(4, '0')}-{user.points}</div>
            </div>
          </div>

        </motion.div>

        {/* Global styles for the clip-paths to make the geometric shapes work */}
        <style dangerouslySetInnerHTML={{__html: `
          .clip-path-slant {
            clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
          }
        `}} />
      </div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAvatarModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/20 p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF4E50] to-[#F9D423]" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-display font-black text-xl tracking-widest text-white">SELECT AVATAR</h3>
                  <p className="text-[10px] text-white/50 tracking-[0.2em]">INITIALIZE NEW VISUAL IDENTITY</p>
                </div>
                <button 
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                {/* Reset to Initial Letter Button */}
                <button
                  disabled={isUpdating}
                  onClick={() => handleSelectAvatar("")}
                  className={`aspect-square bg-[#1A1A1A] flex items-center justify-center border-2 transition-all hover:scale-105 overflow-hidden ${
                    avatarUrl === "" ? 'border-[#b4ff39]' : 'border-white/10 hover:border-white/40'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="font-display font-black text-2xl text-white/50">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.dott_handle.charAt(0).toUpperCase()}
                  </span>
                </button>
                
                {AVATAR_OPTIONS.map((url, i) => (
                  <button
                    key={i}
                    disabled={isUpdating}
                    onClick={() => handleSelectAvatar(url)}
                    className={`aspect-square bg-black border-2 transition-all hover:scale-105 overflow-hidden ${
                      avatarUrl === url ? 'border-[#b4ff39]' : 'border-white/10 hover:border-white/40'
                    } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <img src={url} alt={`Avatar ${i+1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>

              <div className="text-[8px] text-white/30 text-center tracking-widest font-mono">
                GENERATED BY DICEBEAR PIXEL ART MODULE
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, X, Zap, Lock, Unlock, Package, Star } from "lucide-react";

interface TierPerksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDrops: number;
}

export default function TierPerksModal({ isOpen, onClose, currentDrops }: TierPerksModalProps) {
  if (!isOpen) return null;

  const getTierStatus = (required: number) => {
    if (currentDrops >= required) return { status: "UNLOCKED", remaining: 0 };
    return { status: "LOCKED", remaining: required - currentDrops };
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8"
      >
        <div className="w-full max-w-6xl max-h-full overflow-y-auto no-scrollbar relative">
          <div className="sticky top-0 right-0 flex justify-end z-50 mb-4 pointer-events-none">
            <button 
              onClick={onClose}
              className="pointer-events-auto bg-black border border-white/20 p-4 hover:bg-white hover:text-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-white font-display text-4xl md:text-6xl font-bold tracking-widest mb-4">ASCENSION TIERS</h2>
            <p className="text-white/50 tracking-[0.2em] text-xs font-mono">YOUR CURRENT DROPS SECURED: <span className="text-white text-base font-bold">{currentDrops}</span></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* PIXEL TIER */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="border border-white/10 bg-white/5 relative overflow-hidden flex flex-col group hover:border-white/30 transition-colors"
            >
              <div className="p-8 pb-0 border-b border-white/10 relative">
                <div className="absolute top-0 right-0 opacity-5">
                  <ShieldCheck className="w-48 h-48 -translate-y-12 translate-x-12" />
                </div>
                <div className="text-[10px] tracking-widest text-white/50 mb-2">TIER 01</div>
                <h3 className="font-display text-5xl font-extrabold tracking-tighter text-white mb-6">PIXEL</h3>
                
                <div className="bg-black/50 border border-white/10 p-4 mb-8 flex justify-between items-center">
                  <div className="text-[10px] tracking-[0.2em] text-white/40">REQUIREMENT</div>
                  <div className="font-bold tracking-widest text-sm">0 DROPS</div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col gap-6">
                <div className="flex gap-4">
                  <Package className="w-5 h-5 text-white/50 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">STANDARD DROP ACCESS</div>
                    <div className="text-[10px] text-white/40 tracking-wider">Access to all standard sticker drops and vault items.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <ShieldCheck className="w-5 h-5 text-white/50 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">BASIC DIGITAL ID</div>
                    <div className="text-[10px] text-white/40 tracking-wider">Your personal DOTT OS digital tracking card.</div>
                  </div>
                </div>
              </div>

              <div className="bg-white text-black p-4 text-center text-xs font-bold tracking-[0.2em]">
                CURRENTLY ACTIVE
              </div>
            </motion.div>

            {/* GRID TIER */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="border border-[#b4ff39]/30 bg-[#b4ff39]/5 relative overflow-hidden flex flex-col group hover:border-[#b4ff39]/60 transition-colors shadow-[0_0_30px_rgba(180,255,57,0.05)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,255,57,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="p-8 pb-0 border-b border-[#b4ff39]/20 relative z-10">
                <div className="absolute top-0 right-0 opacity-10">
                  <ShieldCheck className="w-48 h-48 -translate-y-12 translate-x-12 text-[#b4ff39]" />
                </div>
                <div className="text-[10px] tracking-widest text-[#b4ff39] mb-2 drop-shadow-[0_0_5px_rgba(180,255,57,0.5)]">TIER 02</div>
                <h3 className="font-display text-5xl font-extrabold tracking-tighter text-white mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">GRID</h3>
                
                <div className="bg-black/50 border border-[#b4ff39]/20 p-4 mb-8 flex justify-between items-center">
                  <div className="text-[10px] tracking-[0.2em] text-[#b4ff39]/70">REQUIREMENT</div>
                  <div className="font-bold tracking-widest text-sm text-[#b4ff39]">4 DROPS</div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col gap-6 relative z-10">
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-[#b4ff39] flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">1.05X ECHO MULTIPLIER</div>
                    <div className="text-[10px] text-white/40 tracking-wider">Earn 5% more Echo Points on every secure drop.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Unlock className="w-5 h-5 text-[#b4ff39] flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">EARLY ACCESS</div>
                    <div className="text-[10px] text-white/40 tracking-wider">Enter new Boot Drops 1 hour before the public.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Star className="w-5 h-5 text-[#b4ff39] flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">GRID EXCLUSIVES</div>
                    <div className="text-[10px] text-white/40 tracking-wider">Access to stickers locked behind the GRID firewall.</div>
                  </div>
                </div>
              </div>

              {(() => {
                const { status, remaining } = getTierStatus(4);
                if (status === "UNLOCKED") {
                  return (
                    <div className="bg-[#b4ff39] text-black p-4 text-center text-xs font-bold tracking-[0.2em]">
                      UNLOCKED
                    </div>
                  );
                }
                return (
                  <div className="bg-black border-t border-[#b4ff39]/20 p-4 text-center text-xs font-bold tracking-[0.2em] text-[#b4ff39]/50 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    {remaining} MORE {remaining === 1 ? 'DROP' : 'DROPS'} REQUIRED
                  </div>
                );
              })()}
            </motion.div>

            {/* MARK TIER */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="border border-[#b539ff]/40 bg-[#b539ff]/5 relative overflow-hidden flex flex-col group hover:border-[#b539ff]/80 transition-colors shadow-[0_0_40px_rgba(181,57,255,0.1)]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(181,57,255,0.15)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              {/* Glitch Overlay Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-20 mix-blend-screen bg-[url('https://grainy-gradients.vercel.app/noise.svg')] transition-opacity" />

              <div className="p-8 pb-0 border-b border-[#b539ff]/30 relative z-10">
                <div className="absolute top-0 right-0 opacity-15">
                  <ShieldCheck className="w-48 h-48 -translate-y-12 translate-x-12 text-[#b539ff]" />
                </div>
                <div className="text-[10px] tracking-widest text-[#b539ff] mb-2 drop-shadow-[0_0_8px_rgba(181,57,255,0.8)] animate-pulse">MAXIMUM CLEARANCE</div>
                <h3 className="font-display text-5xl font-extrabold tracking-tighter text-white mb-6 drop-shadow-[4px_4px_0_rgba(181,57,255,0.5)]">MARK</h3>
                
                <div className="bg-black/80 border border-[#b539ff]/30 p-4 mb-8 flex justify-between items-center backdrop-blur-md">
                  <div className="text-[10px] tracking-[0.2em] text-[#b539ff]/70">REQUIREMENT</div>
                  <div className="font-bold tracking-widest text-sm text-[#b539ff]">10 DROPS</div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col gap-6 relative z-10">
                <div className="flex gap-4">
                  <Package className="w-5 h-5 text-[#b539ff] flex-shrink-0 drop-shadow-[0_0_5px_rgba(181,57,255,0.5)]" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">ZERO-G SHIPPING</div>
                    <div className="text-[10px] text-white/50 tracking-wider">Free global shipping on all future drop manifests.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Zap className="w-5 h-5 text-[#b539ff] flex-shrink-0 drop-shadow-[0_0_5px_rgba(181,57,255,0.5)]" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">1.10X ECHO MULTIPLIER</div>
                    <div className="text-[10px] text-white/50 tracking-wider">Earn 10% more Echo Points. Maximize your yields.</div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <ShieldCheck className="w-5 h-5 text-[#b539ff] flex-shrink-0 drop-shadow-[0_0_5px_rgba(181,57,255,0.5)]" />
                  <div>
                    <div className="text-xs font-bold tracking-widest mb-1 text-white">ELITE PHYSICAL ID</div>
                    <div className="text-[10px] text-white/50 tracking-wider">Receive a custom laser-etched physical DOTT OS ID Card.</div>
                  </div>
                </div>
              </div>

              {(() => {
                const { status, remaining } = getTierStatus(10);
                if (status === "UNLOCKED") {
                  return (
                    <div className="bg-[#b539ff] text-white p-4 text-center text-xs font-bold tracking-[0.2em] shadow-[0_0_20px_rgba(181,57,255,0.5)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      UNLOCKED
                    </div>
                  );
                }
                return (
                  <div className="bg-black border-t border-[#b539ff]/30 p-4 text-center text-xs font-bold tracking-[0.2em] text-[#b539ff]/50 flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    {remaining} MORE {remaining === 1 ? 'DROP' : 'DROPS'} REQUIRED
                  </div>
                );
              })()}
            </motion.div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

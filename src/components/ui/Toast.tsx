"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store";

export default function Toast() {
  const toastMessage = useUIStore((state) => state.toastMessage);

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-black/90 backdrop-blur-md border border-[#b4ff39] px-6 py-4 flex items-center gap-3 shadow-[0_0_20px_rgba(180,255,57,0.2)]">
            <div className="w-2 h-2 bg-[#b4ff39] animate-pulse rounded-full" />
            <span className="font-display font-bold text-white text-xs md:text-sm tracking-widest whitespace-nowrap">
              {toastMessage}
            </span>
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-[#b4ff39]" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-[#b4ff39]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

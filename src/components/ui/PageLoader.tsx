"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface PageLoaderProps {
  variant: "HOME" | "PROFILE" | "VAULT";
}

export default function PageLoader({ variant }: PageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ultra-snappy transition to eliminate artificial redirect lag
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 60);

    return () => clearTimeout(timer);
  }, [variant]);

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 0.8 }}
          exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 pointer-events-none"
        >
          <div className="text-white font-mono text-[10px] tracking-[0.3em] uppercase text-[#b4ff39]">
            INITIALIZING SIGNAL...
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

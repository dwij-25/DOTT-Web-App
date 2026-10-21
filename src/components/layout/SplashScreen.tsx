"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen() {
  const [stage, setStage] = useState(0);
  const [show, setShow] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    // Only show once per user browser session to prevent slow repeat navigations
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("dott_splash_seen");
      if (seen) {
        return;
      }
      sessionStorage.setItem("dott_splash_seen", "true");
      setShow(true);
    }

    setStage(1);

    // Fast typing sequence (~300ms total)
    const timer1 = setTimeout(() => {
      setStage(2);
      const fullText = "DOTT.";
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(fullText.slice(0, i + 1));
        i++;
        if (i >= fullText.length) clearInterval(interval);
      }, 30);
    }, 40);

    const timer2 = setTimeout(() => setStage(3), 180);
    const timer3 = setTimeout(() => setStage(4), 320);

    // Dismiss splash quickly
    const timer4 = setTimeout(() => {
      setStage(5);
      setTimeout(() => setShow(false), 150);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {stage < 5 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black text-white"
        >
          <div className="flex flex-col items-center justify-center w-full max-w-md px-6">
            <h1 className="font-body text-4xl tracking-[0.2em] font-bold h-10 mb-4">
              {typedText}
              {stage >= 2 && stage < 5 && (
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="inline-block w-4 h-8 bg-white ml-1 align-middle"
                />
              )}
            </h1>
            
            <div className="h-6">
              {stage >= 3 && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-xl text-white/50"
                >
                  Make Your Mark.
                </motion.p>
              )}
            </div>

            <div className="w-full h-1 mt-12 bg-white/10 overflow-hidden relative">
              {stage >= 4 && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.25, ease: "linear" }}
                  className="h-full bg-white flex items-center justify-end"
                >
                  <div className="w-full h-full flex gap-px px-1">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="h-full w-2 bg-black/50"
                        animate={{ height: ["100%", "20%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 0.2 + Math.random() * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  const handleBack = () => {
    // If there's no history, window.history.length is 1 or 2. 
    // It's safer to just try router.back(). If it doesn't do anything, 
    // the user can still use site navigation.
    // However, to be slightly smarter:
    if (typeof window !== "undefined" && window.history.length > 2) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button 
      onClick={handleBack}
      className="text-white/50 hover:text-white font-bold tracking-widest text-xs border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors inline-block"
    >
      ← GO BACK
    </button>
  );
}

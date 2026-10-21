"use client";

import dynamic from "next/dynamic";
import KickoffOverlays from "@/components/sections/KickoffOverlays";

// Dynamically import the 3D experience to avoid SSR issues with Three.js
const KickoffExperience = dynamic(
  () => import("@/components/sections/KickoffExperience"),
  { ssr: false, loading: () => <div className="min-h-screen bg-[#050505] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#E83C3C] border-t-transparent rounded-full animate-spin" /></div> }
);

export default function KickoffPage() {
  return (
    <main className="relative w-full bg-[#050505]">
      {/* Fixed 3D Canvas in background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <KickoffExperience />
      </div>
      
      {/* Scrollable HTML Overlays */}
      <div className="relative z-10 w-full overflow-hidden">
        <KickoffOverlays />
      </div>
    </main>
  );
}

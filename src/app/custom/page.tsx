"use client";

import { motion } from "framer-motion";
import PageLoader from "@/components/ui/PageLoader";
import Link from "next/link";

export default function CustomStickersPage() {
  // Replace this with your actual Google Form link
  const GOOGLE_FORM_LINK = "https://forms.gle/wjev41w1y4KAAya96";

  return (
    <main className="flex flex-col w-full min-h-screen pt-24 bg-[#0A0A0A] relative text-white font-body">
      <PageLoader variant="VAULT" />
      
      <div className="max-w-7xl mx-auto w-full px-8 md:px-16 lg:px-24">
        <Link 
          href="/vault" 
          className="text-white/50 hover:text-white font-bold tracking-widest text-xs border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors inline-block mb-12"
        >
          ← BACK TO VAULT
        </Link>
      </div>

      <div className="max-w-7xl mx-auto w-full px-8 md:px-16 lg:px-24 pb-24">
        
        {/* Header Section */}
        <div className="mb-16 border-b border-white/20 pb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-black text-4xl sm:text-5xl md:text-7xl uppercase tracking-tighter mb-4 break-words"
          >
            CUSTOM <span className="text-[#b4ff39]">CREATIONS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/50 max-w-2xl text-sm md:text-base leading-relaxed tracking-wide"
          >
            Your identity. Your design. Whether you want custom text in our curated fonts or have your own artwork you want to stick everywhere, submit your request below.
          </motion.p>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Custom Text Sticker */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="border border-white/20 bg-[#0D0D0D] p-8 flex flex-col justify-between group hover:border-[#b4ff39]/50 transition-colors"
          >
            <div>
              <div className="text-[#b4ff39] font-pixel text-xs tracking-[0.2em] mb-4">/// OPTION 01</div>
              <h2 className="font-display font-black text-2xl md:text-3xl uppercase mb-4 group-hover:text-[#b4ff39] transition-colors break-words">TEXT IDENTITY</h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Choose from our brutalist fonts, write your name, handle, or favorite quote. Perfect for laptops, cases, and gear.
              </p>
            </div>
            
            <a 
              href={GOOGLE_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-black font-bold tracking-widest text-xs px-6 py-4 text-center hover:bg-gray-200 transition-colors uppercase w-full"
            >
              CREATE TEXT STICKER ↗
            </a>
          </motion.div>

          {/* Custom Image Sticker */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="border border-white/20 bg-[#0D0D0D] p-8 flex flex-col justify-between group hover:border-[#b4ff39]/50 transition-colors relative overflow-hidden"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            
            <div className="relative z-10">
              <div className="text-[#b4ff39] font-pixel text-xs tracking-[0.2em] mb-4">/// OPTION 02</div>
              <h2 className="font-display font-black text-2xl md:text-3xl uppercase mb-4 group-hover:text-[#b4ff39] transition-colors break-words">YOUR ARTWORK</h2>
              <p className="text-white/50 text-sm mb-8 leading-relaxed">
                Upload your own logo, illustration, or design. We will print it with our premium gloss or matte finish and ship it to you.
              </p>
            </div>

            <a 
              href={GOOGLE_FORM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#b4ff39] text-black font-bold tracking-widest text-xs px-6 py-4 text-center hover:bg-[#9de62b] transition-colors uppercase w-full relative z-10 shadow-[0_0_20px_rgba(180,255,57,0.1)] group-hover:shadow-[0_0_30px_rgba(180,255,57,0.2)]"
            >
              UPLOAD CUSTOM ART ↗
            </a>
          </motion.div>

        </div>
        
        {/* Footer info */}
        <div className="mt-16 border-t border-white/10 pt-8 flex items-center justify-between text-xs text-white/30 tracking-widest font-bold uppercase">
          <span>PROCESSING TIME: 3-5 BUSINESS DAYS</span>
          <span>HIGH QUALITY VINYL</span>
        </div>
      </div>
    </main>
  );
}

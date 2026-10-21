import React from "react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-32 px-6 font-body selection:bg-white selection:text-black">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 border-b border-white/20 pb-8 text-center md:text-left">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 tracking-tight">DOTT. CONTACT</h1>
          <div className="inline-block border border-white/20 px-6 py-4 bg-black mt-4">
            <p className="font-mono text-sm tracking-widest text-white/70 italic">
              "We're real people. Reach us like one."
            </p>
          </div>
        </header>

        <div className="space-y-12 text-sm md:text-base leading-relaxed text-white/80 font-mono">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left Column */}
            <div className="space-y-12">
              <section>
                <h2 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-xs uppercase">FOR ORDERS AND DELIVERIES</h2>
                <a href="mailto:dottdrop@gmail.com" className="text-xl text-white hover:text-[#b4ff39] transition-colors border-b border-white/30 hover:border-[#b4ff39] pb-1">
                  dottdrop@gmail.com
                </a>
                <p className="mt-4 text-white/50 text-xs tracking-widest uppercase">Reply time: within 24 hours</p>
              </section>

              <section>
                <h2 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-xs uppercase">FOR RETURNS AND REPLACEMENTS</h2>
                <a href="mailto:dottdrop@gmail.com" className="text-xl text-white hover:text-[#b4ff39] transition-colors border-b border-white/30 hover:border-[#b4ff39] pb-1">
                  dottdrop@gmail.com
                </a>
                <p className="mt-4 text-white/50 text-xs tracking-widest uppercase">Reply time: within 24 hours</p>
              </section>

              <section>
                <h2 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-xs uppercase">FOR CUSTOM STICKERS AND BULK ORDERS</h2>
                <a href="mailto:dottdrop@gmail.com" className="text-xl text-white hover:text-[#b4ff39] transition-colors border-b border-white/30 hover:border-[#b4ff39] pb-1">
                  dottdrop@gmail.com
                </a>
                <p className="mt-4 text-white/50 text-xs tracking-widest uppercase">Reply time: 1-2 business days</p>
              </section>

              <section>
                <h2 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-xs uppercase">FOR COLLABS AND PARTNERSHIPS</h2>
                <a href="mailto:dottdrop@gmail.com" className="text-xl text-white hover:text-[#b4ff39] transition-colors border-b border-white/30 hover:border-[#b4ff39] pb-1 mb-4 inline-block">
                  dottdrop@gmail.com
                </a>
                <p className="text-white/70">We work with creators, artists, and brands.</p>
                <p className="text-white/70">Pitch us something good.</p>
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-12">
              <section className="bg-[#111] border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <h2 className="font-bold text-white mb-4 tracking-widest text-xs border-b border-white/10 pb-2">FIND US</h2>
                <a href="https://instagram.com/dott.drop" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white hover:text-[#b4ff39] transition-colors group">
                  <div className="w-8 h-8 border border-white/20 group-hover:border-[#b4ff39] rounded flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                  </div>
                  <span>@dott.drop</span>
                </a>
              </section>

              <section className="bg-[#111] border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <h2 className="font-bold text-white mb-4 tracking-widest text-xs border-b border-white/10 pb-2">BASED IN</h2>
                <p className="text-lg mb-2">Ahmedabad, Gujarat, India</p>
                <p className="text-white/40 text-xs tracking-widest uppercase">[We don't have a walk-in store. Yet.]</p>
              </section>

              <section className="bg-[#111] border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <h2 className="font-bold text-white mb-4 tracking-widest text-xs border-b border-white/10 pb-2">BUSINESS HOURS</h2>
                <p className="mb-2">Monday to Saturday</p>
                <p className="text-[#b4ff39] mb-4">10 AM to 7 PM IST</p>
                <p className="text-white/60 text-sm">We try to respond to all messages within 24 hours.</p>
                <p className="text-white/60 text-sm italic mt-2">Sundays we're probably stickering something.</p>
              </section>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

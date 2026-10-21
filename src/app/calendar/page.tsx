"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DropCalendarPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32 px-6 font-body selection:bg-white selection:text-black">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-20 text-center border-b border-white/10 pb-16">
          <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter mb-6">DROP CALENDAR</h1>
          <div className="inline-block border border-white/20 px-8 py-6 bg-[#0A0A0A] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
            <p className="font-mono text-sm tracking-widest text-white/70 italic">
              "Every drop is an event. <br/>Not a sale."
            </p>
          </div>
        </header>

        {/* Drops List */}
        <div className="space-y-12">
          
          {/* DROP 001 */}
          <DropCard 
            number="001"
            title="BOOT"
            status="LIVE"
            statusColor="text-[#b4ff39]"
            date="June 13, 2025"
            theme="Terminal culture. Builders. First runs. For the ones who start from nothing."
            price="₹30 per sticker (exclusive first drop)"
            availability="While stock lasts"
            actionText="[Enter Drop →]"
            actionLink="/#boot-section"
            active
          />

          {/* DROP 002 */}
          <DropCard 
            number="002"
            title="GLITCH"
            status="🔒 COMING SOON"
            date="Q3 2025"
            theme="Error culture. Gaming. The beauty of broken things. For those who thrive in chaos."
            actionText="[Notify Me When It Drops →]"
            actionLink="#subscribe"
          />

          {/* DROP 003 */}
          <DropCard 
            number="003"
            title="FRAME"
            status="🔒 LOCKED"
            date="Q4 2025"
            theme="Cinema. Cult classics. Every scene a still worth keeping."
            extra="[???]"
          />

          {/* DROP 004 */}
          <DropCard 
            number="004"
            title="PACE"
            status="🔒 CLASSIFIED"
            theme="[Redacted]"
            extra="[???]"
          />

          {/* DROP 005 */}
          <DropCard 
            number="005"
            title="NOISE"
            status="🔒 CLASSIFIED"
            theme="[Redacted]"
            extra="[???]"
          />
        </div>

        {/* How Drops Work */}
        <section className="mt-32 pt-16 border-t border-white/20">
          <h2 className="font-display font-bold text-3xl tracking-widest mb-12 uppercase">How Drops Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="font-mono text-xl text-white/50 border-b border-white/10 pb-2">01</div>
              <p className="text-sm tracking-wide leading-relaxed text-white/80">
                We announce a drop with a countdown. No exact date until 48 hours before. MARK tier members get 48hr early access.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="font-mono text-xl text-white/50 border-b border-white/10 pb-2">02</div>
              <p className="text-sm tracking-wide leading-relaxed text-white/80">
                The drop goes live at a specific time. First come, first served. Some stickers are genuinely limited.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="font-mono text-xl text-white/50 border-b border-white/10 pb-2">03</div>
              <p className="text-sm tracking-wide leading-relaxed text-white/80">
                When they're gone, they're gone. We don't restock drops. This is intentional.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="font-mono text-xl text-white/50 border-b border-white/10 pb-2">04</div>
              <p className="text-sm tracking-wide leading-relaxed text-white/80">
                Every drop has a story. A theme. A community. You don't just buy stickers. You buy into a universe.
              </p>
            </div>
          </div>
        </section>

        {/* Subscribe Section */}
        <section id="subscribe" className="mt-32 bg-[#0A0A0A] border border-white/20 p-8 md:p-16 text-center">
          <h2 className="font-display font-bold text-2xl tracking-widest mb-4">WANT EARLY ACCESS?</h2>
          <p className="text-sm text-white/60 mb-8 max-w-lg mx-auto leading-relaxed">
            Reach MARK tier (10+ orders) for 48hr head start on every drop. Or watch @dott.drop — we drop hints.
          </p>
          
          {!subscribed ? (
            <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ENTER EMAIL SIGNAL"
                required
                className="flex-1 bg-black border border-white/30 px-4 py-3 text-sm tracking-widest text-white outline-none focus:border-white transition-colors uppercase placeholder:text-white/20 text-center md:text-left"
              />
              <button 
                type="submit" 
                className="border border-white bg-white text-black px-6 py-3 text-xs tracking-widest font-bold hover:bg-transparent hover:text-white transition-colors uppercase whitespace-nowrap"
              >
                Subscribe →
              </button>
            </form>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-[#b4ff39] bg-[#b4ff39]/10 text-[#b4ff39] px-6 py-4 inline-block font-mono text-sm tracking-widest"
            >
              SIGNAL RECEIVED. YOU'RE ON THE LIST.
            </motion.div>
          )}
        </section>

      </div>
    </div>
  );
}

function DropCard({ 
  number, title, status, statusColor = "text-white", 
  date, theme, price, availability, 
  actionText, actionLink, extra, active = false
}: any) {
  return (
    <div className={`border ${active ? 'border-white bg-[#0A0A0A] shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'border-white/10 bg-black'} p-6 md:p-10 transition-colors relative overflow-hidden group`}>
      {/* Background glow for active */}
      {active && <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />}

      <div className="flex flex-col md:flex-row gap-8 relative z-10">
        
        {/* Left Column - Meta */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
          <div className="text-[10px] text-white/50 tracking-[0.3em] font-mono mb-2">DROP {number}</div>
          <h2 className={`font-display font-black text-4xl uppercase tracking-tighter mb-4 ${active ? 'text-white' : 'text-white/80'}`}>{title}</h2>
          
          <div className="space-y-1 font-mono text-xs uppercase tracking-widest">
            <div className="flex gap-2">
              <span className="text-white/40">STATUS:</span>
              <span className={`${statusColor} font-bold flex items-center gap-2`}>
                {status === "LIVE" && <span className="animate-pulse">●</span>}
                {status}
              </span>
            </div>
            {date && (
              <div className="flex gap-2">
                <span className="text-white/40">DATE:</span>
                <span className="text-white">{date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <div className="space-y-4 mb-6 text-sm">
            <div className="flex flex-col md:flex-row gap-1 md:gap-4">
              <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest w-16 flex-shrink-0 mt-1">THEME</span>
              <span className="text-white/80 leading-relaxed">{theme}</span>
            </div>
            
            {price && (
              <div className="flex flex-col md:flex-row gap-1 md:gap-4">
                <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest w-16 flex-shrink-0 mt-1">PRICE</span>
                <span className="text-white/80 leading-relaxed">{price}</span>
              </div>
            )}

            {availability && (
              <div className="flex flex-col md:flex-row gap-1 md:gap-4">
                <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest w-16 flex-shrink-0 mt-1">STOCK</span>
                <span className="text-white/80 leading-relaxed">{availability}</span>
              </div>
            )}
          </div>

          {extra && (
            <div className="font-mono text-sm tracking-widest text-white/30">{extra}</div>
          )}

          {actionText && actionLink && (
            <div className="mt-4">
              <Link 
                href={actionLink} 
                className={`inline-block font-mono text-xs tracking-widest uppercase transition-colors py-2 px-4 border ${active ? 'border-white hover:bg-white hover:text-black bg-white/5' : 'border-white/30 hover:border-white text-white/70 hover:text-white'}`}
              >
                {actionText}
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

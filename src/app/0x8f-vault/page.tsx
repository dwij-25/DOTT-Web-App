"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { Sticker } from "@prisma/client";

// MOCK DATA for Shadow Vault
function createMockSticker(id: string, name: string, price: number, image_url: string, collection: string, tags: string[]): Sticker {
  return {
    id,
    name,
    slug: id,
    description: "Shadow drop exclusive.",
    price,
    image_url,
    collection: collection as any,
    drop_number: 1,
    stock: 50,
    sold: 0,
    is_active: true,
    is_locked: false,
    tags,
    size: null,
    finish: "MATTE" as any,
    slot_number: null
  };
}

const shadowOrigin = [
  createMockSticker("sv-void", "Void", 2500, "/stickers/void.png", "SHADOW", ["RAW", "MINIMAL", "NEVER RESTOCKED"]),
  createMockSticker("sv-null", "Null", 2500, "/stickers/null.png", "SHADOW", ["RAW", "MINIMAL", "NEVER RESTOCKED"]),
  createMockSticker("sv-origin", "Origin", 2500, "/stickers/origin.png", "SHADOW", ["RAW", "MINIMAL", "NEVER RESTOCKED"]),
];

const prototypes = Array.from({length: 5}).map((_, i) => 
  createMockSticker(`sv-proto-${i}`, `Prototype 0${i+1}`, 3000, `/stickers/proto-${i+1}.png`, "PROTOTYPE", ["PROTOTYPE", "ONE OF FIFTY"])
);

const foundersMark = createMockSticker("sv-founder", "Founder's Mark", 2500, "/dott-logo.png", "SHADOW", ["ORIGINAL", "LOGO"]);

const genesisPack = [
  createMockSticker("gen-1", "Genesis Alpha", 5000, "/stickers/gen-1.png", "GENESIS", ["ULTRA RARE", "GENESIS PACK"]),
  createMockSticker("gen-2", "Genesis Beta", 5000, "/stickers/gen-2.png", "GENESIS", ["ULTRA RARE", "GENESIS PACK"]),
  createMockSticker("gen-3", "Genesis Omega", 5000, "/stickers/gen-3.png", "GENESIS", ["ULTRA RARE", "GENESIS PACK"]),
];

const VALID_CODES = ["A7X9-OMEGA", "VOID-8821", "ECHO-0X19", "NULL-77A", "SHDW-9B3"];
const GENESIS_CODE = "BOOT001";

export default function ShadowVault() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [genesisUnlocked, setGenesisUnlocked] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const upperCode = code.toUpperCase();
    if (VALID_CODES.includes(upperCode)) {
      setDissolving(true);
      setTimeout(() => {
        setUnlocked(true);
        setDissolving(false);
        setCode("");
      }, 1500);
    } else {
      setCode(""); // Incorrect code, just clear
    }
  };

  const handleGenesisUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.toUpperCase() === GENESIS_CODE) {
      setGenesisUnlocked(true);
      setCode("");
    } else {
      setCode("");
    }
  };

  if (unlocked) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-24 px-6 font-body selection:bg-white selection:text-black">
        <div className="max-w-5xl mx-auto space-y-24">
          
          {/* Header */}
          <div className="text-center border-b border-white/20 pb-12">
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tighter mb-4 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">SHADOW VAULT — UNLOCKED</h1>
            <p className="text-white/50 tracking-widest text-sm">✦ ACCESS GRANTED</p>
          </div>

          {/* Easter Egg Note */}
          <div className="bg-[#050505] border border-white/10 p-8 max-w-2xl mx-auto font-mono text-sm leading-relaxed text-white/70 shadow-[inset_0_0_20px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[radial-gradient(circle,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
            <p>You found it.</p>
            <p>Not everyone does.</p>
            <p>Welcome to the shadow.</p>
            <p className="mt-8 text-[#b4ff39] font-bold">Your DOTT ID now shows: ◈ SHADOW FOUND</p>
          </div>

          {/* Shadow Drop - Origin */}
          <section>
            <div className="mb-8 border-l-2 border-white pl-4">
              <h2 className="text-2xl font-bold tracking-widest mb-2">1. SHADOW DROP — ORIGIN</h2>
              <p className="text-white/50 text-xs tracking-wide leading-relaxed max-w-lg">These are raw, minimal, pixel-perfect. No color. Just black, white, and signal.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {shadowOrigin.map(sticker => (
                <VaultCard key={sticker.id} sticker={sticker} onAdd={() => addItem(sticker)} />
              ))}
            </div>
          </section>

          {/* Prototype Series */}
          <section>
            <div className="mb-8 border-l-2 border-white pl-4">
              <h2 className="text-2xl font-bold tracking-widest mb-2">2. PROTOTYPE SERIES</h2>
              <p className="text-white/50 text-xs tracking-wide leading-relaxed max-w-lg">Early design prototypes that never made it to main drops.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {prototypes.map(sticker => (
                <VaultCard key={sticker.id} sticker={sticker} onAdd={() => addItem(sticker)} small />
              ))}
            </div>
          </section>

          {/* Founder's Mark */}
          <section>
            <div className="mb-8 border-l-2 border-white pl-4">
              <h2 className="text-2xl font-bold tracking-widest mb-2">3. FOUNDER'S MARK</h2>
              <p className="text-white/50 text-xs tracking-wide leading-relaxed max-w-lg">The one that started it all.</p>
            </div>
            <div className="max-w-sm">
              <VaultCard sticker={foundersMark} onAdd={() => addItem(foundersMark)} />
            </div>
          </section>

          {/* Genesis Pack Hidden Input */}
          {!genesisUnlocked ? (
            <div className="mt-32 pt-12 border-t border-white/10 flex flex-col items-center">
              <p className="text-[10px] text-white/30 tracking-widest mb-4">SECONDARY SIGNAL DETECTED</p>
              <form onSubmit={handleGenesisUnlock} className="flex gap-2">
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => setCode(e.target.value)} 
                  placeholder="DECRYPT"
                  className="bg-black border border-white/20 px-4 py-2 text-center tracking-widest text-white text-xs outline-none focus:border-white transition-colors"
                />
              </form>
            </div>
          ) : (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-32 pt-12 border-t border-[#b4ff39]/30"
            >
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-display font-extrabold tracking-widest mb-2 text-[#b4ff39]">GENESIS PACK UNLOCKED</h2>
                <p className="text-white/70 text-xs tracking-widest">GENESIS FOUND · [87] of 100 claimed</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {genesisPack.map(sticker => (
                  <VaultCard key={sticker.id} sticker={sticker} onAdd={() => addItem(sticker)} highlight />
                ))}
              </div>
            </motion.section>
          )}

        </div>
      </div>
    );
  }

  // LOCKED STATE
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-body selection:bg-white selection:text-black">
      {/* Dissolve overlay animation */}
      <AnimatePresence>
        {dissolving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 pointer-events-none flex flex-wrap"
          >
            {/* Generate a pixel grid dissolve effect */}
            {Array.from({length: 100}).map((_, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: Math.random() * 1.5, ease: "circIn" }}
                className="w-[10vw] h-[10vh] bg-black"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6">
        
        {/* CSS Pixel Art Lock */}
        <div className="mb-12 relative w-16 h-20 group mx-auto">
          {/* Shackle */}
          <div className="absolute top-0 left-2 w-12 h-10 border-4 border-white/50 rounded-t-xl border-b-0 transition-transform duration-500 group-hover:-translate-y-1" />
          {/* Body */}
          <div className="absolute bottom-0 left-0 w-16 h-12 bg-[#111] border-2 border-white/50 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <div className="w-3 h-4 border-2 border-white/30 rounded-full" />
            <div className="absolute top-1/2 w-1 h-3 bg-white/30 mt-1" />
          </div>
        </div>

        <div className="space-y-2 mb-12 text-white/70 tracking-widest text-sm uppercase font-mono">
          <p>Some drops aren't announced.</p>
          <p>They're discovered.</p>
          <p className="text-white mt-4 font-bold">Enter the access code.</p>
        </div>

        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div className="flex flex-col md:flex-row w-full gap-6 items-center">
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="CODE INPUT"
              className="w-full md:flex-1 bg-transparent border-b-2 border-white/30 px-2 md:px-4 py-3 text-center tracking-normal md:tracking-[0.3em] text-white outline-none focus:border-white transition-colors uppercase text-xs md:text-xl placeholder:text-white/20 font-mono md:font-display"
              disabled={dissolving}
            />
            <button 
              type="submit" 
              disabled={!code || dissolving}
              className="w-full md:w-auto border border-white/30 px-8 py-4 text-xs tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white"
            >
              UNLOCK →
            </button>
          </div>
          <p className="text-[10px] md:text-xs text-white/30 tracking-[0.5em] mt-4 select-none">HINT: INCLUDED IN DROP</p>
        </form>

        <div className="mt-12 p-6 border border-white/10 bg-white/5 w-full mx-auto text-center">
          <p className="text-white/60 text-xs md:text-sm font-body tracking-wider leading-relaxed">
            Order drops to get access codes to the secret vault.<br/><br/>
            <span className="text-white/90 font-bold">They will be delivered inside your drop package.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function VaultCard({ sticker, onAdd, small = false, highlight = false }: { sticker: Sticker, onAdd: () => void, small?: boolean, highlight?: boolean }) {
  const isOutOfStock = sticker.stock === 0;
  const [notifyMode, setNotifyMode] = useState(false);
  const [email, setEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setNotifyStatus("loading");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sticker_id: sticker.id })
      });
      const data = await res.json();
      
      if (res.ok) {
        setNotifyStatus("success");
      } else {
        setNotifyStatus("error");
        setErrorMessage(data.error || "Failed to subscribe.");
      }
    } catch (err) {
      setNotifyStatus("error");
      setErrorMessage("Network error.");
    }
  };

  return (
    <motion.div 
      className={`group relative ${small ? 'aspect-square' : 'aspect-[4/5]'} border ${highlight ? 'border-[#b4ff39]/50 shadow-[0_0_15px_rgba(180,255,57,0.1)]' : 'border-white/15'} bg-[#0D0D0D] overflow-hidden`}
      whileHover={{ scale: 1.03 }}
    >
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-black">
        {/* Abstract pattern placeholder */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        {/* Fallback geometric shape if image fails */}
        <div className="w-16 h-16 border border-white/10 rotate-45 group-hover:rotate-90 transition-all duration-700 absolute opacity-20" />
        
        {/* Using standard img tag with error handler to hide broken links */}
        <img 
          src={sticker.image_url} 
          alt={sticker.name} 
          className={`relative z-10 w-full h-full p-4 object-contain drop-shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-500 ${isOutOfStock ? 'opacity-50' : ''}`} 
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Glow */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
        
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-black/80 backdrop-blur border border-white/20 px-4 py-2 font-display font-bold tracking-widest text-white/50 -rotate-12">
              SOLD OUT
            </div>
          </div>
        )}
      </div>

      <div className={`absolute top-2 left-2 text-[10px] ${highlight ? 'text-[#b4ff39]' : 'text-white/30'} tracking-widest z-20`}>
        {sticker.collection}
      </div>

      {/* Slide-up panel */}
      <div className={`absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t ${highlight ? 'border-[#b4ff39]/30' : 'border-[#1A1A1A]'} p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-30`}>
        <div className={`font-display font-bold text-sm truncate mb-1 ${highlight ? 'text-[#b4ff39]' : 'text-white'}`}>{sticker.name}</div>
        <div className="flex justify-between items-center mb-2">
          <div className="font-body text-xs text-white/70">₹{sticker.price / 100}</div>
          <div className="flex gap-1 flex-wrap">
            {sticker.tags.slice(0, 2).map((t: string) => (
              <span key={t} className="text-[8px] border border-white/20 px-1 py-0.5 text-white/50 uppercase">{t}</span>
            ))}
          </div>
        </div>
        
        <div className="w-full bg-[#1A1A1A] h-1 mb-3">
          <div className={`h-full ${highlight ? 'bg-[#b4ff39]' : 'bg-white'}`} style={{ width: isOutOfStock ? '100%' : '100%' }} />
        </div>

        <div className="flex gap-2">
          {!isOutOfStock ? (
            <button 
              onClick={onAdd}
              className="w-full bg-white text-black text-[10px] font-bold py-2 tracking-widest hover:bg-gray-200 transition-colors"
            >
              ADD TO PACK +
            </button>
          ) : !notifyMode ? (
            <button 
              onClick={() => setNotifyMode(true)}
              className="w-full bg-transparent border border-white/50 text-white text-[10px] font-bold py-2 tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              NOTIFY ME
            </button>
          ) : notifyStatus === "success" ? (
            <div className="w-full text-center text-[#b4ff39] text-[10px] font-bold py-2 tracking-widest border border-[#b4ff39]/50 bg-[#b4ff39]/10">
              SIGNAL RECEIVED
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="w-full flex flex-col gap-1">
              <div className="flex w-full">
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="EMAIL..."
                  required
                  className="flex-1 bg-transparent border-b border-white/30 px-2 py-1 text-[10px] text-white outline-none focus:border-white transition-colors uppercase placeholder:text-white/30 min-w-0"
                />
                <button 
                  type="submit"
                  disabled={notifyStatus === "loading"}
                  className="ml-2 bg-white text-black px-2 text-[10px] font-bold tracking-widest hover:bg-gray-200 disabled:opacity-50"
                >
                  {notifyStatus === "loading" ? "..." : "→"}
                </button>
              </div>
              {notifyStatus === "error" && <span className="text-[8px] text-red-400 mt-1">{errorMessage}</span>}
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

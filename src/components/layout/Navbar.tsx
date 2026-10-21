"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSound } from "@/hooks/useSound";
import { useState } from "react";

export default function Navbar() {
  const { items, openDrawer } = useCartStore();
  const { playClick } = useSound();
  const { data: session } = useSession();
  const { scrollY } = useScroll();
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);
  const borderColor = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.1)"]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleNavClick = () => {
    playClick();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.header 
        className="fixed top-0 w-full z-[90] font-body transition-all duration-300 backdrop-blur-md"
        style={{
          backgroundColor: useTransform(bgOpacity, v => `rgba(10, 10, 10, ${v})`),
          borderBottom: useTransform(borderColor, v => `1px solid ${v}`)
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
            <Link href="/" className="flex items-center" onClick={handleNavClick}>
              <img src="/dott-logo.png" alt="DOTT." className="h-5 md:h-8 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-3">
              {pathname === '/dottxkickoff' ? (
                <Link href="/" className="uiverse-btn mr-2">
                  <span>HOME</span>
                </Link>
              ) : (
                <Link href="/dottxkickoff" className="uiverse-btn mr-2 group">
                  <span className="!text-[#E83C3C] tracking-tight text-[8px] md:text-[10px]" style={{ fontFamily: "var(--font-start2p), monospace", textShadow: "1px 1px 0 #000" }}>
                    DOTT X KICKOFF
                  </span>
                </Link>
              )}
              {pathname === '/vault' ? (
                <Link href="/" className="uiverse-btn mr-2">
                  <span>HOME</span>
                </Link>
              ) : (
                <Link href="/vault" className="uiverse-btn mr-2">
                  <span>STICKERS</span>
                </Link>
              )}
              {session ? (
                <>
                  {pathname === '/profile' ? (
                    <Link href="/" className="uiverse-btn">
                      <span>HOME</span>
                    </Link>
                  ) : (
                    <Link href="/profile" className="uiverse-btn">
                      <span>{session.user.dott_handle ? `@${session.user.dott_handle}` : "PROFILE"}</span>
                    </Link>
                  )}
                  <button onClick={() => signOut()} className="uiverse-btn">
                    <span>LOGOUT</span>
                  </button>
                </>
              ) : (
                pathname === '/login' ? (
                  <Link href="/" className="uiverse-btn">
                    <span>HOME</span>
                  </Link>
                ) : (
                  <Link href="/login" className="uiverse-btn">
                    <span>LOGIN</span>
                  </Link>
                )
              )}
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
            </div>

            <button 
              onClick={() => {
                handleNavClick();
                openDrawer();
              }}
              className="uiverse-btn"
            >
              <span>PACK ({totalItems})</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] bg-[#0A0A0A]/95 backdrop-blur-xl z-[80] md:hidden flex flex-col p-6 font-body border-t border-white/10">
          <div className="flex flex-col gap-4">
            {pathname !== '/' && (
              <Link href="/" onClick={handleNavClick} className="uiverse-btn w-full justify-center">
                <span>HOME</span>
              </Link>
            )}
            {pathname !== '/dottxkickoff' && (
              <Link href="/dottxkickoff" onClick={handleNavClick} className="uiverse-btn w-full justify-center group">
                  <span className="!text-[#E83C3C] tracking-tight text-[10px]" style={{ fontFamily: "var(--font-start2p), monospace", textShadow: "1px 1px 0 #000" }}>
                    DOTT X KICKOFF
                  </span>
              </Link>
            )}
            {pathname !== '/vault' && (
              <Link href="/vault" onClick={handleNavClick} className="uiverse-btn w-full justify-center">
                <span>STICKERS</span>
              </Link>
            )}
            {session ? (
              <>
                {pathname !== '/profile' && (
                  <Link href="/profile" onClick={handleNavClick} className="uiverse-btn w-full justify-center">
                    <span>{session.user.dott_handle ? `@${session.user.dott_handle}` : "PROFILE"}</span>
                  </Link>
                )}
                <button onClick={() => { signOut(); handleNavClick(); }} className="uiverse-btn w-full justify-center text-red-400">
                  <span>LOGOUT</span>
                </button>
              </>
            ) : (
              pathname !== '/login' && (
                <Link href="/login" onClick={handleNavClick} className="uiverse-btn w-full justify-center">
                  <span>LOGIN</span>
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

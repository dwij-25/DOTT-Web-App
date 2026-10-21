import Link from "next/link";
import FeedbackForm from "./FeedbackForm";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/20 bg-black text-white py-8 md:py-16 px-6 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 mb-12 md:mb-16">
          {/* Column 1 */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-start relative group">
            <img src="/dott-logo.png" alt="DOTT." className="h-10 w-auto object-contain mb-4" />
            <p className="font-bold tracking-widest text-sm mb-2">Make Your Mark.</p>
            <p className="text-white/50 text-xs tracking-widest">Every surface is a canvas.</p>
            
            {/* Easter Egg */}
            <div className="mt-8 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <pre className="text-[8px] leading-tight text-white/30 font-body">
{`
  ██  ██  
          
██      ██
  ██████  
`}
              </pre>
            </div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-start gap-3">
            <h3 className="font-bold tracking-widest text-[10px] md:text-xs text-white/50 mb-1">NAVIGATE</h3>
            <Link href="/" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">DROPS</Link>
            <Link href="/#boot-section" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">BOOT</Link>
            <Link href="/#vault" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">STICKERS</Link>
            <Link href="/custom" className="w-fit text-xs md:text-sm tracking-widest hover:text-[#b4ff39] transition-colors">CUSTOM</Link>
            <Link href="/0x8f-vault" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">SECRET</Link>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-end md:items-start text-right md:text-left gap-3">
            <h3 className="font-bold tracking-widest text-[10px] md:text-xs text-white/50 mb-1">INFO</h3>
            <Link href="/shipping" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">SHIPPING</Link>
            <Link href="/returns" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">RETURNS</Link>
            <Link href="/contact" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">CONTACT</Link>
            <Link href="/calendar" className="w-fit text-xs md:text-sm tracking-widest hover:text-white/70 transition-colors">CALENDAR</Link>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="flex justify-center md:justify-end mb-8 border-t border-white/10 pt-8">
          <FeedbackForm />
        </div>

        {/* Base */}
        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/50 tracking-widest">
          <div>© 2026 DOTT. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link>
          </div>
          <div>Made with <span className="text-white animate-pulse">●</span> in India</div>
        </div>
      </div>
    </footer>
  );
}

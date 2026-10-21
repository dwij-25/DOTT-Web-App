"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function KickoffButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[120px] md:h-[180px] w-full max-w-7xl mx-auto my-8 bg-[#050505]" />; 

  return (
    <Link href="/dottxkickoff" className="block w-full my-8 cursor-pointer group px-4 md:px-0">
      <style dangerouslySetInnerHTML={{__html: `
        .pixel-text-shadow {
          text-shadow: 
            2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000,
            0px 2px 0 #000, 2px 0px 0 #000, 0px -2px 0 #000, -2px 0px 0 #000,
            4px 4px 0 #000, 3px 3px 0 #000;
        }

        /* Mobile: always animate */
        @media (max-width: 767px) {
          .retro-bounce {
            animation: retro-bounce 0.4s steps(2) infinite alternate;
          }
          .retro-bounce-delay {
            animation: retro-bounce 0.4s steps(2) infinite alternate;
            animation-delay: 0.2s;
          }
        }
        
        /* Desktop: animate on hover */
        @media (min-width: 768px) {
          .group:hover .retro-bounce {
            animation: retro-bounce 0.4s steps(2) infinite alternate;
          }
          .group:hover .retro-bounce-delay {
            animation: retro-bounce 0.4s steps(2) infinite alternate;
            animation-delay: 0.2s;
          }
        }

        @keyframes retro-bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }
      `}} />
      
      <div className="relative w-full h-[120px] md:h-[180px] border-y-[4px] border-x-[4px] md:border-x-0 border-[#6A0A09] rounded-xl md:rounded-none overflow-hidden shadow-[0_6px_0_#6A0A09] md:shadow-[0_8px_0_#6A0A09] active:translate-y-[6px] active:shadow-none transition-all duration-75 ease-in-out">
        
        {/* The Pitch Background */}
        <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
           <Image 
             src="/images/kickoff-pitch-dark.png" 
             alt="Pitch" 
             fill
             className="object-cover object-center opacity-90" 
           />
        </div>
        
        {/* Players - Left Team (Blue/Argentina) */}
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce" style={{ top: '50%', left: '45%' }}>
          <Image src="/images/player-blue.png" alt="Player" fill className="object-contain pixel-rendering" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce-delay" style={{ top: '30%', left: '35%' }}>
          <Image src="/images/player-blue.png" alt="Player" fill className="object-contain pixel-rendering" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce" style={{ top: '70%', left: '35%' }}>
          <Image src="/images/player-blue.png" alt="Player" fill className="object-contain pixel-rendering" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce-delay" style={{ top: '40%', left: '25%' }}>
          <Image src="/images/player-blue.png" alt="Player" fill className="object-contain pixel-rendering" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce" style={{ top: '60%', left: '25%' }}>
          <Image src="/images/player-blue.png" alt="Player" fill className="object-contain pixel-rendering" />
        </div>
        
        {/* Players - Right Team (Red) */}
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce" style={{ top: '50%', right: '45%' }}>
          <Image src="/images/player-red.png" alt="Player" fill className="object-contain pixel-rendering scale-x-[-1]" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce-delay" style={{ top: '30%', right: '35%' }}>
          <Image src="/images/player-red.png" alt="Player" fill className="object-contain pixel-rendering scale-x-[-1]" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce" style={{ top: '70%', right: '35%' }}>
          <Image src="/images/player-red.png" alt="Player" fill className="object-contain pixel-rendering scale-x-[-1]" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce-delay" style={{ top: '40%', right: '25%' }}>
          <Image src="/images/player-red.png" alt="Player" fill className="object-contain pixel-rendering scale-x-[-1]" />
        </div>
        <div className="absolute z-10 w-[12px] h-[18px] md:w-[24px] md:h-[36px] retro-bounce" style={{ top: '60%', right: '25%' }}>
          <Image src="/images/player-red.png" alt="Player" fill className="object-contain pixel-rendering scale-x-[-1]" />
        </div>
        
        {/* The Football */}
        <div className="absolute z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative w-[6px] h-[6px] md:w-[12px] md:h-[12px] retro-bounce">
            <Image src="/images/kickoff-ball-v2.png" alt="Ball" fill className="object-contain pixel-rendering" />
          </div>
        </div>

        {/* Main Text */}
        <div className="absolute inset-0 flex items-start justify-center pt-2 md:pt-3 z-20 pointer-events-none">
          <span 
            className="retro-bounce text-[18px] sm:text-[28px] md:text-[45px] text-[#E83C3C] pixel-text-shadow uppercase"
            style={{ fontFamily: "var(--font-start2p)" }}
          >
            DOTT X KICKOFF
          </span>
        </div>

        {/* Enter Collection Graphic */}
        <div className="absolute inset-x-0 bottom-4 md:bottom-3 flex justify-center z-20 pointer-events-none">
          <div className="relative w-[80px] h-[20px] md:w-[140px] md:h-[35px] transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
            <Image src="/images/kickoff-enter.png" alt="Enter" fill className="object-contain pixel-rendering" />
          </div>
        </div>
      </div>
    </Link>
  )
}

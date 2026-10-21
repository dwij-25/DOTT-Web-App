"use client";

import { useEffect, useState } from "react";
import { Sticker } from "@prisma/client";

export default function StoryTunnel({ stickers }: { stickers: Sticker[] }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // We want to loop the stickers to fill a massive grid
  const hugeStickers = Array.from({ length: 800 }, (_, i) => stickers[i % stickers.length]);

  const handleExport = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
      });
      
      // Hide UI buttons before capturing
      const uiElements = document.querySelectorAll('.hide-on-export') as NodeListOf<HTMLElement>;
      uiElements.forEach(el => el.style.opacity = '0');

      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();
      
      video.onplaying = () => {
        setTimeout(() => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `dott-story-${Date.now()}.png`;
            a.click();
          }
          
          // Show UI again
          uiElements.forEach(el => el.style.opacity = '1');
          stream.getTracks().forEach(track => track.stop());
        }, 1000); // Wait 1 sec to ensure frame is loaded and UI is hidden
      };
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export cancelled or failed. Did you grant permission?");
    }
  };

  return (
    <div className="relative w-[360px] h-[640px] bg-black overflow-hidden font-display flex items-center justify-center">
      
      {/* CSS Styles for the 3D Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        .story-scene {
          perspective: 600px;
          perspective-origin: 50% 50%;
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .story-tunnel {
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          transform: translateZ(0px); /* STATIC */
        }
        @keyframes flyThrough {
          0% { transform: translateZ(-1000px); }
          100% { transform: translateZ(1000px); }
        }
        .story-wall {
          position: absolute;
          transform-style: preserve-3d;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          grid-template-rows: repeat(24, 1fr);
          gap: 10px;
          padding: 10px;
          background: rgba(0,0,0,0.8);
          border: 1px solid rgba(255,255,255,0.1);
        }
        /* Top Wall */
        .wall-top {
          width: 800px;
          height: 3000px;
          top: -1500px;
          left: 50%;
          margin-left: -400px;
          transform: rotateX(90deg) translateZ(400px);
        }
        /* Bottom Wall */
        .wall-bottom {
          width: 800px;
          height: 3000px;
          top: -1500px;
          left: 50%;
          margin-left: -400px;
          transform: rotateX(-90deg) translateZ(400px);
        }
        /* Left Wall */
        .wall-left {
          width: 3000px;
          height: 800px;
          top: 50%;
          margin-top: -400px;
          left: -1500px;
          transform: rotateY(90deg) translateZ(400px);
          grid-template-columns: repeat(24, 1fr);
          grid-template-rows: repeat(8, 1fr);
        }
        /* Right Wall */
        .wall-right {
          width: 3000px;
          height: 800px;
          top: 50%;
          margin-top: -400px;
          right: -1500px;
          transform: rotateY(-90deg) translateZ(400px);
          grid-template-columns: repeat(24, 1fr);
          grid-template-rows: repeat(8, 1fr);
        }
        /* Back Wall */
        .wall-back {
          width: 800px;
          height: 800px;
          top: 50%;
          left: 50%;
          margin-top: -400px;
          margin-left: -400px;
          transform: translateZ(-800px); /* Pushed back so it naturally fits in the center hole */
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
        }

        .sticker-cell {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transform-style: preserve-3d;
        }
        .sticker-cell img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
          filter: drop-shadow(0 0 10px rgba(255,255,255,0.2));
        }
        
        /* Angle entire cells moderately towards the camera to make them extremely visible in true 3D without breaking perspective */
        .wall-left .sticker-cell { transform: rotateY(-45deg); }
        .wall-right .sticker-cell { transform: rotateY(45deg); }
        .wall-top .sticker-cell { transform: rotateX(45deg); }
        .wall-bottom .sticker-cell { transform: rotateX(-45deg); }
        
        .dott-logo-back {
          font-size: 40px; /* Reduced to fit in the center void */
          font-weight: 900;
          color: white;
          letter-spacing: 0.2em;
          text-shadow: 0 0 20px rgba(255,255,255,0.8);
        }
      `}} />

      {/* OVERLAYS */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-center py-4 bg-gradient-to-b from-black to-transparent">
        <p className="text-white tracking-[0.3em] text-[10px] opacity-70">STITCHERS · DOTT · DROP</p>
      </div>

      <div className="story-scene">
        <div className="story-tunnel">
          
          {/* LEFT WALL */}
          <div className="story-wall wall-left">
            {hugeStickers.slice(0, 192).map((s, i) => (
              <div key={'l'+i} className="sticker-cell">
                <img src={s.image_url} alt={s.name} />
              </div>
            ))}
          </div>

          {/* RIGHT WALL */}
          <div className="story-wall wall-right">
            {hugeStickers.slice(192, 384).map((s, i) => (
              <div key={'r'+i} className="sticker-cell">
                <img src={s.image_url} alt={s.name} />
              </div>
            ))}
          </div>

          {/* TOP WALL */}
          <div className="story-wall wall-top">
            {hugeStickers.slice(384, 576).map((s, i) => (
              <div key={'t'+i} className="sticker-cell">
                <img src={s.image_url} alt={s.name} />
              </div>
            ))}
          </div>

          {/* BOTTOM WALL */}
          <div className="story-wall wall-bottom">
            {hugeStickers.slice(576, 768).map((s, i) => (
              <div key={'b'+i} className="sticker-cell">
                <img src={s.image_url} alt={s.name} />
              </div>
            ))}
          </div>

          {/* BACK WALL */}
          <div className="story-wall wall-back">
            <h1 className="dott-logo-back">::DOTT</h1>
          </div>
          
        </div>
      </div>

      {/* OVERLAY VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none z-20" style={{
        boxShadow: "inset 0 0 100px rgba(0,0,0,1), inset 0 0 40px rgba(0,0,0,0.8)"
      }} />

      {/* BACK BUTTON */}
      <div className="absolute top-8 left-8 z-50 hide-on-export transition-opacity duration-300">
        <a href="/admin" className="text-white hover:text-gray-300 font-bold uppercase tracking-wider flex items-center gap-2">
          <span>&larr;</span> Back to Admin
        </a>
      </div>

      {/* EXPORT BUTTON */}
      <div className="absolute bottom-8 z-50 hide-on-export transition-opacity duration-300 flex flex-col items-center gap-2">
        <p className="text-white/70 text-xs tracking-widest uppercase">Make sure to select "This Tab" when exporting!</p>
        <button 
          onClick={handleExport}
          className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
        >
          Export Image
        </button>
      </div>

    </div>
  );
}

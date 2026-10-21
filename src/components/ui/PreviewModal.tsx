"use client";

import { useState, useEffect } from "react";
import { Sticker } from "@prisma/client";
import { motion, AnimatePresence } from "framer-motion";
import { Rnd } from "react-rnd";
import { useCartStore } from "@/lib/store";
import { toPng } from "html-to-image";
import { useRef } from "react";

interface PreviewModalProps {
  sticker: Sticker | null;
  onClose: () => void;
}

type PlacedSticker = {
  id: string;
  sticker: Sticker;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function PreviewModal({ sticker, onClose }: PreviewModalProps) {
  const [device, setDevice] = useState<"PHONE" | "LAPTOP">("LAPTOP");
  const [laptopPlacements, setLaptopPlacements] = useState<PlacedSticker[]>([]);
  const [mobilePlacements, setMobilePlacements] = useState<PlacedSticker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        let baseScale = window.innerWidth < 768 ? (device === "PHONE" ? 0.75 : 0.6) : 1;
        
        const requiredHeight = device === "PHONE" ? 400 : 320;
        const requiredWidth = device === "PHONE" ? 200 : 500;
        
        // Add 40px padding buffer so it never touches the exact edges
        const scaleHeight = (height - 40) / requiredHeight;
        const scaleWidth = (width - 40) / requiredWidth;
        
        setScale(Math.min(scaleHeight, scaleWidth, baseScale));
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [device]);

  const placedStickers = device === "LAPTOP" ? laptopPlacements : mobilePlacements;
  const setPlacedStickers = device === "LAPTOP" ? setLaptopPlacements : setMobilePlacements;
  
  const cartItems = useCartStore(state => state.items);

  useEffect(() => {
    if (sticker) {
      const initialId = Math.random().toString(36).substring(7);
      const startX = 50 + (Math.random() * 20 - 10);
      const startY = 50 + (Math.random() * 20 - 10);
      const baseSticker = { sticker, rotation: 0, x: startX, y: startY, width: 120, height: 120 };
      setLaptopPlacements([{ id: initialId + '_laptop', ...baseSticker }]);
      setMobilePlacements([{ id: initialId + '_mobile', ...baseSticker }]);
      setSelectedId(initialId + '_laptop');
    }
  }, [sticker]);

  if (laptopPlacements.length === 0 && mobilePlacements.length === 0 && !sticker) return null;

  const downloadPreview = async () => {
    if (!canvasRef.current) return;
    try {
      setSelectedId(null);
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `dott-preview-${device.toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download preview', err);
    }
  };

  const handleAddSticker = (s: Sticker) => {
    const newId = Math.random().toString(36).substring(7);
    const newX = 50 + (Math.random() * 20 - 10);
    const newY = 50 + (Math.random() * 20 - 10);
    
    const baseSticker = { sticker: s, rotation: 0, x: newX, y: newY, width: 120, height: 120 };
    setLaptopPlacements(prev => [...prev, { id: newId + '_laptop', ...baseSticker }]);
    setMobilePlacements(prev => [...prev, { id: newId + '_mobile', ...baseSticker }]);
    setSelectedId(device === "LAPTOP" ? newId + '_laptop' : newId + '_mobile');
  };

  const handleRemoveSelected = () => {
    if (!selectedId) return;
    const baseId = selectedId.replace('_laptop', '').replace('_mobile', '');
    setLaptopPlacements(prev => prev.filter(ps => !ps.id.startsWith(baseId)));
    setMobilePlacements(prev => prev.filter(ps => !ps.id.startsWith(baseId)));
    setSelectedId(null);
  };

  const selectedSticker = placedStickers.find(ps => ps.id === selectedId);
  const rotation = selectedSticker ? selectedSticker.rotation : 0;

  const handleRotationChange = (val: number) => {
    if (!selectedId) return;
    setPlacedStickers(prev => prev.map(ps => ps.id === selectedId ? { ...ps, rotation: val } : ps));
  };

  const renderStickers = () => placedStickers.map((ps) => {
    const isSelected = selectedId === ps.id;
    
    return (
      <Rnd
        key={ps.id}
        default={{ x: ps.x, y: ps.y, width: ps.width, height: ps.height }}
        bounds=".preview-canvas"
        scale={scale}
        lockAspectRatio={true}
        className={`group pointer-events-auto ${isSelected ? "z-50" : "z-10"}`}
        onDragStart={() => setSelectedId(ps.id)}
        onClick={() => setSelectedId(ps.id)}
        onDragStop={(e, d) => {
          setPlacedStickers(prev => prev.map(p => p.id === ps.id ? { ...p, x: d.x, y: d.y } : p));
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          setPlacedStickers(prev => prev.map(p => p.id === ps.id ? {
            ...p,
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
            ...position
          } : p));
        }}
      >
        <div className="w-full h-full relative cursor-move">
          <div className="w-full h-full transition-transform" style={{ transform: `rotate(${ps.rotation}deg)` }}>
            <img src={ps.sticker.image_url} alt={ps.sticker.name} className="w-full h-full object-contain drop-shadow-xl" draggable={false} />
          </div>
          
          {isSelected && (
            <div className="absolute inset-0 border-2 border-dashed border-[#b4ff39] pointer-events-none" />
          )}
        </div>
      </Rnd>
    );
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex flex-col md:flex-row font-body overflow-hidden"
      >
        <div className="absolute top-4 md:top-8 right-4 md:right-8 z-[1020]">
          <button onClick={onClose} className="text-white hover:text-[#b4ff39] font-bold tracking-widest text-[10px] md:text-sm border border-white/20 px-3 md:px-4 py-2 hover:border-[#b4ff39] transition-colors bg-black/50">
            ← BACK
          </button>
        </div>

        <div className="w-full md:w-64 h-auto md:h-full max-h-[140px] md:max-h-none bg-[#050505] border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col z-[1010] p-4 md:p-6 overflow-x-auto md:overflow-y-auto mt-16 md:mt-0">
          <div className="hidden md:block text-xs font-bold tracking-widest text-[#b4ff39] mb-8">
            YOUR PACK (IN CART) ✓
          </div>
          <div className="hidden md:block text-[10px] text-white/50 mb-4 tracking-widest">
            CLICK TO ADD TO DEVICE:
          </div>
          <div className="flex md:flex-col gap-4 items-center md:items-stretch">
            {cartItems.map(item => (
              <button 
                key={item.sticker.id}
                onClick={() => handleAddSticker(item.sticker)}
                className="w-16 md:w-full flex-shrink-0 aspect-square border border-white/10 hover:border-[#b4ff39] bg-black p-2 md:p-6 transition-all hover:bg-white/5"
                title={`Add ${item.sticker.name}`}
              >
                <img src={item.sticker.image_url} alt="" className="w-full h-full object-contain drop-shadow-xl" />
                <div className="hidden md:block text-[10px] text-white/50 mt-2 truncate tracking-widest">{item.sticker.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="flex gap-4 mb-4 z-[1010]">
            <button 
              onClick={() => { setDevice("PHONE"); setSelectedId(null); }}
              className={`px-6 py-2 tracking-[0.2em] text-xs font-bold border transition-colors ${device === "PHONE" ? "bg-white text-black border-white" : "text-white/50 border-white/20 hover:border-white/50"}`}
            >
              PHONE
            </button>
            <button 
              onClick={() => { setDevice("LAPTOP"); setSelectedId(null); }}
              className={`px-6 py-2 tracking-[0.2em] text-xs font-bold border transition-colors ${device === "LAPTOP" ? "bg-white text-black border-white" : "text-white/50 border-white/20 hover:border-white/50"}`}
            >
              LAPTOP
            </button>
            <button 
              onClick={downloadPreview}
              className="px-6 py-2 tracking-[0.2em] text-xs font-bold border border-[#b4ff39] text-[#b4ff39] hover:bg-[#b4ff39] hover:text-black transition-colors ml-4"
            >
              DOWNLOAD PREVIEW
            </button>
          </div>

          <div className="w-full max-w-4xl flex-1 md:h-[70vh] flex items-center justify-center overflow-hidden border border-white/10 bg-[#050505] relative rounded-xl shadow-[0_0_50px_rgba(255,255,255,0.05)] preview-canvas">
            
            <div ref={canvasRef} className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
              {device === "PHONE" ? (
                <div style={{ transform: `scale(${scale})` }} className="transition-transform duration-300 origin-center">
                  <div className="relative w-[200px] h-[400px] bg-gradient-to-br from-gray-800 to-black rounded-[36px] border-[4px] border-gray-600 shadow-2xl flex items-start justify-center p-4 overflow-hidden isolate transform-gpu">
                    <div className="absolute top-3 left-3 w-10 h-16 bg-black rounded-xl border border-gray-700/50 shadow-inner pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-[32px] pointer-events-none" />
                    <div className="absolute bottom-10 font-black tracking-[0.3em] text-white/5 text-2xl pointer-events-none select-none">
                      DOTT.
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                      {renderStickers()}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ transform: `scale(${scale})` }} className="transition-transform duration-300 origin-center">
                  <div className="relative w-[500px] h-[320px] bg-[#E0E0E0] rounded-t-xl rounded-b-md shadow-2xl flex flex-col items-center justify-end border-b-8 border-[#999] overflow-hidden isolate transform-gpu">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/50 rounded-full blur-[1px] shadow-[inset_0_0_10px_rgba(255,255,255,0.5)] pointer-events-none" />
                    <div className="absolute top-4 left-4 w-3 h-3 bg-black/10 rounded-full pointer-events-none" />
                    <div className="absolute top-4 right-4 w-3 h-3 bg-black/10 rounded-full pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-3 h-3 bg-black/10 rounded-full pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-3 h-3 bg-black/10 rounded-full pointer-events-none" />
                    <div className="absolute bottom-16 font-black tracking-[0.4em] text-black/5 text-5xl pointer-events-none select-none">
                      DOTT.
                    </div>
                    <div className="w-1/2 h-6 bg-black/20 rounded-t-lg mb-0 pointer-events-none" />
                    <div className="absolute inset-0 pointer-events-none">
                      {renderStickers()}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center z-[1010] w-full max-w-md h-[120px] shrink-0">
            {selectedId ? (
              <>
                <div className="flex flex-col items-center gap-2 w-full bg-black/50 border border-white/10 p-4">
                  <div className="flex justify-between w-full text-[10px] text-white/50 tracking-[0.2em] font-mono mb-2">
                    <span>ROTATE SELECTED</span>
                    <span>{rotation}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="-180" 
                    max="180" 
                    value={rotation} 
                    onChange={(e) => handleRotationChange(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#b4ff39] [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                  />
                  <button 
                    onClick={handleRemoveSelected}
                    className="mt-4 text-[10px] text-red-500 hover:text-red-400 tracking-widest border border-red-500/30 hover:border-red-500 px-4 py-2 w-full transition-colors"
                  >
                    REMOVE SELECTED STICKER
                  </button>
                </div>
              </>
            ) : (
              <div className="text-[10px] text-white/30 tracking-[0.2em] font-mono border border-white/10 px-4 py-2 bg-black/50">
                {placedStickers.length > 0 ? "CLICK A STICKER TO ROTATE OR REMOVE IT" : "ADD STICKERS FROM YOUR PACK"}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

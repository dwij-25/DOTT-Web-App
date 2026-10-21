"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sticker } from "@prisma/client";

interface PlacedSticker {
  id: string;
  sticker: Sticker;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function StickerPreview({ stickers }: { stickers: Sticker[] }) {
  const [placed, setPlaced] = useState<PlacedSticker[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragEnd = (event: any, info: any, sticker: Sticker) => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Check if dropped inside canvas
    if (
      event.clientX >= canvasRect.left &&
      event.clientX <= canvasRect.right &&
      event.clientY >= canvasRect.top &&
      event.clientY <= canvasRect.bottom
    ) {
      const x = event.clientX - canvasRect.left - 40; // approx center
      const y = event.clientY - canvasRect.top - 40;
      
      const newId = `${sticker.id}-${Date.now()}`;
      setPlaced([...placed, {
        id: newId,
        sticker,
        x,
        y,
        rotation: (Math.random() - 0.5) * 30, // random slight rotation
        scale: 1,
      }]);
      setActiveId(newId);
    }
  };

  const updateSticker = (id: string, updates: Partial<PlacedSticker>) => {
    setPlaced(placed.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removeSticker = (id: string) => {
    setPlaced(placed.filter(p => p.id !== id));
    if (activeId === id) setActiveId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] text-white font-body">
      
      {/* 60% Canvas Area */}
      <div className="w-full lg:w-[60%] bg-[#111] border-r border-white/20 p-8 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Pixel grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <div className="w-full max-w-2xl aspect-[16/10] relative flex items-center justify-center">
          {/* Laptop Emoji Background */}
          <div className="absolute inset-0 flex items-center justify-center text-[200px] md:text-[300px] lg:text-[400px] opacity-10 pointer-events-none select-none">
            💻
          </div>

          {/* Actual Droppable Canvas */}
          <div 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full border border-white/10 bg-black/20 backdrop-blur-sm"
            onClick={() => setActiveId(null)}
          >
            {placed.map((p) => (
              <motion.div
                key={p.id}
                drag
                dragMomentum={false}
                dragConstraints={canvasRef}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(p.id);
                }}
                onDragStart={() => setActiveId(p.id)}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  rotate: p.rotation,
                  scale: p.scale,
                  zIndex: activeId === p.id ? 50 : 10,
                }}
                className={`cursor-grab active:cursor-grabbing w-20 h-20 group ${activeId === p.id ? 'ring-1 ring-white/50' : ''}`}
              >
                <img src={p.sticker.image_url} alt={p.sticker.name} className="w-full h-full object-contain pointer-events-none drop-shadow-xl" />
                
                {/* Remove button (shows on hover or active) */}
                {(activeId === p.id) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeSticker(p.id); }}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    ✕
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Selected Sticker Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black border border-white/20 p-4 flex gap-6 z-50 transition-opacity duration-300" style={{ opacity: activeId ? 1 : 0, pointerEvents: activeId ? "auto" : "none" }}>
          {activeId && (
            <>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/50 tracking-widest mb-2">SIZE</span>
                <input 
                  type="range" 
                  min="0.5" max="2" step="0.1" 
                  value={placed.find(p => p.id === activeId)?.scale || 1}
                  onChange={(e) => updateSticker(activeId, { scale: parseFloat(e.target.value) })}
                  className="w-24 accent-white"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/50 tracking-widest mb-2">ROTATE</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const curr = placed.find(p => p.id === activeId)?.rotation || 0;
                    updateSticker(activeId, { rotation: curr - 15 });
                  }} className="w-6 h-6 border border-white/30 flex items-center justify-center hover:bg-white/10 text-xs">↺</button>
                  <button onClick={() => {
                    const curr = placed.find(p => p.id === activeId)?.rotation || 0;
                    updateSticker(activeId, { rotation: curr + 15 });
                  }} className="w-6 h-6 border border-white/30 flex items-center justify-center hover:bg-white/10 text-xs">↻</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 40% Shelf Area */}
      <div className="w-full lg:w-[40%] bg-black p-8 flex flex-col h-full overflow-y-auto">
        <div className="flex justify-between items-end mb-8 border-b border-white/20 pb-4">
          <div>
            <h2 className="font-display font-extrabold text-4xl mb-1">Try Before You Stick</h2>
            <p className="text-xs tracking-widest text-white/50">DRAG AND DROP TO PREVIEW</p>
          </div>
          <button onClick={() => setPlaced([])} className="text-xs tracking-widest text-white/50 hover:text-white transition-colors">
            CLEAR ALL ✕
          </button>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-4 flex-1 content-start">
          {stickers.map((sticker) => (
            <motion.div
              key={sticker.id}
              drag
              dragSnapToOrigin
              onDragEnd={(e, info) => handleDragEnd(e, info, sticker)}
              whileHover={{ scale: 1.1 }}
              whileDrag={{ scale: 1.2, zIndex: 100 }}
              className="aspect-square border border-white/10 bg-[#111] p-2 flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-white/40 transition-colors"
            >
              <img src={sticker.image_url} alt={sticker.name} className="w-full h-full object-contain pointer-events-none" />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/20">
          <button className="w-full bg-white text-black font-bold py-4 tracking-widest hover:bg-gray-200 transition-colors">
            SHOP THESE STICKERS →
          </button>
        </div>
      </div>
      
    </div>
  );
}

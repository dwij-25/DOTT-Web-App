"use client";

import { useCartStore } from "@/lib/store";
import { calculateFreeStickersOffer } from "@/lib/offers";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PreviewModal from "@/components/ui/PreviewModal";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer, items, removeItem, updateQuantity } = useCartStore();
  
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const rawSubtotal = items.reduce((acc, item) => acc + (item.sticker.price * item.quantity), 0);
  const totalStickerCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const offerItems = items.map(i => ({
    id: i.sticker.id,
    name: i.sticker.name,
    price: i.sticker.price,
    quantity: i.quantity,
  }));
  const freeOffer = calculateFreeStickersOffer(offerItems);

  const handleCheckoutRedirect = () => {
    closeDrawer();
    if (session) {
      router.push("/checkout");
    } else {
      router.push("/login?callbackUrl=/checkout");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0A0A0A] border-l border-[#1A1A1A] z-[101] flex flex-col font-body"
            >
              {/* Header */}
              <div className="h-16 border-b border-[#1A1A1A] flex items-center justify-between px-6 bg-black shrink-0">
                <div className="text-xs tracking-widest font-bold flex items-center gap-2">
                  <span>YOUR PACK ({totalStickerCount})</span>
                  {freeOffer.freeStickersClaimed > 0 && (
                    <span className="text-[10px] bg-[#b4ff39] text-black font-mono font-bold px-1.5 py-0.5 rounded">
                      {freeOffer.freeStickersClaimed} FREE
                    </span>
                  )}
                </div>
                <button onClick={closeDrawer} className="text-white/50 hover:text-white">✕</button>
              </div>

              {/* Offer Banner: Cart > Rs 250 = Next 5 Free */}
              {items.length > 0 && (
                <div className={`p-4 border-b shrink-0 transition-all ${
                  freeOffer.qualifies 
                    ? "bg-gradient-to-r from-emerald-950/60 via-black to-emerald-950/60 border-emerald-500/40" 
                    : "bg-white/[0.03] border-white/10"
                }`}>
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>{freeOffer.qualifies ? "🎉" : "⚡"}</span>
                      <span className={freeOffer.qualifies ? "text-[#b4ff39]" : "text-white"}>
                        {freeOffer.qualifies ? "5 FREE STICKERS UNLOCKED!" : "SPECIAL OFFER: 5 FREE STICKERS"}
                      </span>
                    </span>
                    {freeOffer.qualifies ? (
                      <span className="text-[10px] bg-[#b4ff39]/20 text-[#b4ff39] border border-[#b4ff39]/40 px-2 py-0.5 rounded font-bold">
                        {freeOffer.freeStickersClaimed}/5 CLAIMED
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/70 font-bold">
                        ₹{rawSubtotal / 100} / ₹250
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF4E50] via-amber-400 to-[#b4ff39] transition-all duration-300 rounded-full"
                      style={{ width: `${freeOffer.progressPercent}%` }}
                    />
                  </div>

                  <p className="text-[10.5px] font-mono leading-relaxed">
                    {freeOffer.qualifies ? (
                      freeOffer.freeStickersRemaining > 0 ? (
                        <span className="text-white/90">
                          Add <strong className="text-[#b4ff39]">{freeOffer.freeStickersRemaining} more sticker{freeOffer.freeStickersRemaining > 1 ? 's' : ''}</strong> to your pack for ₹0!
                        </span>
                      ) : (
                        <span className="text-[#b4ff39]">
                          All 5 free stickers applied! You saved ₹{freeOffer.freeDiscount / 100} in this order.
                        </span>
                      )
                    ) : (
                      <span className="text-white/60">
                        Add <strong className="text-white font-bold">₹{freeOffer.amountNeededToUnlock / 100} more</strong> to unlock the next 5 stickers 100% FREE!
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                    <div className="text-4xl mb-4">○</div>
                    <div className="text-xs tracking-widest">PACK IS EMPTY</div>
                  </div>
                ) : (
                  <>
                    {items.map((item, idx) => (
                      <div key={`${item.sticker.id}-${item.customSize || 'default'}-${idx}`} className="flex gap-3 md:gap-4 border border-[#1A1A1A] p-2 md:p-3 bg-black/50">
                        <div className="w-28 h-28 md:w-32 md:h-32 flex-shrink-0 bg-[#111] border border-[#1A1A1A] flex items-center justify-center p-1 md:p-2">
                          <img src={item.sticker.image_url} alt={item.sticker.name} className="w-full h-full object-contain drop-shadow-lg" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="text-xs font-bold">
                              {item.sticker.name} {item.customSize ? `(${item.customSize})` : ''}
                            </div>
                            <div className="text-[10px] text-white/50 tracking-widest">{item.sticker.collection}</div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs">₹{item.sticker.price / 100}</div>
                            <div className="flex items-center gap-3 border border-[#1A1A1A] px-2 py-1">
                              <button onClick={() => updateQuantity(item.sticker.id, item.quantity - 1, item.customSize)} className="text-white/50 hover:text-white">-</button>
                              <span className="text-xs">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.sticker.id, item.quantity + 1, item.customSize)} className="text-white/50 hover:text-white">+</button>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.sticker.id, item.customSize)} className="text-white/30 hover:text-white text-xs px-2">✕</button>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Checkout Panel */}
              <div className="border-t border-[#1A1A1A] bg-black p-6 shrink-0">
                {items.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-bold mb-1">
                      <span>SUBTOTAL</span>
                      <span className={freeOffer.freeDiscount > 0 ? "text-white/50 line-through text-xs" : ""}>
                        ₹{rawSubtotal / 100}
                      </span>
                    </div>

                    {freeOffer.freeDiscount > 0 && (
                      <div className="flex justify-between text-xs font-mono font-bold text-[#b4ff39] mb-1">
                        <span>5 FREE STICKERS (CART &gt; ₹250)</span>
                        <span>-₹{freeOffer.freeDiscount / 100}</span>
                      </div>
                    )}

                    {freeOffer.freeDiscount > 0 && (
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span>NEW SUBTOTAL</span>
                        <span className="text-[#b4ff39]">₹{(rawSubtotal - freeOffer.freeDiscount) / 100}</span>
                      </div>
                    )}

                    <div className="text-[10px] text-white/50 tracking-widest mb-6 text-right">
                      SHIPPING & DISCOUNTS CALCULATED AT CHECKOUT
                    </div>

                    <button 
                      onClick={() => setIsPreviewOpen(true)}
                      className="w-full mb-3 bg-[#1A1A1A] border border-[#b4ff39]/50 text-[#b4ff39] py-3 text-xs tracking-widest font-bold hover:bg-[#b4ff39]/10 transition-colors flex flex-col items-center justify-center gap-1"
                    >
                      <span>PREVIEW ON YOUR DEVICE 👁</span>
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleCheckoutRedirect}
                  disabled={items.length === 0}
                  className="w-full bg-white text-black font-bold py-4 tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  CHECKOUT →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Preview Modal */}
      {isPreviewOpen && items.length > 0 && (
        <PreviewModal 
          sticker={items[0].sticker} 
          onClose={() => setIsPreviewOpen(false)} 
        />
      )}
    </>
  );
}

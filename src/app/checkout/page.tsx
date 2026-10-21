"use client";

import { useCartStore } from "@/lib/store";
import { useState, useEffect } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { State, City } from "country-state-city";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Address Fields
  const [billerName, setBillerName] = useState("");
  const [billerMobile, setBillerMobile] = useState("");
  const [stateIso, setStateIso] = useState("");
  const [cityName, setCityName] = useState("");
  const [pincode, setPincode] = useState("");
  const [houseFlat, setHouseFlat] = useState("");
  const [streetArea, setStreetArea] = useState("");

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; type: string; value: number } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const indianStates = State.getStatesOfCountry("IN");
  const cities = stateIso ? City.getCitiesOfState("IN", stateIso) : [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    } else if (status === "authenticated" && session?.user?.name && !billerName) {
      setBillerName(session.user.name);
    }
  }, [status, router, session]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">Loading...</div>;
  }

  const tier = session?.user?.tier || "PIXEL";
  const tierDiscountPercent = tier === "MARK" ? 0.15 : tier === "GRID" ? 0.10 : tier === "PIXEL" ? 0.05 : 0;

  const rawSubtotal = items.reduce((acc, item) => acc + (item.sticker.price * item.quantity), 0);
  
  let baseDiscount = Math.round(rawSubtotal * tierDiscountPercent);
  let finalSubtotal = rawSubtotal - baseDiscount;
  let delivery = 0;
  let total = 0;

  let totalStickers = items.reduce((acc, item) => acc + item.quantity, 0);

  if (appliedPromo?.type === "TOTAL_BILL_1RS") {
    baseDiscount = rawSubtotal;
    finalSubtotal = 100; // Force total to 100 paise (1 Rs)
    delivery = 0;
    total = 100;
  } else if (appliedPromo?.type === "FREE_ORDER") {
    baseDiscount = rawSubtotal;
    finalSubtotal = 0;
    delivery = 0;
    total = 0;
  } else if (appliedPromo?.type === "FIXED_PRICE_1RS") {
    baseDiscount = rawSubtotal - (totalStickers * 100);
    finalSubtotal = totalStickers * 100;
    delivery = 7900;
    total = finalSubtotal + delivery;
  } else {
    if (appliedPromo?.type === "FLAT") {
      baseDiscount += appliedPromo.value * 100;
    } else if (appliedPromo?.type === "PERCENT") {
      baseDiscount += Math.floor(rawSubtotal * (appliedPromo.value / 100));
    }
    
    finalSubtotal = Math.max(0, rawSubtotal - baseDiscount);
    // Free delivery if raw subtotal >= 350 Rs (35000 paise) before discounts
    delivery = appliedPromo?.type === "FREE_DELIVERY" ? 0 : (rawSubtotal < 35000 && rawSubtotal > 0 ? 7900 : 0);
    total = finalSubtotal + delivery;
  }

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    setPromoError("");
    try {
      const res = await fetch("/api/payment/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo({ code: promoInput.toUpperCase(), type: data.type, value: data.value });
        setPromoInput("");
      } else {
        setPromoError(data.message || "Invalid promo code");
      }
    } catch (e) {
      setPromoError("Failed to validate code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    if (!billerName.trim() || !billerMobile.trim() || !stateIso || !cityName.trim() || !pincode.trim() || !houseFlat.trim() || !streetArea.trim()) {
      alert("Please fill in all mandatory address fields.");
      return;
    }

    if (!/^\d+$/.test(pincode)) {
      alert("Please enter a valid pincode (numbers only).");
      return;
    }

    const stateObj = State.getStateByCodeAndCountry(stateIso, "IN");

    const deliveryAddress = {
      billerName,
      billerMobile,
      houseFlat,
      streetArea,
      city: cityName,
      state: stateObj?.name || stateIso,
      country: "India",
      pincode
    };

    setIsProcessing(true);

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.sticker.id, quantity: i.quantity })),
          deliveryAddress,
          promoCode: appliedPromo?.code || undefined
        })
      });

      if (!res.ok) throw new Error("Failed to create order");
      
      const data = await res.json();

      if (data.is_free) {
        clearCart();
        router.push(`/success?order_id=${data.order_id}`);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "DOTT.",
        description: "Pixel Stickers Drop",
        order_id: data.order_id,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            clearCart();
            router.push(`/success?order_id=${verifyData.order_number}`);
          } else {
            alert("Payment verification failed.");
          }
        },
        theme: {
          color: "#0A0A0A"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
        alert(response.error.description || "Payment failed.");
      });
      rzp1.open();

    } catch (error) {
      console.error(error);
      alert("Checkout failed. Please ensure you are logged in.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-16 px-8 md:px-16 font-body text-white flex flex-col items-center justify-center">
        <h1 className="font-display text-4xl font-bold tracking-widest mb-4">YOUR PACK IS EMPTY</h1>
        <p className="text-white/50 tracking-widest text-xs mb-8">ADD SOME STICKERS TO SECURE YOUR DROP.</p>
        <Link href="/vault" className="bg-white text-black font-bold py-4 px-8 tracking-widest text-sm hover:bg-gray-200 transition-colors">
          RETURN TO VAULT
        </Link>
      </main>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <main className="min-h-screen bg-[#0A0A0A] pt-32 pb-16 px-8 md:px-16 font-body text-white">
        <div className="max-w-5xl mx-auto mb-8">
           <Link href="/vault" className="text-white/50 hover:text-white font-bold tracking-widest text-xs border border-white/10 px-4 py-2 hover:bg-white/5 transition-colors inline-block">
             ← BACK
           </Link>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* Order Summary */}
          <div>
            <h1 className="font-display text-3xl font-bold tracking-widest mb-8">ORDER SUMMARY</h1>
            <div className="flex flex-col gap-4">
              {items.map((item, idx) => (
                <div key={`${item.sticker.id}-${item.customSize || 'default'}-${idx}`} className="flex gap-4 border border-[#1A1A1A] p-4 bg-black/50">
                  <div className="w-20 h-20 bg-[#111] border border-[#1A1A1A] p-2 flex-shrink-0 flex items-center justify-center">
                    <img src={item.sticker.image_url} alt={item.sticker.name} className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-sm font-bold">
                        {item.sticker.name} {item.customSize ? `(${item.customSize})` : ''}
                      </div>
                      <div className="text-[10px] text-white/50 tracking-widest uppercase">{item.sticker.collection}</div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-white/50">QTY: {item.quantity}</div>
                      <div className="text-sm">₹{item.sticker.price / 100}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Details */}
          <div>
            <h2 className="font-display text-xl font-bold tracking-widest mb-6 border-b border-[#1A1A1A] pb-4">CHECKOUT DETAILS</h2>
            
            <div className="mb-8 border border-[#1A1A1A] p-6 bg-black/30">
              <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2 mb-4">
                <h3 className="font-bold tracking-widest text-sm text-white/80">SHIPPING ADDRESS</h3>
                <span className="text-[10px] font-mono text-[#b4ff39] tracking-widest border border-[#b4ff39]/30 px-2 py-0.5">SHIPS ACROSS INDIA</span>
              </div>
              
              {/* Row 1: Name and Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">FULL NAME *</label>
                  <input 
                    type="text"
                    placeholder="Full Name"
                    value={billerName}
                    onChange={(e) => setBillerName(e.target.value)}
                    className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">PHONE NUMBER *</label>
                  <input 
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={billerMobile}
                    onChange={(e) => setBillerMobile(e.target.value)}
                    className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50"
                  />
                </div>
              </div>

              {/* Row 2: House/Flat and Street/Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">HOUSE / FLAT NO. *</label>
                  <input 
                    type="text"
                    placeholder="Flat, House No., Building"
                    value={houseFlat}
                    onChange={(e) => setHouseFlat(e.target.value)}
                    className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">STREET / AREA / LANDMARK *</label>
                  <input 
                    type="text"
                    placeholder="Street, Sector, Area"
                    value={streetArea}
                    onChange={(e) => setStreetArea(e.target.value)}
                    className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50"
                  />
                </div>
              </div>

              {/* Row 3: Pincode, City, State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">PIN CODE *</label>
                  <input 
                    type="text"
                    placeholder="6-digit PIN"
                    value={pincode}
                    maxLength={6}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">CITY *</label>
                  {cities.length > 0 ? (
                    <select 
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50 text-white"
                    >
                      <option value="">Select City</option>
                      {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text"
                      placeholder="City / Town"
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50 text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-white/50 block mb-2">STATE *</label>
                  <select 
                    value={stateIso}
                    onChange={(e) => {
                      setStateIso(e.target.value);
                      setCityName("");
                    }}
                    className="w-full bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50 text-white"
                  >
                    <option value="">Select State</option>
                    {indianStates.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] tracking-widest text-white/50 block mb-2">REDEEM CODE</label>
              {!appliedPromo ? (
                <div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="ENTER CODE" 
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      className="flex-1 bg-[#111] border border-[#1A1A1A] px-4 py-3 text-xs outline-none focus:border-white/50 tracking-widest uppercase"
                    />
                    <button 
                      onClick={handleApplyPromo}
                      disabled={isApplyingPromo || !promoInput.trim()}
                      className="bg-[#1A1A1A] border border-[#1A1A1A] hover:bg-white/10 px-6 py-3 text-xs tracking-widest disabled:opacity-50"
                    >
                      {isApplyingPromo ? "..." : "APPLY"}
                    </button>
                  </div>
                  {promoError && <div className="text-[10px] text-red-400 mt-2">{promoError}</div>}
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 px-4 py-3">
                  <div className="text-xs text-green-400 tracking-widest font-bold">✓ {appliedPromo.code} APPLIED</div>
                  <button onClick={removePromo} className="text-xs text-white/50 hover:text-white">REMOVE</button>
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="border border-[#1A1A1A] bg-black/50 p-6">
              <div className="flex justify-between text-xs mb-3 text-white/70">
                <span>SUBTOTAL</span>
                <span className={baseDiscount > 0 ? "line-through opacity-50 mr-2" : ""}>₹{rawSubtotal / 100}</span>
              </div>
              
              {baseDiscount > 0 && (
                <div className="flex justify-between text-xs mb-3 text-green-400">
                  <span>DISCOUNT {appliedPromo ? `(${appliedPromo.code})` : `(TIER ${tier})`}</span>
                  <span>-₹{baseDiscount / 100}</span>
                </div>
              )}

              <div className="flex justify-between text-xs mb-4 text-white/70">
                <span>DELIVERY</span>
                <span>{delivery === 0 ? "FREE" : `₹${delivery / 100}`}</span>
              </div>

              <div className="flex justify-between text-lg font-bold pt-4 border-t border-[#1A1A1A] mb-8 font-display">
                <span>TOTAL</span>
                <span>₹{total / 100}</span>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-white text-black font-bold py-4 tracking-widest text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isProcessing ? "PROCESSING..." : "SECURE DROP →"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

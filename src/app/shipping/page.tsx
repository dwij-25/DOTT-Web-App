import React from "react";

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-32 px-6 font-body selection:bg-white selection:text-black">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 border-b border-white/20 pb-8">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 tracking-tight">DOTT. SHIPPING</h1>
        </header>

        <div className="space-y-12 text-sm md:text-base leading-relaxed text-white/80 font-mono">
          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">WHERE WE SHIP</h2>
            <p>Currently shipping across India only.</p>
            <p className="mt-2 text-white/50 text-sm">International shipping — coming soon. Watch @dott.drop.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg border-t border-white/10 pt-8">DELIVERY CHARGES</h2>
            <ul className="space-y-2 opacity-80 mb-6">
              <li className="flex justify-between max-w-sm border-b border-white/10 pb-2">
                <span>Orders below ₹350:</span>
                <span className="font-bold text-white">₹89 flat delivery</span>
              </li>
              <li className="flex justify-between max-w-sm border-b border-white/10 pb-2">
                <span>Orders ₹350 and above:</span>
                <span className="font-bold text-[#b4ff39]">FREE delivery</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg border-t border-white/10 pt-8">PROCESSING TIME</h2>
            <p>Orders are processed within 1-2 business days.</p>
            <p className="mt-2">We pack every order manually. We check every sticker. It takes a day. Worth it.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg border-t border-white/10 pt-8">DELIVERY TIME</h2>
            <ul className="space-y-4 opacity-80 mb-6">
              <li>
                <span className="text-white/40 block text-[10px] uppercase tracking-widest mb-1">Metro cities (Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Ahmedabad):</span>
                3-5 business days
              </li>
              <li>
                <span className="text-white/40 block text-[10px] uppercase tracking-widest mb-1">Tier-2 cities and towns:</span>
                5-8 business days
              </li>
              <li>
                <span className="text-white/40 block text-[10px] uppercase tracking-widest mb-1">Remote areas:</span>
                7-12 business days
              </li>
            </ul>
            <p className="text-sm text-white/50">These are estimates. Courier delays happen. We'll always keep you updated.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg border-t border-white/10 pt-8">TRACKING</h2>
            <p>You'll receive a tracking link via email and SMS once your order ships. Track your stickers every step of the way.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg border-t border-white/10 pt-8">PACKAGING</h2>
            <p>Your stickers ship in a DOTT. branded envelope.</p>
            <p className="mt-2">We package to prevent bending. Always. The unboxing is part of the experience.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg border-t border-white/10 pt-8">MISSING / LOST ORDERS</h2>
            <p>If your order hasn't arrived within the estimated window, reach out at dottdrop@gmail.com with your order number. We'll trace it and make it right.</p>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10 text-white/50 text-xs tracking-widest uppercase">
            Current shipping partners: Shiprocket / Delhivery / DTDC (varies by pincode)
          </div>
        </div>
      </div>
    </div>
  );
}

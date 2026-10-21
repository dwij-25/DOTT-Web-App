import React from "react";

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-32 px-6 font-body selection:bg-white selection:text-black">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 border-b border-white/20 pb-8">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 tracking-tight">DOTT. RETURN POLICY</h1>
          <p className="text-white/50 text-sm tracking-widest font-mono">THE HONEST VERSION</p>
        </header>

        <div className="space-y-12 text-sm md:text-base leading-relaxed text-white/80 font-mono">
          <p className="text-white italic opacity-70">
            Our stickers are physical products that, once peeled and applied, cannot be returned. But here's exactly what we stand behind:
          </p>

          <section>
            <h2 className="font-bold text-white mb-6 tracking-wider text-xl border-b border-white/10 pb-2">WHAT WE ACCEPT RETURNS ON:</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-sm">✦ WRONG ITEM RECEIVED</h3>
                <p>You ordered Laptop Mode, we sent Old School. That's on us. Full replacement, no questions asked.</p>
              </div>

              <div>
                <h3 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-sm">✦ DAMAGED IN TRANSIT</h3>
                <p>Arrived bent, cracked, or destroyed by the courier. Send us a photo within 48 hours of delivery. We'll send a fresh one, free.</p>
              </div>

              <div>
                <h3 className="font-bold text-[#b4ff39] mb-2 tracking-widest text-sm">✦ DEFECTIVE STICKER</h3>
                <p>Peels off in under 1 months under normal use.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-bold text-white mb-6 tracking-wider text-xl border-b border-white/10 pb-2 mt-16">WHAT WE CANNOT ACCEPT:</h2>
            <ul className="list-disc pl-5 space-y-3 opacity-80">
              <li>Change of mind after delivery</li>
              <li>Stickers that have been applied and then removed</li>
              <li>Damage caused by application to surfaces we advise against (rough brick, canvas, skin)</li>
              <li>Custom sticker orders once production has begun</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-6 tracking-wider text-xl border-b border-white/10 pb-2 mt-16">HOW TO RAISE AN ISSUE:</h2>
            <ul className="space-y-2 opacity-80">
              <li><span className="text-white/40 tracking-widest uppercase mr-2">Email:</span> dottdrop@gmail.com</li>
              <li><span className="text-white/40 tracking-widest uppercase mr-2">Instagram DM:</span> @dott.drop</li>
              <li><span className="text-white/40 tracking-widest uppercase mr-2">Include:</span> order number + photo of the issue</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-6 tracking-wider text-xl border-b border-white/10 pb-2 mt-16">TIMELINE:</h2>
            <ul className="space-y-2 opacity-80">
              <li>We respond within 24 hours.</li>
              <li>Replacements dispatched within 2 business days.</li>
              <li>No forms. No hassle. Just email us.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-6 tracking-wider text-xl border-b border-white/10 pb-2 mt-16">REFUNDS:</h2>
            <p>
              If a replacement isn't possible, we issue a full refund to your original payment method within 5-7 business days.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10 text-white/50 text-sm">
            Questions? dottdrop@gmail.com
          </div>
        </div>
      </div>
    </div>
  );
}

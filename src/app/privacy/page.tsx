import React from "react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-32 px-6 font-body selection:bg-white selection:text-black">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 border-b border-white/20 pb-8">
          <h1 className="font-display font-bold text-4xl md:text-5xl mb-4 tracking-tight">DOTT. PRIVACY POLICY</h1>
          <p className="text-white/50 text-sm tracking-widest font-mono">LAST UPDATED: JUNE 2026</p>
        </header>

        <div className="space-y-12 text-sm md:text-base leading-relaxed text-white/80 font-mono">
          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">1. WHO WE ARE</h2>
            <p>
              DOTT. is a pixel sticker drop-culture brand operated from Ahmedabad, Gujarat, India. We sell physical stickers through our website at dott.in.
            </p>
            <p className="mt-2">Contact: dottdrop@gmail.com</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">2. WHAT WE COLLECT</h2>
            <p className="mb-2">When you use DOTT., we collect:</p>
            <ul className="list-disc pl-5 space-y-2 opacity-80">
              <li>Name, email, phone number (when you register or order)</li>
              <li>Delivery address (for shipping)</li>
              <li>Payment reference IDs (via Razorpay — we never store card numbers or UPI details)</li>
              <li>Order history and sticker preferences</li>
              <li>Your DOTT ID profile information if you create one</li>
              <li>Photos you upload for custom sticker requests</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">3. HOW WE USE IT</h2>
            <p className="mb-2">Your information is used to:</p>
            <ul className="list-disc pl-5 space-y-2 opacity-80">
              <li>Process and ship your orders</li>
              <li>Send order confirmations and invoices</li>
              <li>Notify you about new drops (only if you opt in)</li>
              <li>Manage your DOTT ID and tier achievements</li>
              <li>Improve our sticker selection and website experience</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">4. WHAT WE DON'T DO</h2>
            <ul className="list-disc pl-5 space-y-2 opacity-80">
              <li>We do not sell your data. Ever.</li>
              <li>We do not share your information with third parties beyond what is necessary to process your order (shipping partners, payment processor)</li>
              <li>We do not send you promotional emails without consent</li>
              <li>We do not run ads targeting you using your data</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">5. PAYMENT SECURITY</h2>
            <p>
              All payments are processed by Razorpay. We never see, store, or handle your card numbers, UPI IDs, or banking credentials. Razorpay is PCI-DSS compliant and handles all payment security.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">6. YOUR IMAGES</h2>
            <p>
              Images you upload for custom sticker requests are stored securely and used only to process your sticker. We do not use your uploaded images for marketing without explicit written consent.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">7. COOKIES</h2>
            <p className="mb-2">We use minimal cookies for:</p>
            <ul className="list-disc pl-5 space-y-2 opacity-80 mb-2">
              <li>Keeping you logged in to your DOTT ID</li>
              <li>Remembering your cart</li>
              <li>Basic website analytics (anonymized)</li>
            </ul>
            <p>We do not use advertising cookies.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">8. DATA RETENTION</h2>
            <p>
              Your account and order data is kept for as long as your account is active and for 3 years after your last order for accounting purposes. You can request deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">9. YOUR RIGHTS</h2>
            <p className="mb-2">You can at any time:</p>
            <ul className="list-disc pl-5 space-y-2 opacity-80 mb-4">
              <li>Access your personal data</li>
              <li>Request correction of incorrect data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p>Email us at dottdrop@gmail.com for any of the above.</p>
          </section>

          <section>
            <h2 className="font-bold text-white mb-4 tracking-wider text-lg">10. CHANGES</h2>
            <p>
              If we update this policy, we'll notify you via email and update the date at the top of this page.
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10 text-white/50 text-sm">
            Questions? hello@dott.in · @dott.drop
          </div>
        </div>
      </div>
    </div>
  );
}

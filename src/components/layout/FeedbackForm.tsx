"use client";

import { useState, useEffect } from "react";
import { MessageSquare, X, Star, Loader2, Send } from "lucide-react";

export default function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sendCopy, setSendCopy] = useState(false);
  const [botField, setBotField] = useState(""); // Honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (botField) return; // Silent reject for bots

    if (!rating && !message.trim()) {
      setErrorMessage("Please provide a rating or some feedback.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message, email: sendCopy ? email : undefined, botField }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      setStatus("success");
      setTimeout(() => {
        setIsOpen(false);
        // Reset form after closing
        setTimeout(() => {
          setStatus("idle");
          setRating(0);
          setMessage("");
          setEmail("");
          setSendCopy(false);
        }, 300);
      }, 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-fit text-xs md:text-sm tracking-widest hover:text-[#b4ff39] transition-colors flex items-center gap-2 group"
      >
        <MessageSquare className="w-3 h-3 group-hover:scale-110 transition-transform" />
        REPORT BUG / FEEDBACK
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => status !== "loading" && setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-md bg-[#050505] border border-white/20 rounded-xl shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-white font-bold tracking-widest text-sm uppercase">Make Us Better</h2>
              <button 
                onClick={() => status !== "loading" && setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
                disabled={status === "loading"}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-[#b4ff39]/20 flex items-center justify-center mb-4">
                    <Send className="w-6 h-6 text-[#b4ff39]" />
                  </div>
                  <h3 className="text-white font-bold tracking-widest text-lg mb-2">FEEDBACK RECEIVED</h3>
                  <p className="text-white/60 text-sm tracking-wide">
                    Thank you for helping us shape the future of DOTT.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Honeypot */}
                  <input 
                    type="text" 
                    className="hidden" 
                    value={botField} 
                    onChange={e => setBotField(e.target.value)} 
                    tabIndex={-1} 
                    autoComplete="off"
                  />

                  {/* Rating */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs text-white/50 font-bold tracking-widest uppercase">Experience Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star 
                            className={`w-6 h-6 ${(hoverRating || rating) >= star ? "fill-[#b4ff39] text-[#b4ff39]" : "text-white/20"} transition-colors`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-3">
                    <label className="text-xs text-white/50 font-bold tracking-widest uppercase">Details / Suggestions / Bugs</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you loved, or what we can improve..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all resize-none h-32"
                    />
                  </div>

                  {/* CC options */}
                  <div className="flex flex-col gap-4 p-4 rounded-lg bg-white/5 border border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={sendCopy}
                          onChange={(e) => setSendCopy(e.target.checked)}
                          className="peer appearance-none w-4 h-4 border border-white/30 rounded-sm bg-transparent checked:bg-[#b4ff39] checked:border-[#b4ff39] cursor-pointer transition-colors"
                        />
                        <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                          <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      </div>
                      <span className="text-xs text-white/70 group-hover:text-white transition-colors tracking-wide">Send a copy to my email</span>
                    </label>
                    
                    {sendCopy && (
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-black/50 border border-white/10 rounded-md p-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all animate-in slide-in-from-top-2 duration-200"
                      />
                    )}
                  </div>

                  {errorMessage && (
                    <p className="text-red-400 text-xs tracking-wide">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full py-4 bg-white text-black font-bold tracking-widest text-sm uppercase rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      "SUBMIT FEEDBACK"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

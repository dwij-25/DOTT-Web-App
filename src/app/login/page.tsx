"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import PageLoader from "@/components/ui/PageLoader";
import { Codystar } from "next/font/google";

const codystar = Codystar({ weight: "400", subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login Flow
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (res?.error) {
          setError("Invalid email or password. Are you sure you didn't sign up with Google?");
        } else {
          router.push("/profile");
          router.refresh();
        }
      } else {
        // Registration Flow
        if (!showOtpInput) {
          if (handle && handle.includes(" ")) {
            setError("DOTT. HANDLE cannot contain spaces.");
            setLoading(false);
            return;
          }
          if (password.length < 8) {
            setError("Password must be at least 8 characters long.");
            setLoading(false);
            return;
          }

          // Request OTP
          const res = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, dott_handle: handle || undefined }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.message || "Failed to send verification code.");
          } else {
            setShowOtpInput(true);
            setError(null);
          }
        } else {
          // Verify OTP and Register
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              name,
              dott_handle: handle || undefined,
              otp,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.message || "Something went wrong during registration.");
          } else {
            // Auto login after successful registration
            const loginRes = await signIn("credentials", {
              redirect: false,
              email,
              password,
            });

            if (!loginRes?.error) {
              router.push("/profile");
              router.refresh();
            }
          }
        }
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col w-full min-h-screen pt-4 lg:pt-8 bg-[#0A0A0A] relative text-white font-body">
      <PageLoader variant="VAULT" />
      
      {/* Background Noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay z-0" />

      <div className="max-w-md mx-auto w-full px-8 py-4 lg:py-8 relative z-10 flex flex-col justify-center min-h-[60vh]">
        
        {/* Brand Header */}
        <div className="text-center mb-4 lg:mb-6">
          <Link href="/" className="inline-block">
            <img src="/dott-logo.png" alt="DOTT." className="h-8 mx-auto object-contain mb-2 lg:mb-4" />
          </Link>
          <h1 className={`text-2xl lg:text-3xl uppercase tracking-tighter ${codystar.className}`}>
            {isLogin ? "ENTER THE STICKERVERSE" : "JOIN THE INNER CIRCLE"}
          </h1>
        </div>

        {/* Auth Box */}
        <div className="border border-white/20 bg-[#0D0D0D] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-8">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(null); setShowOtpInput(false); setOtp(""); }}
              className={`flex-1 pb-4 text-xs font-bold tracking-widest uppercase transition-colors ${isLogin ? "text-[#b4ff39] border-b-2 border-[#b4ff39]" : "text-white/40 hover:text-white"}`}
            >
              LOGIN
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(null); setShowOtpInput(false); setOtp(""); }}
              className={`flex-1 pb-4 text-xs font-bold tracking-widest uppercase transition-colors ${!isLogin ? "text-[#b4ff39] border-b-2 border-[#b4ff39]" : "text-white/40 hover:text-white"}`}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <AnimatePresence mode="popLayout">
              {showOtpInput && !isLogin ? (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-5"
                >
                  <div className="text-center mb-4">
                    <p className="text-sm text-white/70">A 6-digit verification code has been sent to:</p>
                    <p className="font-bold text-[#b4ff39] tracking-wider mt-1">{email}</p>
                    <p className="text-[10px] text-white/40 mt-2 tracking-wide">(Please check your spam/junk folder if not found)</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-widest text-white/50 uppercase">VERIFICATION CODE</label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="bg-black border border-white/20 p-4 text-2xl tracking-[0.5em] text-center font-mono focus:border-[#b4ff39] outline-none transition-colors"
                      placeholder="000000"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowOtpInput(false); setOtp(""); }}
                    className="text-[10px] tracking-widest text-white/40 hover:text-white uppercase transition-colors mt-2"
                  >
                    BACK TO REGISTRATION
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="main-step"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-5"
                >
                  <AnimatePresence mode="popLayout">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-5"
                      >
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] tracking-widest text-white/50 uppercase">FULL NAME</label>
                          <input 
                            type="text" 
                            required={!isLogin}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black border border-white/20 p-3 text-sm focus:border-[#b4ff39] outline-none transition-colors"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] tracking-widest text-white/50 uppercase flex justify-between items-center">
                            <span>DOTT. HANDLE (Optional)</span>
                            <span className="text-white/30 normal-case tracking-normal">No spaces allowed</span>
                          </label>
                          <input 
                            type="text" 
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            className="bg-black border border-white/20 p-3 text-sm focus:border-[#b4ff39] outline-none transition-colors"
                            placeholder="johndoe"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-widest text-white/50 uppercase">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black border border-white/20 p-3 text-sm focus:border-[#b4ff39] outline-none transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] tracking-widest text-white/50 uppercase flex justify-between items-center">
                      <span>PASSWORD</span>
                      {!isLogin && <span className="text-white/30 normal-case tracking-normal">Min 8 characters</span>}
                    </label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black border border-white/20 p-3 text-sm focus:border-[#b4ff39] outline-none transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="text-red-500 text-xs tracking-wide bg-red-500/10 p-3 border border-red-500/20">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 bg-white text-black font-bold tracking-widest text-xs py-4 hover:bg-gray-200 transition-colors uppercase disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : (isLogin ? "ENTER SECURE VAULT" : (showOtpInput ? "VERIFY & REGISTER" : "CREATE DOTT. ID"))}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] text-white/30 tracking-widest">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button 
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/profile" })}
            className="w-full flex items-center justify-center gap-3 border border-white/20 bg-black text-white font-bold tracking-widest text-xs py-4 hover:border-white/50 transition-colors uppercase"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            CONTINUE WITH GOOGLE
          </button>

        </div>
      </div>
    </main>
  );
}

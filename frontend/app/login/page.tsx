"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Ship, Globe, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login, token, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (token && user) {
      router.replace(user.role === "admin" ? "/admin" : "/client");
    }
  }, [loading, token, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success("Signed in successfully");
      router.replace(u.role === "admin" ? "/admin" : "/client");
    } catch {
      toast.error("Invalid credentials");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-accent-cyan">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Ship className="h-8 w-8" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden selection:bg-accent/30 selection:text-accent-cyan">
      {/* Ambient glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-accent/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-purple/20 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center p-6 relative z-10">
        
        {/* Left Side: 3D Illustration / Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col justify-center items-center p-12 text-center"
        >
          <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
            {/* Simulated 3D Globe with Rings */}
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-accent/30 shadow-[inset_0_0_50px_rgba(37,99,235,0.2)]"
            />
            <motion.div 
              animate={{ rotate: -360 }} 
              transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
              className="absolute inset-4 rounded-full border border-accent-cyan/30"
            />
            <Globe className="w-32 h-32 text-accent-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
            <Ship className="absolute bottom-12 right-12 w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Shipment Management
          </h1>
          <p className="mt-4 text-slate-400 max-w-sm">
            The next generation logistics platform. Pre-MVP demonstration environment.
          </p>
        </motion.div>

        {/* Right Side: Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="rounded-3xl glass-card p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-cyan" />
            
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-sm text-slate-400 mb-8">Sign in to your account</p>

            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-panelHover/50 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan focus:bg-panelHover"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full rounded-xl bg-panelHover/50 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan focus:bg-panelHover"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white transition-colors">
                  <input type="checkbox" className="rounded bg-panel border-white/20 text-accent-cyan focus:ring-accent-cyan focus:ring-offset-background" />
                  Remember me
                </label>
                <button type="button" className="text-accent-cyan hover:text-white transition-colors">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-purple py-3 text-sm font-bold text-white shadow-neon-blue hover:brightness-110 disabled:opacity-60 transition-all"
              >
                {busy ? "Authenticating..." : "Sign in"}
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-3 text-center">Demo Accounts</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 py-2 hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setEmail("admin@test.com");
                    setPassword("password");
                  }}
                >
                  <span className="text-xs font-medium text-slate-300">Admin</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center rounded-lg border border-white/5 bg-white/5 py-2 hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setEmail("client@test.com");
                    setPassword("password");
                  }}
                >
                  <span className="text-xs font-medium text-slate-300">Client</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

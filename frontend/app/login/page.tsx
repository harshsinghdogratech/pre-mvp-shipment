"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Ship, ArrowRight, Loader2 } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Dark Navy Brand Panel */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between bg-sidebar px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Ship className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">ShipFlow</span>
        </div>

        {/* Center content */}
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Ship to Aruba<br />
            <span className="text-primary">with Confidence</span>
          </h1>
          <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
            Fast, reliable & secure shipping solutions for your business. Track your packages in real-time.
          </p>

          {/* Stats row */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: "Packages Shipped", value: "12K+" },
              { label: "Happy Clients", value: "340+" },
              { label: "Uptime", value: "99.9%" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-sidebar-hover p-4">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2026 ShipFlow. All rights reserved.</p>
      </div>

      {/* Right - Login Form */}
      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Ship className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">ShipFlow</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEmail("admin@test.com"); setPassword("password"); }}
                className="flex flex-col items-start rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/30 px-3 py-2.5 transition-colors text-left"
              >
                <span className="text-xs font-bold text-slate-800">Admin</span>
                <span className="text-[10px] text-slate-400">admin@test.com</span>
              </button>
              <button
                type="button"
                onClick={() => { setEmail("client@test.com"); setPassword("password"); }}
                className="flex flex-col items-start rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/30 px-3 py-2.5 transition-colors text-left"
              >
                <span className="text-xs font-bold text-slate-800">Client</span>
                <span className="text-[10px] text-slate-400">client@test.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

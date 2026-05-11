"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LayoutDashboard, Upload, CheckCircle, Ship } from "lucide-react";
import { api } from "@/lib/api";
import type { StatsClient } from "@/lib/types";
import { motion } from "framer-motion";

export default function ClientDashboard() {
  const [stats, setStats] = useState<StatsClient | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<StatsClient>("/stats");
        setStats(data);
      } catch {
        toast.error("Failed to load stats");
      }
    })();
  }, []);

  const cards = [
    {
      label: "Total Packages",
      value: stats?.total_packages ?? "—",
      icon: LayoutDashboard,
      color: "from-accent-cyan to-accent",
    },
    {
      label: "Pending Uploads",
      value: stats?.pending_uploads ?? "—",
      icon: Upload,
      color: "from-accent-warning to-accent",
    },
    {
      label: "Approved Packages",
      value: stats?.approved_packages ?? "—",
      icon: CheckCircle,
      color: "from-accent-success to-emerald-700",
    },
    {
      label: "Shipped Packages",
      value: stats?.shipped_packages ?? "—",
      icon: Ship,
      color: "from-accent-purple to-accent",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
        <p className="mt-2 text-slate-400">
          Track your packages and shipment progress in real-time.
        </p>
      </motion.div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl glass-card p-6 group"
          >
            {/* Background gradient glow on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
            
            <div className="flex items-center justify-between relative z-10">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <div className="mt-6 relative z-10">
              <p className="text-4xl font-bold text-white">{value}</p>
              <p className="mt-1 text-sm font-medium text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
            
            {/* Decorative abstract shape */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

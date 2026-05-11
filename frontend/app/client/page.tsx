"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { StatsClient } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { Package, FileUp, CheckCircle2, Ship, LayoutDashboard, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientDashboard() {
  const [stats, setStats] = useState<StatsClient | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<StatsClient>("/stats");
        setStats(data);
      } catch {
        toast.error("Failed to load dashboard stats");
      }
    })();
  }, []);

  const cards = [
    { label: "My Total Packages", value: stats?.total_packages ?? "—", icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Uploads", value: stats?.pending_invoices ?? "—", icon: FileUp, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Approved Packages", value: stats?.approved_packages ?? "—", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Shipped Packages", value: stats?.shipped_packages ?? "—", icon: Ship, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Welcome back! 👋</h1>
        <p className="page-subtitle">Here&apos;s an overview of your packages and shipments.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="stat-card card-hover"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">What&apos;s Next?</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">1</div>
              <p className="text-sm text-slate-600">Upload invoices for your new packages to get them approved.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">2</div>
              <p className="text-sm text-slate-600">Once approved, request a shipment to Aruba from your packages list.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">3</div>
              <p className="text-sm text-slate-600">Track the status of your shipments in the Shipment Status page.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6 flex flex-col items-center justify-center text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
            <Ship className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Need Help?</h3>
          <p className="text-sm text-slate-500">Our support team is available 24/7 to help you with your shipments.</p>
          <button className="btn-ghost w-full">Contact Support</button>
        </motion.div>
      </div>
    </div>
  );
}

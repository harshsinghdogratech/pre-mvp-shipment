"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { StatsAdmin } from "@/lib/types";
import { LayoutDashboard, ClipboardList, Truck, Ship } from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const generateMockTimelineData = () => {
  const data = [];
  for (let i = 1; i <= 30; i++) {
    data.push({ name: `Day ${i}`, packages: Math.floor(Math.random() * 50) + 10 + i * 2 });
  }
  return data;
};

const timelineData = generateMockTimelineData();
const COLORS = ["#F97316", "#3B82F6", "#8B5CF6", "#10B981"];

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsAdmin | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<StatsAdmin>("/stats");
        setStats(data);
      } catch {
        toast.error("Failed to load stats");
      }
    })();
  }, []);

  const cards = [
    { label: "Total Packages", value: stats?.total_packages ?? "—", icon: LayoutDashboard, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Reviews", value: stats?.pending_reviews ?? "—", icon: ClipboardList, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Shipment Requests", value: stats?.shipment_requests ?? "—", icon: Truck, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Shipped Packages", value: stats?.shipped_packages ?? "—", icon: Ship, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  const pieData = [
    { name: "Pending", value: stats?.pending_reviews || 0 },
    { name: "Approved", value: Math.max(0, (stats?.total_packages || 0) - (stats?.pending_reviews || 0) - (stats?.shipment_requests || 0) - (stats?.shipped_packages || 0)) },
    { name: "Requested", value: stats?.shipment_requests || 0 },
    { name: "Shipped", value: stats?.shipped_packages || 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of packages and operations.</p>
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

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5 lg:col-span-2"
        >
          <h3 className="text-base font-semibold text-slate-800 mb-1">Package Overview</h3>
          <p className="text-xs text-slate-400 mb-5">This month</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#CBD5E1" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#CBD5E1" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", borderColor: "#E2E8F0", borderRadius: "10px", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="packages" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#orangeGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="card p-5 flex flex-col"
        >
          <h3 className="text-base font-semibold text-slate-800 mb-1">Status Distribution</h3>
          <p className="text-xs text-slate-400 mb-2">Current snapshot</p>
          <div className="relative flex-1 flex items-center justify-center min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderColor: "#E2E8F0", borderRadius: "10px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-slate-900">{stats?.total_packages || 0}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-600">{entry.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

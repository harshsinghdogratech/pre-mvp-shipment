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
  Cell
} from "recharts";

// Mock data for the area chart
const generateMockTimelineData = () => {
  const data = [];
  for (let i = 1; i <= 30; i++) {
    data.push({
      name: `Day ${i}`,
      packages: Math.floor(Math.random() * 50) + 10 + (i * 2), // Upward trend
    });
  }
  return data;
};

const timelineData = generateMockTimelineData();

const COLORS = ["#F59E0B", "#2563EB", "#7C3AED", "#10B981"];

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
    {
      label: "Total Packages",
      value: stats?.total_packages ?? "—",
      icon: LayoutDashboard,
      color: "from-accent-cyan to-accent",
    },
    {
      label: "Pending Reviews",
      value: stats?.pending_reviews ?? "—",
      icon: ClipboardList,
      color: "from-accent-purple to-accent",
    },
    {
      label: "Shipment Requests",
      value: stats?.shipment_requests ?? "—",
      icon: Truck,
      color: "from-accent-warning to-accent",
    },
    {
      label: "Shipped Packages",
      value: stats?.shipped_packages ?? "—",
      icon: Ship,
      color: "from-accent-success to-emerald-700",
    },
  ];

  const pieData = [
    { name: "Pending", value: stats?.pending_reviews || 0 },
    { name: "Approved", value: (stats?.total_packages || 0) - (stats?.pending_reviews || 0) - (stats?.shipment_requests || 0) - (stats?.shipped_packages || 0) }, // Roughly uploaded/approved
    { name: "Requested", value: stats?.shipment_requests || 0 },
    { name: "Shipped", value: stats?.shipped_packages || 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-slate-400">
          Overview of platform operations and analytics.
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
            
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 rounded-2xl glass-panel p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Package Overview</h3>
              <p className="text-xs text-slate-400">This Month</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPackages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="packages" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorPackages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="rounded-2xl glass-panel p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-white">Status Distribution</h3>
              <p className="text-xs text-slate-400">Current</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{stats?.total_packages || 0}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-300">{entry.name}</span>
                </div>
                <span className="font-medium text-white">{entry.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { LayoutDashboard, Upload, CheckCircle, Ship } from "lucide-react";
import { api } from "@/lib/api";
import type { StatsClient } from "@/lib/types";

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
    },
    {
      label: "Pending Uploads",
      value: stats?.pending_uploads ?? "—",
      icon: Upload,
    },
    {
      label: "Approved Packages",
      value: stats?.approved_packages ?? "—",
      icon: CheckCircle,
    },
    {
      label: "Shipped Packages",
      value: stats?.shipped_packages ?? "—",
      icon: Ship,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Track your packages and shipment progress.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <Icon className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

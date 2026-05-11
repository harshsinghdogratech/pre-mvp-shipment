"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { StatsAdmin } from "@/lib/types";
import { LayoutDashboard, ClipboardList, Truck, Ship } from "lucide-react";

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
    },
    {
      label: "Pending Reviews",
      value: stats?.pending_reviews ?? "—",
      icon: ClipboardList,
    },
    {
      label: "Shipment Requests",
      value: stats?.shipment_requests ?? "—",
      icon: Truck,
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
        Overview of packages and operations.
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

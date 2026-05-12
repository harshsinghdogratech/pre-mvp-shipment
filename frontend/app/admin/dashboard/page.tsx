"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { AdminDashboard } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Package, ClipboardList, Truck, Ship, CheckCircle, PackageOpen, Users, AlertTriangle } from "lucide-react";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get<AdminDashboard>("/admin/dashboard");
        setStats(data);
      } catch {
        toast.error("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const statusCards = [
    { label: "Ready to Send", value: stats?.ready_to_send ?? 0, icon: Package, color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
    { label: "Pending Invoice Review", value: stats?.pending_invoice_review ?? 0, icon: ClipboardList, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
    { label: "Needs Review", value: stats?.invoice_needs_review ?? 0, icon: AlertTriangle, color: "text-[#E11D48]", bg: "bg-[#E11D48]/10" },
    { label: "Ship Requested", value: stats?.ship_requested ?? 0, icon: Truck, color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10" },
    { label: "Shipped", value: stats?.shipped ?? 0, icon: Ship, color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10" },
    { label: "Delivered", value: stats?.delivered ?? 0, icon: CheckCircle, color: "text-[#059669]", bg: "bg-[#059669]/10" },
  ];

  const overviewCards = [
    { label: "Total Clients", value: stats?.total_clients ?? 0, icon: Users, color: "text-[#00C9B1]", bg: "bg-[#00C9B1]/10" },
    { label: "Pending Invoice Reviews", value: stats?.pending_invoice_count ?? 0, icon: ClipboardList, color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of current operations and pending tasks.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Package Statuses</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statusCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="stat-card flex flex-col items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">System Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="stat-card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${bg} flex shrink-0 items-center justify-center`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
                <p className="text-sm font-medium text-slate-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

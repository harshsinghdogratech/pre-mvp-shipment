"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ClientDashboard } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Package, UploadCloud, Truck,
  ArrowRight,
} from "lucide-react";

const STATUS_ICONS: Record<string, { icon: typeof Package; color: string; bg: string }> = {
  ready_to_send:          { icon: Package,     color: "text-[#3B82F6]", bg: "bg-[#3B82F6]/10" },
  pending_invoice_review: { icon: Package,     color: "text-[#F59E0B]", bg: "bg-[#F59E0B]/10" },
  invoice_needs_review:   { icon: Package,     color: "text-[#E11D48]", bg: "bg-[#E11D48]/10" },
  invoice_approved:       { icon: Package,     color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  ship_requested:         { icon: Truck,       color: "text-[#8B5CF6]", bg: "bg-[#8B5CF6]/10" },
  shipped:                { icon: Truck,       color: "text-[#06B6D4]", bg: "bg-[#06B6D4]/10" },
  ready_for_pickup:       { icon: Package,     color: "text-[#F97316]", bg: "bg-[#F97316]/10" },
  delivered:              { icon: Package,     color: "text-[#059669]", bg: "bg-[#059669]/10" },
};

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<ClientDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get<ClientDashboard>("/client/dashboard");
        setStats(data);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const statusEntries = stats
    ? (Object.entries(stats) as [string, number][]).filter(([, count]) => count > 0)
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, <span className="text-[#00C9B1]">{user?.name}</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Suite:{" "}
          <span className="font-semibold text-slate-800">
            {user?.suite_number || "Not assigned"}
          </span>
        </p>
      </div>

      {statusEntries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Your Package Summary</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statusEntries.map(([status, count]) => {
              const cfg = STATUS_ICONS[status] || STATUS_ICONS.ready_to_send;
              const Icon = cfg.icon;
              return (
                <div key={status} className="stat-card flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex shrink-0 items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${cfg.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{count}</p>
                    <StatusBadge status={status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {statusEntries.length === 0 && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-slate-200 mb-4" />
          <p className="text-slate-500">No packages yet. Your admin will add packages once they arrive at your suite.</p>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/client/upload-invoice")}
            className="card p-6 flex items-center gap-4 hover:border-[#00C9B1]/40 hover:shadow-md transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00C9B1]/10 flex items-center justify-center group-hover:bg-[#00C9B1]/20 transition-colors">
              <UploadCloud className="h-6 w-6 text-[#00C9B1]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Upload an Invoice</h3>
              <p className="text-sm text-slate-500 mt-0.5">Submit invoices for your packages pending review.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#00C9B1] transition-colors" />
          </button>

          <button
            onClick={() => router.push("/client/request-shipment")}
            className="card p-6 flex items-center gap-4 hover:border-[#8B5CF6]/40 hover:shadow-md transition-all group text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center group-hover:bg-[#8B5CF6]/20 transition-colors">
              <Truck className="h-6 w-6 text-[#8B5CF6]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">Request Shipment</h3>
              <p className="text-sm text-slate-500 mt-0.5">Select approved packages and request shipping to Aruba.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-[#8B5CF6] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}

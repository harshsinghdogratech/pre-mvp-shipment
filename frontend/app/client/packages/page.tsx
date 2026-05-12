"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageOut } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Package, ArrowRight, Calendar, Weight } from "lucide-react";

export default function ClientPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get<PackageOut[]>("/client/packages");
        setPackages(data);
      } catch {
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">My Packages</h1>
        <p className="page-subtitle">View all packages assigned to your suite.</p>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No packages yet"
          description="Your packages will appear here once they arrive at your suite."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/client/packages/${p.id}`)}
              className="card p-5 cursor-pointer hover:border-[#00C9B1]/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-[#00C9B1]/10 transition-colors">
                  <Package className="w-5 h-5 text-slate-400 group-hover:text-[#00C9B1]" />
                </div>
                <StatusBadge
                  status={
                    p.status === "ready_to_send" &&
                    p.invoice?.review_status === "needs_review"
                      ? "needs_review"
                      : p.status
                  }
                />
              </div>

              <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mb-2">
                {p.contents_description}
              </h3>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Weight className="w-3 h-3" /> {p.weight} kg
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {p.date_received}
                </span>
              </div>

              <div className="mt-3 flex items-center text-xs font-semibold text-[#00C9B1] opacity-0 group-hover:opacity-100 transition-opacity">
                View Details <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

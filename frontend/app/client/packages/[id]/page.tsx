"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageOut } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Package, Calendar, Ruler, Weight, AlertTriangle } from "lucide-react";

export default function ClientPackageDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const { data } = await api.get<PackageOut>(`/client/packages/${id}`);
        setPkg(data);
      } catch {
        toast.error("Failed to load package details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPackage();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!pkg) return <div className="p-8 text-center text-slate-500">Package not found</div>;

  const hasNeedsReview = pkg.invoice?.review_status === "needs_review" && pkg.invoice?.admin_notes;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-3">
            Package Details <StatusBadge status={pkg.status} />
          </h1>
          <p className="page-subtitle">Tracking: {pkg.tracking_number}</p>
        </div>
      </div>

      {hasNeedsReview && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Admin Review Note</p>
            <p className="text-sm text-amber-700 mt-1">{pkg.invoice?.admin_notes}</p>
          </div>
        </div>
      )}

      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Package className="w-5 h-5 text-[#00C9B1]" /> Package Information
        </h2>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contents</p>
            <p className="text-sm text-slate-900">{pkg.contents_description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Dimensions (W × H × L)
              </p>
              <p className="text-sm font-medium text-slate-900">
                {pkg.width} × {pkg.height} × {pkg.length} cm
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Weight className="w-3 h-3" /> Weight
              </p>
              <p className="text-sm font-medium text-slate-900">{pkg.weight} kg</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Date Received
              </p>
              <p className="text-sm font-medium text-slate-900">{pkg.date_received}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Status</p>
              <StatusBadge status={pkg.status} />
            </div>
          </div>
        </div>
      </div>

      {pkg.invoice && (
        <div className="card p-6 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-3 mb-4">
            Invoice Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">File</p>
              <p className="text-sm text-slate-700">{pkg.invoice.file_name || "Uploaded"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Review Status</p>
              <StatusBadge status={pkg.invoice.review_status} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

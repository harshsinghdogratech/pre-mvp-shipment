"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageDetail } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Package, User, Calendar, Tag, FileText } from "lucide-react";

export default function AdminPackageDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const { data } = await api.get<PackageDetail>(`/admin/packages/${id}`);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-3">
            Package Details{" "}
            <StatusBadge
              status={
                pkg.status === "ready_to_send" &&
                pkg.invoice?.review_status === "needs_review"
                  ? "needs_review"
                  : pkg.status
              }
            />
          </h1>
          <p className="page-subtitle">Tracking: {pkg.tracking_number}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-5 h-5 text-[#00C9B1]" /> Overview
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Contents</p>
              <p className="text-sm text-slate-900">{pkg.contents_description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Dimensions</p>
                <p className="text-sm text-slate-900">{pkg.length} × {pkg.width} × {pkg.height} cm</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Weight</p>
                <p className="text-sm text-slate-900">{pkg.weight} kg</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Received Date</p>
              <p className="text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" /> {pkg.date_received}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-5 h-5 text-[#00C9B1]" /> Client Information
            </h2>
            <div>
              <p className="text-sm font-medium text-slate-900">{pkg.client_name}</p>
              <p className="text-sm text-slate-600">{pkg.client_email}</p>
              <p className="text-sm text-slate-600 mt-1">
                Suite:{" "}
                <span className="font-semibold text-slate-800">
                  {pkg.client_suite ?? "Not assigned"}
                </span>
              </p>
            </div>
          </div>

          {pkg.invoice && (
            <div className="card p-6 space-y-4 bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileText className="w-5 h-5 text-slate-500" /> Invoice Information
              </h2>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Review Status</p>
                <StatusBadge status={pkg.invoice.review_status} />
              </div>
              
              {pkg.invoice.admin_notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Admin Notes</p>
                  <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                    {pkg.invoice.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <Tag className="w-5 h-5 text-[#00C9B1]" /> Status History
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-700 font-semibold">
                <th className="p-3 rounded-tl-lg">Date & Time</th>
                <th className="p-3">From Status</th>
                <th className="p-3">To Status</th>
                <th className="p-3 rounded-tr-lg">Changed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pkg.status_history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-sm text-slate-500">No history available</td>
                </tr>
              ) : (
                pkg.status_history.map((h) => (
                  <tr key={h.id}>
                    <td className="p-3 text-sm text-slate-600">
                      {new Date(h.changed_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={h.old_status} />
                    </td>
                    <td className="p-3">
                      <StatusBadge status={h.new_status} />
                    </td>
                    <td className="p-3 text-sm text-slate-600">
                      {h.changed_by_name || "System"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

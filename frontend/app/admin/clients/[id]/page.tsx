"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { AdminClientDetail } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, User, Package, ArrowRight, Mail, Hash } from "lucide-react";

export default function AdminClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<AdminClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { data } = await api.get<AdminClientDetail>(`/admin/clients/${id}`);
        setClient(data);
      } catch {
        toast.error("Failed to load client details");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClient();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!client) return <div className="p-8 text-center text-slate-500">Client not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title flex items-center gap-3">
            Client Details
          </h1>
          <p className="page-subtitle">View client information and their packages.</p>
        </div>
      </div>

      <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00C9B1]/10 text-[#00C9B1]">
          <User className="h-8 w-8" />
        </div>
        <div className="flex-1 space-y-1">
          <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-slate-400" /> {client.email}</span>
            <span className="flex items-center gap-1.5"><Hash className="w-4 h-4 text-slate-400" /> Suite: <span className="font-semibold text-slate-800">{client.suite_number || "None"}</span></span>
          </div>
        </div>
        <div className="text-center sm:text-right bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Packages</p>
          <p className="text-3xl font-bold text-[#00C9B1]">{client.packages.length}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-400" /> Packages for {client.name}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4">Tracking Number</th>
                <th className="p-4">Contents</th>
                <th className="p-4">Weight</th>
                <th className="p-4">Date Received</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={<Package className="h-8 w-8" />}
                      title="No packages found"
                      description="This client does not have any packages registered yet."
                    />
                  </td>
                </tr>
              ) : (
                client.packages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-sm font-medium text-slate-900">
                      {p.tracking_number}
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate">
                      {p.contents_description}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {p.weight} kg
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {p.date_received}
                    </td>
                    <td className="p-4">
                      <StatusBadge
                        status={
                          p.status === "ready_to_send" &&
                          p.invoice?.review_status === "needs_review"
                            ? "needs_review"
                            : p.status
                        }
                      />
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => router.push(`/admin/packages/${p.id}`)}
                        className="btn-ghost flex items-center gap-2 ml-auto"
                      >
                        View <ArrowRight className="h-4 w-4" />
                      </button>
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

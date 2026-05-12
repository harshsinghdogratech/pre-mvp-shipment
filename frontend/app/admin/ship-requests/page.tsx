"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { ShipRequestOut } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Truck, ChevronDown, ChevronUp, Check, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminShipRequestsPage() {
  const [requests, setRequests] = useState<ShipRequestOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [shippingId, setShippingId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get<ShipRequestOut[]>("/admin/ship-requests");
      setRequests(data);
    } catch {
      toast.error("Failed to load ship requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleMarkShipped = async () => {
    if (!shippingId) return;
    setProcessing(true);
    try {
      await api.patch(`/admin/ship-requests/${shippingId}/mark-shipped`);
      toast.success("Ship request marked as shipped");
      fetchRequests();
    } catch {
      toast.error("Failed to update ship request status");
    } finally {
      setProcessing(false);
      setShippingId(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Truck className="h-6 w-6 text-[#00C9B1]" /> Ship Requests
        </h1>
        <p className="page-subtitle">Manage client requests to ship their approved packages.</p>
      </div>

      <div className="card overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="p-4 w-10"></th>
                <th className="p-4">Client</th>
                <th className="p-4 text-center">Packages</th>
                <th className="p-4">Date Submitted</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={<Truck className="h-8 w-8" />}
                      title="No ship requests"
                      description="There are currently no active ship requests from clients."
                    />
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <React.Fragment key={req.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${expandedId === req.id ? 'bg-slate-50' : ''}`}>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleExpand(req.id)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors"
                        >
                          {expandedId === req.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-900">{req.client_name}</p>
                        <p className="text-xs text-slate-500">{req.client_email}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          {req.packages.length}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(req.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={req.processing_status} />
                      </td>
                      <td className="p-4 text-right">
                        {req.processing_status === "pending" && (
                          <button
                            onClick={() => setShippingId(req.id)}
                            className="btn-primary py-1.5 px-3 text-xs bg-[#10B981] hover:bg-emerald-600 flex items-center gap-1 ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark as Shipped
                          </button>
                        )}
                      </td>
                    </tr>
                    
                    <AnimatePresence>
                      {expandedId === req.id && (
                        <tr>
                          <td colSpan={6} className="p-0 border-b border-slate-200">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-slate-50/50 overflow-hidden"
                            >
                              <div className="p-6 pl-14">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <Package className="w-4 h-4" /> Packages in this request
                                </h4>
                                <ul className="space-y-2">
                                  {req.packages.map(p => (
                                    <li key={p.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                                          <Package className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-slate-800">{p.tracking_number}</p>
                                          <p className="text-xs text-slate-500">{p.contents_description}</p>
                                        </div>
                                      </div>
                                      {p.status && <StatusBadge status={p.status} />}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!shippingId}
        title="Mark as Shipped"
        message="Are you sure you want to mark this request as shipped? This will update all associated packages to 'Shipped' status."
        confirmText="Mark as Shipped"
        onConfirm={handleMarkShipped}
        onCancel={() => setShippingId(null)}
        isLoading={processing}
      />
    </div>
  );
}

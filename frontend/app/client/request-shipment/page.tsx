"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageOut } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Truck, Package, Weight, Check } from "lucide-react";

export default function ClientRequestShipmentPage() {
  const [packages, setPackages] = useState<PackageOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchApproved = useCallback(async () => {
    try {
      const { data } = await api.get<PackageOut[]>("/client/packages");
      const approved = data.filter((p) => p.status === "invoice_approved");
      setPackages(approved);
    } catch {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApproved();
  }, [fetchApproved]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === packages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(packages.map((p) => p.id)));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/client/ship-requests", {
        package_ids: Array.from(selected),
      });
      toast.success("Ship request submitted successfully!");
      setSelected(new Set());
      setShowConfirm(false);
      setLoading(true);
      await fetchApproved();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to submit ship request";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Truck className="h-6 w-6 text-[#00C9B1]" /> Request Shipment
        </h1>
        <p className="page-subtitle">
          Select packages to ship to Aruba. Only packages with approved invoices are eligible.
        </p>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="No packages ready to ship yet"
          description="Packages will appear here once their invoices are approved by the admin."
        />
      ) : (
        <>
          <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={selected.size === packages.length && packages.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300 text-[#00C9B1] focus:ring-[#00C9B1]"
              />
              Select All ({packages.length} packages)
            </label>
          </div>

          <div className="space-y-3">
            {packages.map((pkg) => {
              const isSelected = selected.has(pkg.id);
              return (
                <div
                  key={pkg.id}
                  onClick={() => toggleSelect(pkg.id)}
                  className={`card p-4 cursor-pointer transition-all flex items-center gap-4 ${
                    isSelected
                      ? "border-[#00C9B1] bg-[#00C9B1]/5 shadow-sm"
                      : "hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-[#00C9B1] border-[#00C9B1]"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {pkg.contents_description}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tracking: {pkg.tracking_number}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Weight className="w-3 h-3" /> {pkg.weight} kg
                    </span>
                    <StatusBadge status={pkg.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {packages.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/90 bg-white/95 px-4 py-2.5 shadow-[0_-8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90 lg:left-64"
          role="region"
          aria-label="Shipment selection actions"
        >
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 sm:gap-4">
            <p className="min-w-0 text-xs font-medium text-slate-600 sm:text-sm">
              {selected.size > 0 ? (
                <>
                  <span className="font-semibold text-[#00C9B1]">{selected.size}</span>
                  <span className="text-slate-600">
                    {" "}
                    package{selected.size !== 1 ? "s" : ""} selected
                  </span>
                </>
              ) : (
                <span className="text-slate-400">No packages selected</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              disabled={selected.size === 0}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition-all sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm ${
                selected.size > 0
                  ? "bg-[#00C9B1] text-white shadow-[#00C9B1]/20 hover:bg-[#00b3a0]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              Submit request
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm Ship Request"
        message={`Are you sure you want to request shipment for ${selected.size} package${selected.size !== 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText="Submit Ship Request"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
        isLoading={submitting}
      />
    </div>
  );
}

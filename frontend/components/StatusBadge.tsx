"use client";

import { PackageStatus } from "@/lib/types";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending_invoice: {
    label: "Pending Invoice",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  invoice_uploaded: {
    label: "Invoice Uploaded",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
  shipment_requested: {
    label: "Shipment Requested",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  shipped: {
    label: "Shipped",
    bg: "bg-slate-100",
    text: "text-slate-700",
  },
};

export function PackageStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    bg: "bg-slate-50",
    text: "text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text} border border-current/10`}
    >
      {config.label}
    </span>
  );
}

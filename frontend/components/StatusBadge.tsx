"use client";

import { PackageStatus, ShipProcessingStatus, InvoiceReviewStatus } from "@/lib/types";

const statusConfig: Record<string, { label: string; className: string }> = {
  ready_to_send: {
    label: "Ready to Send",
    className: "bg-[#3B82F6] text-white",
  },
  pending_invoice_review: {
    label: "Pending Invoice Review",
    className: "bg-[#F59E0B] text-white",
  },
  invoice_approved: {
    label: "Invoice Approved",
    className: "bg-[#10B981] text-white",
  },
  ship_requested: {
    label: "Ship Requested",
    className: "bg-[#8B5CF6] text-white",
  },
  shipped: {
    label: "Shipped",
    className: "bg-[#06B6D4] text-white",
  },
  ready_for_pickup: {
    label: "Ready for Pickup",
    className: "bg-[#F97316] text-white",
  },
  delivered: {
    label: "Delivered",
    className: "bg-[#059669] text-white",
  },

  pending: {
    label: "Pending",
    className: "bg-slate-500 text-white",
  },

  approved: {
    label: "Approved",
    className: "bg-[#10B981] text-white",
  },
  needs_review: {
    label: "Needs Review",
    className: "bg-[#F59E0B] text-white",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, " "),
    className: "bg-slate-500 text-white",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-sm ${config.className}`}
    >
      {config.label}
    </span>
  );
}

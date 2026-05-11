import type { InvoiceStatus, PackageStatus } from "@/lib/types";

const pkgStyles: Record<PackageStatus, string> = {
  pending_invoice: "bg-accent-warning/10 text-accent-warning border-accent-warning/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
  invoice_uploaded: "bg-accent/10 text-accent border-accent/30 shadow-[0_0_10px_rgba(37,99,235,0.2)]",
  approved: "bg-accent-success/10 text-accent-success border-accent-success/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  rejected: "bg-accent-error/10 text-accent-error border-accent-error/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  shipment_requested: "bg-accent-purple/10 text-accent-purple border-accent-purple/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]",
  shipped: "bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
};

const invStyles: Record<InvoiceStatus, string> = {
  pending: "bg-accent-warning/10 text-accent-warning border-accent-warning/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
  approved: "bg-accent-success/10 text-accent-success border-accent-success/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  rejected: "bg-accent-error/10 text-accent-error border-accent-error/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
};

export function PackageStatusBadge({ status }: { status: PackageStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${pkgStyles[status]} transition-shadow`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${pkgStyles[status].split(' ')[1].replace('text-', 'bg-')} animate-pulse-slow`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${invStyles[status]} transition-shadow`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${invStyles[status].split(' ')[1].replace('text-', 'bg-')} animate-pulse-slow`} />
      {status}
    </span>
  );
}

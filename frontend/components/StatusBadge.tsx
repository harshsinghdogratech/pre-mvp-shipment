import type { InvoiceStatus, PackageStatus } from "@/lib/types";

const pkgStyles: Record<PackageStatus, string> = {
  pending_invoice: "bg-amber-100 text-amber-900 ring-amber-200",
  invoice_uploaded: "bg-sky-100 text-sky-900 ring-sky-200",
  approved: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  rejected: "bg-rose-100 text-rose-900 ring-rose-200",
  shipment_requested: "bg-violet-100 text-violet-900 ring-violet-200",
  shipped: "bg-green-100 text-green-900 ring-green-200",
};

const invStyles: Record<InvoiceStatus, string> = {
  pending: "bg-amber-100 text-amber-900 ring-amber-200",
  approved: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  rejected: "bg-rose-100 text-rose-900 ring-rose-200",
};

export function PackageStatusBadge({ status }: { status: PackageStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${pkgStyles[status]}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${invStyles[status]}`}
    >
      {status}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { InvoicePendingRow } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmModal } from "@/components/ConfirmModal";
import { InvoicePreviewModal } from "@/components/InvoicePreviewModal";
import { fetchInvoiceObjectUrl } from "@/lib/invoiceFile";
import { ClipboardList, FileText, Check, AlertCircle, Send } from "lucide-react";

type InvoicePreviewState = {
  packageId: number;
  fileName: string;
  blobUrl: string | null;
  mime: string;
  loading: boolean;
  error: boolean;
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoicePendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<InvoicePreviewState | null>(null);

  const [approveId, setApproveId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const [reviewId, setReviewId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const loadInvoices = async () => {
    try {
      const { data } = await api.get<InvoicePendingRow[]>("/admin/invoices/pending");
      setInvoices(data);
    } catch {
      toast.error("Failed to load pending invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const closePreview = () => {
    setPreview((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  };

  const openInvoicePreview = async (packageId: number, fileName: string) => {
    setPreview((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return {
        packageId,
        fileName: fileName.trim() || "invoice",
        blobUrl: null,
        mime: "",
        loading: true,
        error: false,
      };
    });
    try {
      const { url, mime } = await fetchInvoiceObjectUrl(packageId);
      setPreview((prev) => {
        if (!prev || prev.packageId !== packageId) {
          URL.revokeObjectURL(url);
          return prev;
        }
        return { ...prev, blobUrl: url, mime, loading: false, error: false };
      });
    } catch {
      setPreview((prev) =>
        prev && prev.packageId === packageId
          ? { ...prev, loading: false, error: true }
          : prev,
      );
      toast.error("Could not load invoice");
    }
  };

  const handleApprove = async () => {
    if (!approveId) return;
    setProcessing(true);
    try {
      await api.patch(`/admin/invoices/${approveId}/approve`);
      toast.success("Invoice approved successfully");
      setInvoices((prev) => prev.filter((i) => i.id !== approveId));
    } catch {
      toast.error("Failed to approve invoice");
    } finally {
      setProcessing(false);
      setApproveId(null);
    }
  };

  const handleNeedsReviewSubmit = async (invoiceId: number) => {
    if (!adminNote.trim()) {
      toast.error("Please provide a note explaining what needs review.");
      return;
    }
    try {
      await api.patch(`/admin/invoices/${invoiceId}/needs-review`, {
        admin_notes: adminNote,
      });
      toast.success("Invoice flagged for review");
      setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
      setReviewId(null);
      setAdminNote("");
    } catch {
      toast.error("Failed to flag invoice");
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-[#00C9B1]" /> Pending Invoice Reviews
        </h1>
        <p className="page-subtitle">Review client uploaded invoices and approve them for shipment processing.</p>
      </div>

      {invoices.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Check className="h-8 w-8 text-[#10B981]" />}
            title="All caught up!"
            description="There are no invoices pending review right now."
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {invoices.map((inv) => (
            <div key={inv.id} className="card overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">{inv.package_tracking}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{inv.contents_description}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                    Pending
                  </span>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Client</p>
                    <p className="text-sm font-semibold text-slate-700">{inv.client_name}</p>
                    <p className="text-xs text-slate-500">{inv.client_suite || "No suite"} • {inv.client_email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase">Uploaded On</p>
                    <p className="text-sm text-slate-700">{new Date(inv.uploaded_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200">
                {reviewId === inv.id ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">Needs Review Note</label>
                    <textarea
                      autoFocus
                      rows={3}
                      className="input-field text-sm"
                      placeholder="Explain what is wrong with the invoice..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setReviewId(null);
                          setAdminNote("");
                        }}
                        className="btn-ghost px-3 py-1.5 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleNeedsReviewSubmit(inv.id)}
                        className="btn-primary flex items-center gap-1 bg-[#F59E0B] hover:bg-amber-600 px-3 py-1.5 text-xs"
                      >
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openInvoicePreview(
                          inv.package_id,
                          inv.file_name || "invoice",
                        )
                      }
                      className="btn-ghost w-full flex justify-center items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> View invoice
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setApproveId(inv.id)}
                        className="flex-1 btn-primary bg-[#10B981] hover:bg-emerald-600 flex justify-center items-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => setReviewId(inv.id)}
                        className="flex-1 btn-primary bg-[#F59E0B] hover:bg-amber-600 flex justify-center items-center gap-1"
                      >
                        <AlertCircle className="w-4 h-4" /> Needs Review
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!approveId}
        title="Approve Invoice"
        message="Are you sure you want to approve this invoice? The package will be marked as Invoice Approved and the client will be able to request shipment."
        confirmText="Approve Invoice"
        onConfirm={handleApprove}
        onCancel={() => setApproveId(null)}
        isLoading={processing}
      />

      <InvoicePreviewModal
        isOpen={preview !== null}
        onClose={closePreview}
        fileName={preview?.fileName ?? ""}
        blobUrl={preview?.blobUrl ?? null}
        mime={preview?.mime ?? ""}
        loading={preview?.loading ?? false}
        error={preview?.error ?? false}
      />
    </div>
  );
}

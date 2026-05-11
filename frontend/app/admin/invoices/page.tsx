"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { InvoiceDetail, InvoicePending } from "@/lib/types";
import { Modal } from "@/components/Modal";

const PREVIEW_IMAGE = new Set(["png", "jpg", "jpeg"]);

export default function AdminInvoicesPage() {
  const [rows, setRows] = useState<InvoicePending[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<InvoiceDetail | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<InvoicePending[]>("/invoices/pending");
      setRows(data);
    } catch {
      toast.error("Failed to load invoices");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function openReview(row: InvoicePending) {
    setBusy(true);
    try {
      const { data } = await api.get<InvoiceDetail>(`/invoices/${row.id}`);
      setActive(data);
      setOpen(true);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (data.file_type === "pdf" || PREVIEW_IMAGE.has(data.file_type)) {
        const res = await api.get(`/invoices/${row.id}/file`, {
          responseType: "blob",
        });
        const blob = new Blob([res.data], {
          type:
            data.file_type === "pdf"
              ? "application/pdf"
              : `image/${data.file_type === "jpg" ? "jpeg" : data.file_type}`,
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch {
      toast.error("Could not open invoice");
    } finally {
      setBusy(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setActive(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  async function approve() {
    if (!active) return;
    setBusy(true);
    try {
      await api.patch(`/invoices/${active.id}/approve`);
      toast.success("Invoice approved");
      closeModal();
      await load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      toast.error(typeof d === "string" ? d : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!active || !reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/invoices/${active.id}/reject`, {
        rejection_reason: reason.trim(),
      });
      toast.success("Invoice rejected");
      setRejectOpen(false);
      setReason("");
      closeModal();
      await load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      toast.error(typeof d === "string" ? d : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Invoice Reviews</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pending invoices awaiting your decision.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-6 py-3">Package</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">File</th>
              <th className="px-6 py-3">Uploaded</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  Nothing pending — you are all caught up.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {r.package_title}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {r.client_name}
                    <div className="text-xs text-slate-500">{r.client_email}</div>
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {r.original_file_name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {new Date(r.uploaded_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openReview(r)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={active ? `Review: ${active.original_file_name}` : "Review"}
        onClose={closeModal}
      >
        {active && (
          <div className="space-y-4">
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50">
              {active.file_type === "pdf" && previewUrl && (
                <iframe
                  title="invoice"
                  className="h-[50vh] w-full"
                  src={previewUrl}
                />
              )}
              {PREVIEW_IMAGE.has(active.file_type) && previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="invoice"
                  src={previewUrl}
                  className="max-h-[50vh] w-auto object-contain"
                />
              )}
              {!(active.file_type === "pdf" || PREVIEW_IMAGE.has(active.file_type)) && (
                <div className="p-6 text-sm text-slate-600">
                  Preview is not available for this file type. Use{" "}
                  <span className="font-semibold">Download file</span> below.
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {active &&
                !(active.file_type === "pdf" || PREVIEW_IMAGE.has(active.file_type)) && (
                <button
                  type="button"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
                  onClick={async () => {
                    const res = await api.get(`/invoices/${active.id}/file`, {
                      responseType: "blob",
                    });
                    const url = URL.createObjectURL(res.data);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = active.original_file_name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download file
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={approve}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={rejectOpen}
        title="Reject invoice"
        onClose={() => {
          setRejectOpen(false);
          setReason("");
        }}
      >
        <p className="text-sm text-slate-600">
          The client will be asked to upload a new invoice.
        </p>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          rows={4}
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            onClick={() => {
              setRejectOpen(false);
              setReason("");
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={reject}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Submit rejection
          </button>
        </div>
      </Modal>
    </div>
  );
}

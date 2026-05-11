"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { InvoiceDetail, InvoicePending } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, XCircle, Search, Download, Eye } from "lucide-react";

const PREVIEW_IMAGE = new Set(["png", "jpg", "jpeg"]);

export default function AdminInvoicesPage() {
  const [rows, setRows] = useState<InvoicePending[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<InvoiceDetail | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredRows = rows.filter(r => 
    r.package_title.toLowerCase().includes(search.toLowerCase()) || 
    r.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">Invoice Reviews</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pending invoices awaiting your decision.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search pending invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-panel/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple transition-all backdrop-blur-md"
          />
        </motion.div>
      </div>

      <div className="space-y-4">
        {filteredRows.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed border-white/20"
          >
            <CheckCircle2 className="h-16 w-16 text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-300">Nothing pending!</p>
            <p className="text-sm text-slate-500">You are all caught up.</p>
          </motion.div>
        ) : (
          filteredRows.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.01, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel transition-all border-l-4 border-l-accent-warning"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center shadow-lg">
                  <FileText className="h-6 w-6 text-accent-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{r.package_title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-400">
                    <span className="text-slate-300">{r.client_name}</span>
                    <span className="text-slate-500">({r.client_email})</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-accent-cyan truncate max-w-[200px]">{r.original_file_name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 md:ml-auto">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Uploaded</span>
                  <span className="text-sm text-slate-300">{new Date(r.uploaded_at).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openReview(r)}
                  className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-all shadow-lg flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-accent-cyan" />
                  Review
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        open={open}
        title={active ? `Review Invoice` : "Review"}
        onClose={closeModal}
      >
        {active && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 bg-panelHover p-4 rounded-xl border border-white/5">
              <FileText className="w-8 h-8 text-accent-purple" />
              <div>
                <p className="font-semibold text-white truncate max-w-sm">{active.original_file_name}</p>
                <p className="text-xs text-slate-400 uppercase">Package: {active.package_id}</p>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-xl border border-white/10 bg-black/50 relative">
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
                  className="w-full h-auto object-contain"
                />
              )}
              {!(active.file_type === "pdf" || PREVIEW_IMAGE.has(active.file_type)) && (
                <div className="p-12 text-center text-sm text-slate-400 flex flex-col items-center">
                  <Download className="w-12 h-12 mb-4 text-slate-600" />
                  Preview is not available for this file type.
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-white/10">
              {!(active.file_type === "pdf" || PREVIEW_IMAGE.has(active.file_type)) && (
                <button
                  type="button"
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 flex items-center gap-2 transition-all mr-auto"
                  onClick={async () => {
                    const res = await api.get(`/invoices/${active.id}/file`, { responseType: "blob" });
                    const url = URL.createObjectURL(res.data);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = active.original_file_name;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
                className="rounded-xl bg-accent-error/20 border border-accent-error/30 text-accent-error px-6 py-2 text-sm font-bold hover:bg-accent-error/30 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={approve}
                className="rounded-xl bg-gradient-to-r from-accent-success to-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectOpen}
        title="Reject Invoice"
        onClose={() => {
          setRejectOpen(false);
          setReason("");
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Please provide a reason for rejecting this invoice. The client will be notified.
          </p>
          <textarea
            className="w-full rounded-xl bg-panelHover/50 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-accent-error focus:ring-1 focus:ring-accent-error resize-none"
            rows={4}
            placeholder="E.g., The amount doesn't match the PO."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => {
                setRejectOpen(false);
                setReason("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={reject}
              className="rounded-xl bg-accent-error px-6 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              Submit Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

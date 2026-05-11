"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { InvoicePending } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { Search, FileText, CheckCircle2, XCircle, User, Package, ExternalLink, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminInvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const { data } = await api.get<any[]>("/invoices/pending");
      setRows(data);
    } catch {
      toast.error("Failed to load invoices");
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedInvoice) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedInvoice]);

  async function handleAction(id: number, action: "approve" | "reject") {
    setBusyId(id);
    try {
      await api.patch(`/invoices/${id}/${action}`);
      toast.success(`Invoice ${action}ed`);
      setSelectedInvoice(null);
      await load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not update status");
    } finally {
      setBusyId(null);
    }
  }

  const filteredRows = rows.filter(r => 
    (r.package_title || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.client_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Invoice Reviews</h1>
        <p className="page-subtitle">Review and verify invoices uploaded by clients.</p>
      </motion.div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by package or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredRows.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500">No invoices pending review.</p>
          </div>
        ) : (
          filteredRows.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 hover:border-primary/30 transition-colors flex flex-col md:flex-row md:items-center gap-4 group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-none">{r.package_title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {r.client_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <PackageStatusBadge status={r.status} />
                <button 
                  onClick={() => setSelectedInvoice(r)}
                  className="btn-ghost flex items-center gap-2"
                >
                  Review
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden overscroll-none" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header - fixed */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-slate-900">Review Invoice</h2>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Info row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Package</p>
                    <p className="text-sm text-slate-900 font-medium">{selectedInvoice.package_title}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client</p>
                    <p className="text-sm text-slate-900 font-medium">{selectedInvoice.client_name}</p>
                  </div>
                </div>

                {/* File info bar */}
                <div className="rounded-lg border border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{selectedInvoice.original_file_name || "Invoice Document"}</p>
                      <p className="text-[11px] text-slate-400">{new Date(selectedInvoice.uploaded_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <a 
                    href={`${api.defaults.baseURL}/invoices/${selectedInvoice.id}/file?token=${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in tab
                  </a>
                </div>

                {/* Inline Preview - contained */}
                <div className="h-72 w-full rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
                  {selectedInvoice.file_type === "pdf" ? (
                    <iframe 
                      src={`${api.defaults.baseURL}/invoices/${selectedInvoice.id}/file?token=${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`}
                      className="w-full h-full border-none"
                      title="Invoice Preview"
                    />
                  ) : (
                    <img 
                      src={`${api.defaults.baseURL}/invoices/${selectedInvoice.id}/file?token=${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`}
                      alt="Invoice Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  )}
                </div>
              </div>

              {/* Footer actions - fixed */}
              <div className="p-5 border-t border-slate-100 flex gap-3 shrink-0">
                <button
                  onClick={() => handleAction(selectedInvoice.id, "reject")}
                  disabled={busyId === selectedInvoice.id}
                  className="flex-1 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedInvoice.id, "approve")}
                  disabled={busyId === selectedInvoice.id}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

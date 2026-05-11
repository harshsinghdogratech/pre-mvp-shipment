"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { FileUp, Search, Package, UploadCloud, X, Loader2, Send, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientPackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function load() {
    try {
      const { data } = await api.get<PackageRow[]>("/packages");
      setPackages(data);
    } catch {
      toast.error("Failed to load packages");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedId) return;

    setUploadingId(selectedId);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("package_id", selectedId.toString());

    try {
      await api.post("/invoices/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Invoice uploaded successfully");
      setIsModalOpen(false);
      setFile(null);
      await load();
    } catch {
      toast.error("Failed to upload invoice");
    } finally {
      setUploadingId(null);
    }
  }

  async function requestShipment(id: number) {
    setRequestingId(id);
    try {
      await api.patch(`/packages/${id}/request-shipment`);
      toast.success("Shipment requested successfully!");
      await load();
    } catch {
      toast.error("Failed to request shipment");
    } finally {
      setRequestingId(null);
    }
  }

  const filtered = packages.filter((p) =>
    (p.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">My Packages</h1>
        <p className="page-subtitle">Track and manage your incoming shipments.</p>
      </motion.div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search your packages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <Package className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500">No packages found.</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 hover:border-primary/30 transition-colors flex flex-col md:flex-row md:items-center gap-4 group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Package className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-none">{p.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5">{p.description || "No description provided."}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <PackageStatusBadge status={p.status} />
                
                {p.status === "pending_invoice" && (
                  <button
                    onClick={() => { setSelectedId(p.id); setIsModalOpen(true); }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FileUp className="w-4 h-4" />
                    Upload Invoice
                  </button>
                )}

                {p.status === "approved" && (
                  <button
                    onClick={() => requestShipment(p.id)}
                    disabled={requestingId === p.id}
                    className="btn-primary flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Send className="w-4 h-4" />
                    {requestingId === p.id ? "Requesting..." : "Request Shipment"}
                  </button>
                )}
                
                {(p.status === "invoice_uploaded" || p.status === "shipment_requested" || p.status === "shipped") && (
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Upload Invoice</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={onUpload} className="p-6 space-y-4">
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
                    file ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/50"
                  }`}
                >
                  <UploadCloud className={`w-12 h-12 mb-4 ${file ? "text-primary" : "text-slate-300"}`} />
                  {file ? (
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-900">{file.name}</p>
                      <button 
                        type="button" 
                        onClick={() => setFile(null)}
                        className="relative z-10 text-xs text-rose-500 hover:underline mt-1"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-slate-400 mt-1">PDF, JPG or PNG (max 10MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!file || uploadingId !== null}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {uploadingId !== null ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Submit Invoice"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

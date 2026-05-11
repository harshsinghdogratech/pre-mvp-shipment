"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import {
  InvoiceStatusBadge,
  PackageStatusBadge,
} from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { motion } from "framer-motion";
import { Package, UploadCloud, Search } from "lucide-react";

const ALLOWED = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "doc",
  "docx",
  "xls",
  "xlsx",
];

function extOf(name: string) {
  if (!name.includes(".")) return "";
  return name.split(".").pop()!.toLowerCase();
}

export default function ClientPackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPkg, setUploadPkg] = useState<PackageRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<PackageRow[]>("/packages");
      setPackages(data);
    } catch {
      toast.error("Failed to load packages");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openUpload(pkg: PackageRow) {
    setUploadPkg(pkg);
    setFile(null);
    setUploadOpen(true);
  }

  async function submitUpload() {
    if (!uploadPkg || !file) {
      toast.error("Choose a file");
      return;
    }
    const ext = extOf(file.name);
    if (!ALLOWED.includes(ext)) {
      toast.error("File type not allowed");
      return;
    }
    const fd = new FormData();
    fd.append("package_id", String(uploadPkg.id));
    fd.append("file", file);
    setBusy(true);
    try {
      await api.post("/invoices/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Invoice uploaded successfully");
      setUploadOpen(false);
      setUploadPkg(null);
      setFile(null);
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      if (status === 413) {
        toast.error("File too large (max 10 MB)");
      } else {
        toast.error(typeof d === "string" ? d : "Upload failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function requestShipment(pkg: PackageRow) {
    setBusy(true);
    try {
      await api.patch(`/packages/${pkg.id}/request-shipment`);
      toast.success("Shipment requested to Aruba");
      await load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      toast.error(typeof d === "string" ? d : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  function latestStatus(pkg: PackageRow) {
    return pkg.latest_invoice?.status ?? null;
  }

  function showRejection(pkg: PackageRow) {
    return (
      pkg.status === "pending_invoice" &&
      pkg.latest_invoice?.status === "rejected"
    );
  }

  const filteredPackages = packages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">My Packages</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your packages, upload invoices, and track shipments.
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
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-panel/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all backdrop-blur-md"
          />
        </motion.div>
      </div>

      <div className="space-y-4">
        {filteredPackages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed border-white/20"
          >
            <Package className="h-16 w-16 text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-300">No packages found.</p>
            <p className="text-sm text-slate-500">Wait for the admin to assign a package to you.</p>
          </motion.div>
        ) : (
          filteredPackages.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.01, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-accent-cyan" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 max-w-lg line-clamp-2">
                    {p.description || "No description provided."}
                  </p>
                  
                  {showRejection(p) && (
                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-accent-error bg-accent-error/10 px-2.5 py-1 rounded-md border border-accent-error/20">
                      <span>Reason: {p.latest_invoice?.rejection_reason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:ml-auto">
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    {latestStatus(p) && (
                      <InvoiceStatusBadge status={latestStatus(p)!} />
                    )}
                    <PackageStatusBadge status={p.status} />
                  </div>
                  
                  {p.status === "pending_invoice" && (
                    <button
                      type="button"
                      onClick={() => openUpload(p)}
                      className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-accent to-accent-cyan px-4 py-2 text-sm font-semibold text-white hover:from-accent-cyan hover:to-accent shadow-neon-blue transition-all"
                    >
                      {showRejection(p) ? "Upload New Invoice" : "Upload Invoice"}
                    </button>
                  )}
                  {p.status === "invoice_uploaded" && (
                    <p className="text-xs text-slate-400 italic">Under review by admin</p>
                  )}
                  {p.status === "approved" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => requestShipment(p)}
                      className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-accent-success to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      Request Shipment
                    </button>
                  )}
                  {p.status === "shipment_requested" && (
                    <p className="text-xs text-slate-400 italic">Waiting for dispatch</p>
                  )}
                  {p.status === "shipped" && (
                    <p className="text-xs text-accent-success font-medium">Package is on its way!</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Modal
        open={uploadOpen}
        title={uploadPkg ? `Upload Invoice` : "Upload"}
        onClose={() => {
          setUploadOpen(false);
          setUploadPkg(null);
          setFile(null);
        }}
      >
        {uploadPkg && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-200">{uploadPkg.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Select the official invoice document</p>
            </div>
            
            <div 
              className="relative border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 hover:border-accent-cyan/50 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-accent-cyan/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="h-8 w-8 text-accent-cyan" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                {file ? file.name : "Click to browse or drag and drop"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Allowed: {ALLOWED.join(", ")} (Max 10MB)
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={ALLOWED.map((e) => `.${e}`).join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => {
                  setUploadOpen(false);
                  setUploadPkg(null);
                  setFile(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !file}
                onClick={submitUpload}
                className="rounded-lg bg-gradient-to-r from-accent to-accent-cyan px-6 py-2 text-sm font-bold text-white shadow-neon-blue hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {busy ? "Uploading..." : "Confirm Upload"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

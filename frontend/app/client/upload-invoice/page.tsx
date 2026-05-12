"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageOut } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import {
  UploadCloud, AlertTriangle, Check, X, FileText, Loader2,
} from "lucide-react";

export default function ClientUploadInvoicePage() {
  const [packages, setPackages] = useState<PackageOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const fetchEligible = useCallback(async () => {
    try {
      const { data } = await api.get<PackageOut[]>("/client/packages");
      const eligible = data.filter(
        (p) =>
          p.status === "ready_to_send" || p.status === "invoice_needs_review",
      );
      setPackages(eligible);
    } catch {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEligible();
  }, [fetchEligible]);

  const handleUpload = async (pkgId: number, file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "jpg", "jpeg", "png"].includes(ext)) {
      toast.error("Invalid file type. Only PDF, JPG, and PNG are accepted.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }

    setUploadingId(pkgId);
    const formData = new FormData();
    formData.append("invoice", file);

    try {
      await api.post(`/client/packages/${pkgId}/invoice`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Invoice uploaded successfully!");
      setPackages((prev) => prev.filter((p) => p.id !== pkgId));
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to upload invoice";
      toast.error(msg);
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-[#00C9B1]" /> Upload Invoice
        </h1>
        <p className="page-subtitle">
          Upload invoices for packages that are ready to send, or upload a revised invoice when the admin has requested changes. Accepted formats: PDF, JPG, PNG. Max 10MB.
        </p>
      </div>

      {packages.length === 0 ? (
        <EmptyState
          icon={<Check className="h-8 w-8 text-[#10B981]" />}
          title="No packages need invoices"
          description="All your packages already have invoices uploaded or are at a later stage."
        />
      ) : (
        <div className="space-y-6">
          {packages.map((pkg) => (
            <PackageUploadCard
              key={pkg.id}
              pkg={pkg}
              isUploading={uploadingId === pkg.id}
              onUpload={handleUpload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PackageUploadCard({
  pkg,
  isUploading,
  onUpload,
}: {
  pkg: PackageOut;
  isUploading: boolean;
  onUpload: (pkgId: number, file: File) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const hasAdminNote = pkg.invoice?.review_status === "needs_review" && pkg.invoice?.admin_notes;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-900">{pkg.contents_description}</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tracking: {pkg.tracking_number} • Weight: {pkg.weight} kg
            </p>
          </div>
          <StatusBadge status={pkg.status} />
        </div>
      </div>

      {hasAdminNote && (
        <div className="mx-5 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-800">Admin Review Note</p>
            <p className="text-sm text-amber-700 mt-1">{pkg.invoice?.admin_notes}</p>
          </div>
        </div>
      )}

      <div className="p-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
            dragOver
              ? "border-[#00C9B1] bg-[#00C9B1]/5"
              : file
              ? "border-[#00C9B1] bg-[#00C9B1]/5"
              : "border-slate-200 hover:border-[#00C9B1]/50"
          }`}
        >
          {file ? (
            <div className="text-center">
              <FileText className="w-10 h-10 text-[#00C9B1] mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-500 hover:underline mt-2 flex items-center gap-1 mx-auto"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          ) : (
            <div className="text-center">
              <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">
                Drag & drop your invoice here, or click to browse
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, JPG, PNG • Max 10MB
              </p>
            </div>
          )}
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={isUploading}
          />
        </div>

        {file && (
          <button
            onClick={() => onUpload(pkg.id, file)}
            disabled={isUploading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" /> Upload Invoice
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

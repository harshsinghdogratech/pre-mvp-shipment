"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import {
  InvoiceStatusBadge,
  PackageStatusBadge,
} from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";

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
      await api.post("/invoices/upload", fd);
      toast.success("Invoice uploaded");
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
      toast.success("Shipment requested");
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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">My Packages</h1>
      <p className="mt-1 text-sm text-slate-600">
        Upload invoices, track review, and request shipment when approved.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-6 py-3">Package</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Invoice</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  You have no packages assigned yet.
                </td>
              </tr>
            ) : (
              packages.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="max-w-xs px-6 py-3 text-slate-600">
                    {p.description || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <PackageStatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3">
                    {latestStatus(p) ? (
                      <InvoiceStatusBadge status={latestStatus(p)!} />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="space-y-2 px-6 py-3 align-top">
                    {p.status === "pending_invoice" && (
                      <button
                        type="button"
                        onClick={() => openUpload(p)}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        {showRejection(p) ? "Upload New Invoice" : "Upload Invoice"}
                      </button>
                    )}
                    {p.status === "invoice_uploaded" && (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Awaiting Review
                      </span>
                    )}
                    {p.status === "approved" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => requestShipment(p)}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        Request Shipment to Aruba
                      </button>
                    )}
                    {p.status === "shipment_requested" && (
                      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
                        Shipment Requested
                      </span>
                    )}
                    {p.status === "shipped" && (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                        Shipped
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={uploadOpen}
        title={uploadPkg ? `Upload invoice — ${uploadPkg.title}` : "Upload"}
        onClose={() => {
          setUploadOpen(false);
          setUploadPkg(null);
          setFile(null);
        }}
      >
        {uploadPkg && (
          <div className="space-y-4">
            {showRejection(uploadPkg) && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                <p className="font-semibold">Previous invoice rejected</p>
                {uploadPkg.latest_invoice?.rejection_reason && (
                  <p className="mt-2 whitespace-pre-wrap">
                    {uploadPkg.latest_invoice.rejection_reason}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Invoice file
              </label>
              <input
                type="file"
                accept={ALLOWED.map((e) => `.${e}`).join(",")}
                className="mt-1 w-full text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Allowed: {ALLOWED.join(", ")} — max 10 MB
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                disabled={busy}
                onClick={submitUpload}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

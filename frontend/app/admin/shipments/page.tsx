"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";

export default function AdminShipmentsPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    try {
      const { data } = await api.get<PackageRow[]>("/packages");
      setRows(data.filter((p) => p.status === "shipment_requested"));
    } catch {
      toast.error("Failed to load shipment requests");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markShipped(id: number) {
    setBusyId(id);
    try {
      await api.patch(`/packages/${id}/ship`);
      toast.success("Marked as shipped");
      await load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not update package");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Shipment Requests</h1>
      <p className="mt-1 text-sm text-slate-600">
        Packages waiting to be marked shipped to Aruba.
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No shipment requests right now.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="px-6 py-3 text-slate-700">
                    {p.client_name}
                    <div className="text-xs text-slate-500">{p.client_email}</div>
                  </td>
                  <td className="px-6 py-3">
                    <PackageStatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => markShipped(p.id)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busyId === p.id ? "Saving…" : "Mark Shipped"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

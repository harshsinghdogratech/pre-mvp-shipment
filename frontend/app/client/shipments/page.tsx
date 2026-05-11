"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";

export default function ClientShipmentsPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<PackageRow[]>("/packages");
        setRows(data.filter((p) => p.status === "shipped"));
      } catch {
        toast.error("Failed to load shipments");
      }
    })();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Shipment Status</h1>
      <p className="mt-1 text-sm text-slate-600">
        Packages that have been marked shipped by the admin.
      </p>
      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
            <tr>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                  No shipped packages yet. Approved packages can be requested for
                  shipment from My Packages.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-medium text-slate-900">{p.title}</td>
                  <td className="max-w-xs px-6 py-3 text-slate-600">
                    {p.description || "—"}
                  </td>
                  <td className="px-6 py-3">
                    <PackageStatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {new Date(p.updated_at).toLocaleString()}
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

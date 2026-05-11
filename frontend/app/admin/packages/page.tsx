"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { ClientOption, PackageRow } from "@/lib/types";
import {
  InvoiceStatusBadge,
  PackageStatusBadge,
} from "@/components/StatusBadge";

export default function AdminPackagesPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get<ClientOption[]>("/users/clients"),
        api.get<PackageRow[]>("/packages"),
      ]);
      setClients(cRes.data);
      setPackages(pRes.data);
      if (cRes.data.length && clientId === "") {
        setClientId(cRes.data[0].id);
      }
    } catch {
      toast.error("Failed to load data");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (clientId === "") {
      toast.error("Select a client");
      return;
    }
    setSaving(true);
    try {
      await api.post("/packages", {
        title: title.trim(),
        description: description.trim() || null,
        client_id: clientId,
      });
      toast.success("Package created");
      setTitle("");
      setDescription("");
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Could not create package";
      toast.error(typeof msg === "string" ? msg : "Could not create package");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Packages</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create packages and assign them to a client.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Create Package</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Client
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
            >
              {clients.length === 0 ? (
                <option value="">No clients</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving || clients.length === 0}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create Package"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">All Packages</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-600">
              <tr>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {packages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    No packages yet. Create one above to get started.
                  </td>
                </tr>
              ) : (
                packages.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {p.title}
                    </td>
                    <td className="px-6 py-3 text-slate-700">
                      {p.client_name}
                      <div className="text-xs text-slate-500">{p.client_email}</div>
                    </td>
                    <td className="px-6 py-3">
                      <PackageStatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-3">
                      {p.latest_invoice ? (
                        <InvoiceStatusBadge status={p.latest_invoice.status} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

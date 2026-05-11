"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { ClientOption, PackageRow } from "@/lib/types";
import {
  InvoiceStatusBadge,
  PackageStatusBadge,
} from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Package, Plus, Search, User } from "lucide-react";

export default function AdminPackagesPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

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
      toast.success("Package created successfully");
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

  const filteredPackages = packages.filter(p => 
    (p.title || "").toLowerCase().includes(search.toLowerCase()) || 
    (p.client_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Packages</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create new packages and assign them to clients.
        </p>
      </motion.div>

      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl glass-card p-6 sm:p-8"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-accent-cyan" />
          </div>
          <h2 className="text-xl font-bold text-white">Create New Package</h2>
        </div>
        
        <form onSubmit={onCreate} className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Title
            </label>
            <input
              required
              className="w-full rounded-xl bg-panelHover/50 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan"
              placeholder="e.g. Demo Electronics Shipment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="lg:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Assign Client
            </label>
            <select
              className="w-full rounded-xl bg-panelHover/50 border border-white/10 px-4 py-3 text-sm text-white outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan appearance-none"
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
            >
              {clients.length === 0 ? (
                <option value="">No clients available</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-panelHover text-white">
                    {c.name} ({c.email})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="lg:col-span-12 space-y-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
              Description (Optional)
            </label>
            <textarea
              className="w-full rounded-xl bg-panelHover/50 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan resize-none"
              placeholder="Enter package details..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="lg:col-span-12 flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || clients.length === 0}
              className="rounded-xl bg-gradient-to-r from-accent to-accent-cyan px-6 py-3 text-sm font-bold text-white shadow-neon-blue hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Creating..." : "Create Package"}
            </button>
          </div>
        </form>
      </motion.section>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-white">All Packages</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search packages or clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-panel/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-all backdrop-blur-md"
            />
          </div>
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
                <div className="flex items-start gap-4 flex-1">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center shadow-lg">
                    <Package className="h-6 w-6 text-accent-cyan" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-sm text-slate-300">{p.client_name}</span>
                      <span className="text-xs text-slate-500">({p.client_email})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 md:ml-auto">
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Package Status</span>
                    <PackageStatusBadge status={p.status} />
                  </div>
                  <div className="w-px h-12 bg-white/10 hidden md:block" />
                  <div className="flex flex-col items-start gap-2 min-w-[120px]">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Invoice Status</span>
                    {p.latest_invoice ? (
                      <InvoiceStatusBadge status={p.latest_invoice.status} />
                    ) : (
                      <span className="text-sm text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

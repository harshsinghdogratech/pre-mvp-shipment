"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Send, Ship, User, Search } from "lucide-react";

export default function AdminShipmentsPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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
      toast.success("Marked as shipped to Aruba");
      await load();
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response
        ?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not update package");
    } finally {
      setBusyId(null);
    }
  }

  const filteredRows = rows.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Shipment Requests</h1>
          <p className="mt-1 text-sm text-slate-400">
            Packages waiting to be marked shipped to Aruba.
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
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full sm:w-80 pl-10 pr-3 py-2 border border-white/10 rounded-xl bg-panel/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-warning/50 focus:border-accent-warning transition-all backdrop-blur-md"
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
            <Send className="h-16 w-16 text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-300">No shipment requests right now.</p>
            <p className="text-sm text-slate-500">Clients haven&apos;t requested any new shipments.</p>
          </motion.div>
        ) : (
          filteredRows.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.01, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel transition-all border-l-4 border-l-accent-purple"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-white/5 flex items-center justify-center shadow-lg">
                  <Send className="h-6 w-6 text-accent-purple" />
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
                  <PackageStatusBadge status={p.status} />
                  <span className="text-xs text-slate-500">Requested: {new Date(p.updated_at).toLocaleString()}</span>
                </div>
                
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => markShipped(p.id)}
                  className="rounded-xl bg-gradient-to-r from-accent to-accent-cyan px-6 py-2.5 text-sm font-bold text-white shadow-neon-blue hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <Ship className="w-4 h-4" />
                  {busyId === p.id ? "Processing..." : "Mark Shipped"}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

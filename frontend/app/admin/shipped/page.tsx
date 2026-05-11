"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Ship, Search, Package, User, Calendar, CheckCircle2 } from "lucide-react";

export default function AdminShippedPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const { data } = await api.get<PackageRow[]>("/packages");
      setRows(data.filter((p) => p.status === "shipped"));
    } catch {
      toast.error("Failed to load shipped packages");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredRows = rows.filter(r => 
    (r.title || "").toLowerCase().includes(search.toLowerCase()) || 
    (r.client_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Shipped Packages</h1>
        <p className="page-subtitle">History of all packages successfully shipped to Aruba.</p>
      </motion.div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search shipped history..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredRows.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500">No shipped packages recorded yet.</p>
          </div>
        ) : (
          filteredRows.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 hover:border-emerald-200 transition-colors flex flex-col md:flex-row md:items-center gap-4 group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Ship className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-none">{p.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {p.client_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Shipped on {new Date(p.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <PackageStatusBadge status={p.status} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

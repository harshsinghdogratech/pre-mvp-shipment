"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Ship, Search, Package, Calendar, MapPin, ArrowRight } from "lucide-react";

export default function ClientShipmentsPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const { data } = await api.get<PackageRow[]>("/packages");
      // Filter for packages that have requested shipment or are already shipped
      setRows(data.filter((p) => p.status === "shipment_requested" || p.status === "shipped"));
    } catch {
      toast.error("Failed to load shipment status");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((r) =>
    (r.title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-title">Shipment Status</h1>
        <p className="page-subtitle">Track your packages currently in transit to Aruba.</p>
      </motion.div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by package name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <Ship className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500">No active shipments found.</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                    p.status === "shipped" ? "bg-emerald-50" : "bg-indigo-50"
                  }`}>
                    {p.status === "shipped" ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Ship className="w-6 h-6 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{p.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 uppercase tracking-wider">
                        <MapPin className="w-3 h-3 text-primary" />
                        Destination: Aruba
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Updated {new Date(p.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <PackageStatusBadge status={p.status} />
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Status</p>
                  </div>
                  <div className="sm:hidden">
                    <PackageStatusBadge status={p.status} />
                  </div>
                </div>
              </div>
              
              {/* Progress Bar UI */}
              <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                  <span>Processing</span>
                  <span>In Transit</span>
                  <span>Delivered</span>
                </div>
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: p.status === "shipped" ? "100%" : "66%" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute h-full rounded-full ${
                      p.status === "shipped" ? "bg-emerald-500" : "bg-primary shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

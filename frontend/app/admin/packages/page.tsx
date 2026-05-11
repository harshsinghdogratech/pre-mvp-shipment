"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow, User } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { Plus, Search, Package, User as UserIcon, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client_id: "",
  });

  async function loadData() {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get<PackageRow[]>("/packages"),
        api.get<User[]>("/users/clients"),
      ]);
      setPackages(pRes.data);
      setClients(cRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.client_id) return toast.error("Please select a client");
    try {
      await api.post("/packages", {
        ...formData,
        client_id: parseInt(formData.client_id),
      });
      toast.success("Package created successfully");
      setShowCreate(false);
      setFormData({ title: "", description: "", client_id: "" });
      loadData();
    } catch {
      toast.error("Failed to create package");
    }
  }

  const filteredPackages = packages.filter(p => 
    (p.title || "").toLowerCase().includes(search.toLowerCase()) || 
    (p.client_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="page-title">Packages</h1>
          <p className="page-subtitle">Manage all incoming and active shipments.</p>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Package
        </motion.button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-white"
        >
          <h2 className="text-lg font-bold text-slate-900 mb-4">New Package</h2>
          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Package Title</label>
              <input
                required
                className="input-field"
                placeholder="e.g. Laptop Electronics"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Assign Client</label>
              <select
                required
                className="input-field"
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Items list or internal notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Package
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search by title or client name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Table-like List */}
      <div className="space-y-3">
        {filteredPackages.length === 0 ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center">
            <Package className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-slate-500">No packages found matching your search.</p>
          </div>
        ) : (
          filteredPackages.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card p-4 hover:border-primary/30 transition-colors flex flex-col md:flex-row md:items-center gap-4 group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Package className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-none">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      {p.client_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <PackageStatusBadge status={p.status} />
                <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

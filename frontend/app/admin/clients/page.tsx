"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { AdminClientListItem } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Users, Search, ArrowRight, Package } from "lucide-react";

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<AdminClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await api.get<AdminClientListItem[]>("/admin/clients");
        setClients(data);
      } catch {
        toast.error("Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.suite_number && c.suite_number.toLowerCase().includes(q))
    );
  });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Users className="h-6 w-6 text-[#00C9B1]" /> Clients
        </h1>
        <p className="page-subtitle">Manage client accounts and view their packages.</p>
      </div>

      <div className="card p-0 overflow-hidden bg-white">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </div>
            <input
              type="text"
              placeholder="Search by name, email or suite..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-11"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-700 font-semibold">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Suite Number</th>
                <th className="p-4 text-center">Packages</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <EmptyState
                      icon={<Users className="h-8 w-8" />}
                      title="No clients found"
                      description={search ? "Try adjusting your search query." : "There are no registered clients yet."}
                    />
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/admin/clients/${c.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 text-sm font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {c.email}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">
                      {(c.suite_number || "").trim() ? (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 text-slate-800">
                          {(c.suite_number || "").trim()}
                        </span>
                      ) : (
                        <span className="text-slate-500">Not assigned</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-xs">
                        <Package className="w-3 h-3" /> {c.package_count}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="btn-ghost flex items-center gap-2 ml-auto group-hover:bg-[#00C9B1] group-hover:text-white transition-colors">
                        View <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

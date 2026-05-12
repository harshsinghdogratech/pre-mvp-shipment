"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageOut } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Package, Search, ArrowRight, ArrowUpDown } from "lucide-react";

type SortField = "date_received" | "status" | "client_name";
type SortOrder = "asc" | "desc";

export default function AdminPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date_received");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await api.get<PackageOut[]>("/admin/packages");
        setPackages(data);
      } catch {
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedPackages = packages
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        p.tracking_number.toLowerCase().includes(q) ||
        p.contents_description.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "date_received") {
        aVal = new Date(a.date_received).getTime();
        bVal = new Date(b.date_received).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">All Packages</h1>
          <p className="page-subtitle">View and manage all packages in the system.</p>
        </div>
      </div>

      <div className="card min-w-0 overflow-hidden bg-white p-0">
        <div className="border-b border-slate-200 p-4">
          <div className="relative max-w-md min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </div>
            <input
              type="text"
              placeholder="Search by tracking number or contents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field !pl-11"
            />
          </div>
        </div>

        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-0 table-fixed border-collapse text-left md:table-auto md:min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="w-[18%] p-3 sm:p-4">Tracking Number</th>
                <th className="w-[16%] p-3 sm:p-4 md:cursor-pointer md:hover:bg-slate-100 md:transition-colors" onClick={() => handleSort("client_name")}>
                  <div className="flex items-center gap-1">
                    Client <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                </th>
                <th className="min-w-0 p-3 sm:p-4">Contents</th>
                <th className="w-[10%] p-3 sm:p-4">Weight</th>
                <th className="w-[14%] p-3 sm:p-4 md:cursor-pointer md:hover:bg-slate-100 md:transition-colors" onClick={() => handleSort("status")}>
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                </th>
                <th className="w-[14%] p-3 sm:p-4 md:cursor-pointer md:hover:bg-slate-100 md:transition-colors" onClick={() => handleSort("date_received")}>
                  <div className="flex items-center gap-1">
                    Date Received <ArrowUpDown className="h-3 w-3 shrink-0" />
                  </div>
                </th>
                <th className="w-[10%] p-3 text-right sm:p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedPackages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={<Package className="h-8 w-8" />}
                      title="No packages found"
                      description={search ? "Try adjusting your search query." : "No packages have been added yet."}
                    />
                  </td>
                </tr>
              ) : (
                filteredAndSortedPackages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-3 text-sm font-medium text-slate-900 sm:p-4">
                      <span className="line-clamp-2 break-words">{p.tracking_number}</span>
                    </td>
                    <td className="p-3 text-sm text-slate-600 sm:p-4">
                      <span className="line-clamp-2 break-words">{p.client_name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-600">
                        Suite: {p.client_suite ?? "Not assigned"}
                      </span>
                    </td>
                    <td className="min-w-0 p-3 text-sm text-slate-600 sm:p-4">
                      <span className="block truncate">{p.contents_description}</span>
                    </td>
                    <td className="p-3 text-sm text-slate-600 sm:p-4">
                      {p.weight} kg
                    </td>
                    <td className="p-3 sm:p-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-sm text-slate-600 sm:p-4">
                      {p.date_received}
                    </td>
                    <td className="p-3 text-right sm:p-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/packages/${p.id}`)}
                        className="btn-ghost ml-auto inline-flex max-w-full shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                      >
                        View <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
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

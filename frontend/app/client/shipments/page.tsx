"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { ClientShipmentItem } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EmptyState } from "@/components/EmptyState";
import { Ship, Calendar, Package } from "lucide-react";

const STATUS_ORDER: Record<string, number> = {
  shipped: 1,
  ready_for_pickup: 2,
  delivered: 3,
};

export default function ClientShipmentsPage() {
  const [items, setItems] = useState<ClientShipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const { data } = await api.get<ClientShipmentItem[]>("/client/shipments");
        const sorted = data.sort((a, b) => {
          const orderA = STATUS_ORDER[a.status] ?? 99;
          const orderB = STATUS_ORDER[b.status] ?? 99;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
        setItems(sorted);
      } catch {
        toast.error("Failed to load shipments");
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const grouped = items.reduce<Record<string, ClientShipmentItem[]>>((acc, item) => {
    if (!acc[item.status]) acc[item.status] = [];
    acc[item.status].push(item);
    return acc;
  }, {});

  const groupOrder = ["shipped", "ready_for_pickup", "delivered"];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <Ship className="h-6 w-6 text-[#00C9B1]" /> Shipment Status
        </h1>
        <p className="page-subtitle">Track your packages currently in transit or delivered.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Ship className="h-8 w-8" />}
          title="No shipments yet"
          description="Your shipped packages will appear here once an admin processes your ship request."
        />
      ) : (
        groupOrder.map((status) => {
          const group = grouped[status];
          if (!group || group.length === 0) return null;
          return (
            <div key={status} className="space-y-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={status} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {group.length} package{group.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {group.map((item) => (
                  <div
                    key={item.id}
                    className="card p-5 flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      status === "delivered"
                        ? "bg-[#059669]/10"
                        : status === "ready_for_pickup"
                        ? "bg-[#F97316]/10"
                        : "bg-[#06B6D4]/10"
                    }`}>
                      <Package className={`w-5 h-5 ${
                        status === "delivered"
                          ? "text-[#059669]"
                          : status === "ready_for_pickup"
                          ? "text-[#F97316]"
                          : "text-[#06B6D4]"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">
                        {item.contents_description}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tracking: {item.tracking_number}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.updated_at).toLocaleDateString()}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

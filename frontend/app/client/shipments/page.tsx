"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import type { PackageRow } from "@/lib/types";
import { PackageStatusBadge } from "@/components/StatusBadge";
import { motion } from "framer-motion";
import { Ship, CheckCircle2, FileText, Send, PackageSearch } from "lucide-react";

export default function ClientShipmentsPage() {
  const [rows, setRows] = useState<PackageRow[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<PackageRow[]>("/packages");
        // Show packages that are in progress or shipped
        setRows(data.filter((p) => ["approved", "shipment_requested", "shipped"].includes(p.status)));
      } catch {
        toast.error("Failed to load shipments");
      }
    })();
  }, []);

  const steps = [
    { key: "pending_invoice", label: "Package Created", icon: PackageSearch },
    { key: "invoice_uploaded", label: "Invoice Uploaded", icon: FileText },
    { key: "approved", label: "Invoice Approved", icon: CheckCircle2 },
    { key: "shipment_requested", label: "Shipment Requested", icon: Send },
    { key: "shipped", label: "Shipped", icon: Ship },
  ];

  const getStepIndex = (status: string) => {
    return steps.findIndex(s => s.key === status) ?? 0;
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white tracking-tight">Shipment Status</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track your package shipment progress.
        </p>
      </motion.div>

      <div className="space-y-6">
        {rows.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 glass-card rounded-2xl border-dashed border-white/20"
          >
            <Ship className="h-16 w-16 text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-300">No shipments found.</p>
            <p className="text-sm text-slate-500">Packages that are approved or shipped will appear here.</p>
          </motion.div>
        ) : (
          rows.map((p, index) => {
            const currentIndex = getStepIndex(p.status);
            
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl glass-panel p-6 sm:p-8"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan to-accent flex items-center justify-center shadow-neon-blue">
                      <Ship className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{p.title}</h3>
                      <p className="text-sm text-slate-400">Shipment to Aruba</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <PackageStatusBadge status={p.status} />
                    <span className="text-xs text-slate-500">Updated: {new Date(p.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="relative pl-6 sm:pl-10 py-4">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[33px] sm:left-[49px] top-8 bottom-8 w-0.5 bg-white/10" />
                  
                  <div className="space-y-8 relative">
                    {steps.map((step, i) => {
                      const isCompleted = i <= currentIndex;
                      const isCurrent = i === currentIndex;
                      const StepIcon = step.icon;
                      
                      let nodeColor = "bg-panel border-white/20 text-slate-500";
                      let glow = "";
                      
                      if (isCurrent) {
                        nodeColor = "bg-accent border-accent-cyan text-white";
                        glow = "shadow-neon-blue";
                      } else if (isCompleted) {
                        nodeColor = "bg-accent-success border-accent-success text-white";
                        glow = "shadow-[0_0_10px_rgba(16,185,129,0.5)]";
                      }

                      return (
                        <div key={step.key} className="flex items-start gap-6 relative z-10">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${nodeColor} ${glow}`}>
                            <StepIcon className="w-5 h-5" />
                          </div>
                          <div className="pt-2">
                            <h4 className={`text-sm font-bold ${isCompleted ? 'text-white' : 'text-slate-500'}`}>
                              {step.label}
                            </h4>
                            {isCurrent && (
                              <p className="text-xs text-accent-cyan mt-1">Current Status</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

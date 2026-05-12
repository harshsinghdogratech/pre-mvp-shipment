"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { AdminClientListItem } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PackagePlus, Save, ChevronDown, Search } from "lucide-react";

const DEMO_CLIENT_EMAIL = "client@ship2aruba.com";

function blockInvalidNumberKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
    e.preventDefault();
  }
}

export default function AddPackagePage() {
  const [clients, setClients] = useState<AdminClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const clientPickerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: "",
    width: "",
    height: "",
    length: "",
    weight: "",
    contents_description: "",
    client_id: "",
  });

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

  useEffect(() => {
    if (!clientMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (
        clientPickerRef.current &&
        !clientPickerRef.current.contains(e.target as Node)
      ) {
        setClientMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [clientMenuOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const length = parseFloat(formData.length);
    const width = parseFloat(formData.width);
    const height = parseFloat(formData.height);
    const weight = parseFloat(formData.weight);

    const checks: { label: string; value: number }[] = [
      { label: "Length", value: length },
      { label: "Width", value: width },
      { label: "Height", value: height },
      { label: "Weight", value: weight },
    ];
    for (const { label, value } of checks) {
      if (Number.isNaN(value) || value < 0) {
        toast.error(`${label} must be a number 0 or greater.`);
        return;
      }
    }

    if (!formData.client_id) {
      toast.error("Please select a client.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/admin/packages", {
        tracking_number: formData.tracking_number,
        width,
        height,
        length,
        weight,
        contents_description: formData.contents_description,
        client_id: parseInt(formData.client_id, 10),
      });
      toast.success("Package added successfully");
      setFormData({
        tracking_number: "",
        width: "",
        height: "",
        length: "",
        weight: "",
        contents_description: "",
        client_id: "",
      });
      setClientQuery("");
      setClientMenuOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add package");
    } finally {
      setSaving(false);
    }
  };

  const assignableClients = useMemo(() => {
    if (clients.some((c) => c.email === DEMO_CLIENT_EMAIL)) {
      return clients.filter((c) => c.email === DEMO_CLIENT_EMAIL);
    }
    return clients;
  }, [clients]);

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return assignableClients;
    return assignableClients.filter((c) => {
      const suite = (c.suite_number || "").toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        suite.includes(q)
      );
    });
  }, [assignableClients, clientQuery]);

  const selectedClient = useMemo(
    () =>
      assignableClients.find((c) => String(c.id) === formData.client_id),
    [assignableClients, formData.client_id],
  );

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title flex items-center gap-2">
          <PackagePlus className="h-6 w-6 text-[#00C9B1]" /> Add Package
        </h1>
        <p className="page-subtitle">Register a new package that has arrived at the suite.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Tracking Number
            </label>
            <input
              required
              type="text"
              name="tracking_number"
              value={formData.tracking_number}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. 1Z9999999999999999"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Client
            </label>
            <div className="relative" ref={clientPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setClientMenuOpen((o) => !o);
                }}
                className="input-field flex w-full items-center justify-between gap-2 bg-white text-left"
                aria-expanded={clientMenuOpen}
                aria-haspopup="listbox"
              >
                <span
                  className={
                    selectedClient ? "text-slate-900 truncate" : "text-slate-500"
                  }
                >
                  {selectedClient
                    ? selectedClient.email
                    : "Select a client…"}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
              </button>

              {clientMenuOpen && (
                <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                    <Search className="h-4 w-4 shrink-0 text-slate-500" />
                    <input
                      type="text"
                      className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm text-slate-900 outline-none placeholder:text-slate-500"
                      placeholder="Search by email, name, or suite…"
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <ul
                    className="max-h-52 overflow-y-auto py-1"
                    role="listbox"
                  >
                    {filteredClients.map((c) => (
                      <li key={c.id} role="option">
                        <button
                          type="button"
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-50"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              client_id: String(c.id),
                            }));
                            setClientMenuOpen(false);
                            setClientQuery("");
                          }}
                        >
                          <div className="text-sm font-semibold text-slate-900">
                            {c.email}
                          </div>
                          <div className="text-xs text-slate-600">
                            {c.name}
                            {c.suite_number ? ` · ${c.suite_number}` : ""}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {filteredClients.length === 0 && (
                    <p className="px-3 py-4 text-center text-sm text-slate-500">
                      No clients match your search.
                    </p>
                  )}
                </div>
              )}
            </div>
            {selectedClient && (
              <p className="mt-1 text-xs text-slate-600">
                {selectedClient.name}
                {selectedClient.suite_number
                  ? ` · Suite ${selectedClient.suite_number}`
                  : ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Dimensions (cm)
            </label>
            <p className="text-xs text-slate-600 mb-1.5">Length × width × height — each must be 0 or greater.</p>
            <div className="flex items-center gap-2">
              <input
                required
                type="number"
                step="0.1"
                min={0}
                name="length"
                placeholder="L"
                value={formData.length}
                onChange={handleChange}
                onKeyDown={blockInvalidNumberKeys}
                className="input-field"
              />
              <span className="text-slate-500">×</span>
              <input
                required
                type="number"
                step="0.1"
                min={0}
                name="width"
                placeholder="W"
                value={formData.width}
                onChange={handleChange}
                onKeyDown={blockInvalidNumberKeys}
                className="input-field"
              />
              <span className="text-slate-500">×</span>
              <input
                required
                type="number"
                step="0.1"
                min={0}
                name="height"
                placeholder="H"
                value={formData.height}
                onChange={handleChange}
                onKeyDown={blockInvalidNumberKeys}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Weight (kg)
            </label>
            <p className="text-xs text-slate-600 mb-1.5">Must be 0 or greater.</p>
            <input
              required
              type="number"
              step="0.01"
              min={0}
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              onKeyDown={blockInvalidNumberKeys}
              className="input-field"
              placeholder="e.g. 2.5"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-800 mb-1.5">
              Contents Description
            </label>
            <textarea
              required
              name="contents_description"
              value={formData.contents_description}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Describe the items in the package..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Package
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

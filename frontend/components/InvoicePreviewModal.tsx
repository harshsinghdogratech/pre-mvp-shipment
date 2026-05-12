"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/lib/useScrollLock";
import {
  Download,
  ExternalLink,
  FileWarning,
  Loader2,
  X,
} from "lucide-react";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  blobUrl: string | null;
  mime: string;
  loading: boolean;
  error: boolean;
}

function canEmbed(mime: string): boolean {
  if (mime === "application/pdf") return true;
  return mime.startsWith("image/");
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  fileName,
  blobUrl,
  mime,
  loading,
  error,
}: InvoicePreviewModalProps) {
  const safeName = fileName?.trim() || "invoice";

  useScrollLock(isOpen);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = safeName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleOpenTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="invoice-preview-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            role="presentation"
            className="absolute inset-0 touch-none overscroll-none bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <h2 className="min-w-0 truncate text-sm font-semibold text-slate-900 sm:text-base">
                  {safeName}
                </h2>
                <div className="flex shrink-0 items-center gap-2">
                  {blobUrl && !error && !loading && (
                    <>
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenTab}
                        className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">New tab</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="min-h-[50vh] flex-1 bg-slate-100">
                {loading && (
                  <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="h-10 w-10 animate-spin text-[#00C9B1]" />
                    <p className="text-sm">Loading invoice…</p>
                  </div>
                )}
                {!loading && error && (
                  <div className="flex h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center text-slate-600">
                    <FileWarning className="h-10 w-10 text-amber-500" />
                    <p className="text-sm">Unable to load this file.</p>
                  </div>
                )}
                {!loading && !error && blobUrl && canEmbed(mime) && (
                  mime === "application/pdf" ? (
                    <iframe
                      title={safeName}
                      src={blobUrl}
                      className="h-[70vh] w-full border-0 bg-white"
                    />
                  ) : (
                    <div className="flex h-[70vh] items-center justify-center overflow-auto p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={blobUrl}
                        alt={safeName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )
                )}
                {!loading && !error && blobUrl && !canEmbed(mime) && (
                  <div className="flex h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
                    <p className="text-sm text-slate-600">
                      Preview is not available for this file type ({mime || "unknown"}).
                      Use Download or Open in new tab.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownload}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" /> Download
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenTab}
                        className="btn-ghost flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" /> Open in new tab
                      </button>
                    </div>
                  </div>
                )}
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

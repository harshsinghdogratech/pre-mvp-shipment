"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useScrollLock } from "@/lib/useScrollLock";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  useScrollLock(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            role="presentation"
            className="absolute inset-0 touch-none overscroll-none bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoading && onCancel()}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl"
          >
              <h3 className="text-lg font-bold leading-6 text-slate-900 mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-500 mb-6">{message}</p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none disabled:opacity-50"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-lg border border-transparent bg-[#00C9B1] px-4 py-2 text-sm font-medium text-white hover:bg-[#00b09b] focus:outline-none disabled:opacity-50"
                  onClick={onConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : confirmText}
                </button>
              </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

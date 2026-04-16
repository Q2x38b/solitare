import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 12, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 8, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="relative w-full max-w-[420px] rounded-2xl p-6 bg-[color:var(--bg-2)] border border-[color:var(--rule)] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-[22px] leading-none">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-full hover:bg-[color:color-mix(in_oklab,var(--fg)_8%,transparent)] focus-ring"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="hair mb-5" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

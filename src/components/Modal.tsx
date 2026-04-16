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
          // System-announced state change: ease, not spring.
          // Entrance ease-out (soft arrival), exit ease-in (get out of the way).
          transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div
            className="absolute inset-0 bg-black/70"
            style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            // Scale from 0.96 (proportional to trigger size), not 0
            initial={{ y: 6, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 4, scale: 0.98, opacity: 0 }}
            transition={{
              duration: 0.18,
              ease: [0.2, 0.8, 0.2, 1],
              opacity: { duration: 0.14 },
            }}
            className="relative w-full max-w-[400px] rounded-[22px] p-6 bg-[color:var(--surface)] border border-[color:var(--line)] shadow-2xl"
            style={{ willChange: "transform, opacity" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-semibold tracking-tight leading-none"
                style={{ fontSize: "clamp(16px, 1.4vw, 18px)" }}
              >
                {title}
              </h2>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
                className="icon-btn w-8 h-8 grid place-items-center rounded-full text-[color:var(--fg-soft)] focus-ring"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

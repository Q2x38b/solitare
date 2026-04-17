import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { useMeasure } from "../hooks/useMeasure";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: Props) {
  const [ref, bounds] = useMeasure<HTMLDivElement>();

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <motion.section
      aria-hidden={!open}
      initial={false}
      animate={{ height: open && bounds.height > 0 ? bounds.height : 0 }}
      transition={{
        type: "spring",
        stiffness: 520,
        damping: 44,
        mass: 0.7,
      }}
      className="overflow-hidden border-t border-[color:var(--line)] bg-[color:var(--surface)]"
      style={{ willChange: "height" }}
    >
      <div ref={ref}>
        {open && (
          <div
            role="dialog"
            aria-modal="false"
            aria-label={title}
            className="px-6 pt-5 pb-6 max-w-[640px] mx-auto"
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
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
            )}
            {children}
          </div>
        )}
      </div>
    </motion.section>
  );
}

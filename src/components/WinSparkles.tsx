import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/useReducedMotion";

export function WinSparkles({ show }: { show: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true,
  );
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const sparkles = useMemo(
    () =>
      Array.from({ length: 36 }).map(() => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        size: 2 + Math.random() * 5,
        dx: (Math.random() - 0.5) * 180,
        dur: 1.6 + Math.random() * 1.6,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [show],
  );

  const run = show && visible && !reduced;

  return (
    <AnimatePresence>
      {run && (
        <motion.div
          className="fixed inset-0 z-30 overflow-hidden pointer-events-none"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {sparkles.map((s, i) => (
            <motion.div
              key={i}
              className="sparkle absolute"
              style={{ left: `${s.x}%`, top: "-20px", width: s.size, height: s.size }}
              initial={{ y: -20, x: 0, opacity: 0 }}
              animate={{
                y: ["-20px", "110vh"],
                x: [0, s.dx],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: s.dur,
                delay: s.delay,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

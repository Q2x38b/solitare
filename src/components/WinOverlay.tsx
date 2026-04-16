import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { usePrefersReducedMotion } from "../hooks/useReducedMotion";

interface Props {
  show: boolean;
  elapsed: number;
  moves: number;
  score: number;
  onNewGame: () => void;
  onClose: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function WinOverlay({ show, elapsed, moves, score, onNewGame, onClose }: Props) {
  const reduced = usePrefersReducedMotion();

  // Pause looping animations when tab is hidden (Interfaces: optimizations)
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

  const runSparkles = show && visible && !reduced;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div
            className="absolute inset-0 bg-black/65"
            style={{ backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
            onClick={onClose}
            aria-hidden
          />

          {/* Sparkles — pointer-events: none; paused when tab hidden or reduced-motion */}
          {runSparkles && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
              {sparkles.map((s, i) => (
                <motion.div
                  key={i}
                  className="sparkle absolute"
                  style={{
                    left: `${s.x}%`,
                    top: "-20px",
                    width: s.size,
                    height: s.size,
                  }}
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
            </div>
          )}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Victory"
            initial={{ y: 10, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative mx-auto mt-[16vh] max-w-[400px] rounded-[22px] p-7 bg-[color:var(--surface)] border border-[color:var(--line)] shadow-2xl text-center"
          >
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[color:var(--accent)]">
              Victory
            </div>
            <h2
              className="mt-3 tracking-tight font-semibold"
              style={{
                fontSize: "clamp(30px, 4.2vw, 44px)",
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
              }}
            >
              Well played.
            </h2>
            <div className="hair my-6" />
            <div className="grid grid-cols-3 gap-2">
              <Cell label="Time" value={formatTime(elapsed)} />
              <Cell label="Moves" value={moves} />
              <Cell label="Score" value={score} />
            </div>
            <div className="mt-6 flex gap-2 justify-center">
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
                className="px-4 h-10 pill text-[13px] font-semibold focus-ring"
              >
                View board
              </motion.button>
              <motion.button
                onClick={onNewGame}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
                className="px-5 h-10 pill-accent text-[13px] font-semibold focus-ring"
              >
                New deal
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[color:var(--surface-2)] rounded-2xl p-3 border border-[color:var(--line)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--fg-dim)]">
        {label}
      </div>
      <div className="tabular text-[19px] font-semibold mt-1.5 leading-none">{value}</div>
    </div>
  );
}

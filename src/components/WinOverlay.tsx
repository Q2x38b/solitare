import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

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
  const sparkles = useMemo(
    () =>
      Array.from({ length: 40 }).map(() => ({
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        size: 2 + Math.random() * 5,
        dx: (Math.random() - 0.5) * 180,
        dur: 1.6 + Math.random() * 1.6,
      })),
    [show],
  );
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-40 pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[3px]" onClick={onClose} />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
          </div>

          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative mx-auto mt-[16vh] max-w-[400px] rounded-[22px] p-7 bg-[color:var(--surface)] border border-[color:var(--line)] shadow-2xl text-center"
          >
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[color:var(--accent)]">
              Victory
            </div>
            <div className="text-[40px] leading-[1.02] mt-3 tracking-tight font-semibold">
              Well played.
            </div>
            <div className="hair my-6" />
            <div className="grid grid-cols-3 gap-2">
              <Cell label="Time" value={formatTime(elapsed)} />
              <Cell label="Moves" value={moves} />
              <Cell label="Score" value={score} />
            </div>
            <div className="mt-6 flex gap-2 justify-center">
              <button
                onClick={onClose}
                className="px-4 h-10 pill text-[13px] font-semibold focus-ring"
              >
                View board
              </button>
              <button
                onClick={onNewGame}
                className="px-5 h-10 pill-accent text-[13px] font-semibold focus-ring"
              >
                New deal
              </button>
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

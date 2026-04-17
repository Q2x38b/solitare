import { motion } from "motion/react";

interface Props {
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

export function WinPanel({ elapsed, moves, score, onNewGame, onClose }: Props) {
  return (
    <div className="text-center py-2">
      <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[color:var(--accent)]">
        Victory
      </div>
      <h2
        className="mt-2 tracking-tight font-semibold"
        style={{
          fontSize: "clamp(26px, 3.4vw, 36px)",
          lineHeight: 1.02,
          letterSpacing: "-0.03em",
        }}
      >
        Well played.
      </h2>
      <div className="hair my-5" />
      <div className="grid grid-cols-3 gap-2 max-w-[360px] mx-auto">
        <Cell label="Time" value={formatTime(elapsed)} />
        <Cell label="Moves" value={moves} />
        <Cell label="Score" value={score} />
      </div>
      <div className="mt-5 flex gap-2 justify-center">
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
    </div>
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

import type { Stats } from "../game/types";

interface Props {
  stats: Stats;
}

function fmtTime(s: number | null) {
  if (s === null) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function StatsPanel({ stats }: Props) {
  const pct = stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Cell label="Played" value={stats.gamesPlayed} />
        <Cell label="Won" value={stats.gamesWon} />
        <Cell label="Win %" value={`${pct}%`} />
      </div>
      <div className="hair" />
      <div className="grid grid-cols-2 gap-3">
        <Cell label="Best time" value={fmtTime(stats.bestTimeSec)} />
        <Cell label="Best moves" value={stats.bestMoves ?? "—"} />
        <Cell label="Best score" value={stats.bestScore ?? "—"} />
        <Cell label="Streak" value={`${stats.currentStreak} / ${stats.longestStreak}`} />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[color:var(--surface-2)] rounded-2xl p-3.5 border border-[color:var(--line)]">
      <div className="text-[10.5px] uppercase tracking-[0.14em] font-medium text-[color:var(--fg-dim)]">
        {label}
      </div>
      <div className="tabular text-[20px] font-semibold mt-2 leading-none">{value}</div>
    </div>
  );
}

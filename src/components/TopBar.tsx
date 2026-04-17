import { motion } from "motion/react";
import clsx from "clsx";

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col items-start leading-none">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--fg-dim)] font-medium">
        {label}
      </div>
      <div className="tabular text-[17px] mt-1.5 font-semibold text-[color:var(--fg)]">
        {value}
      </div>
    </div>
  );
}

interface Props {
  elapsed: number;
  moves: number;
  score: number;
  passes: number;
  drawCount: 1 | 2 | 3;
  onNewGame: () => void;
  onRestart: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onHint: () => void;
  onSettings: () => void;
  onStats: () => void;
  theme: "felt" | "paper";
  onToggleTheme: () => void;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function TopBar({
  elapsed,
  moves,
  score,
  passes,
  drawCount,
  onNewGame,
  onRestart,
  onUndo,
  canUndo,
  onHint,
  onSettings,
  onStats,
  theme,
  onToggleTheme,
  autoPlay,
  onToggleAutoPlay,
}: Props) {
  return (
    <header className="relative z-20 px-5 pt-4 pb-3">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1
            className="leading-none font-semibold tracking-tight"
            style={{ fontSize: "clamp(15px, 1.2vw, 18px)", letterSpacing: "-0.02em" }}
          >
            Solitaire
          </h1>
          <div className="h-4 w-px bg-[color:var(--line)]" aria-hidden />
          <div className="text-[11px] font-medium tracking-wide uppercase text-[color:var(--fg-dim)]">
            Klondike · draw {drawCount}
          </div>
        </div>

        <div className="flex items-center gap-7">
          <Stat label="Time" value={formatTime(elapsed)} />
          <Stat label="Moves" value={moves} />
          <Stat label="Passes" value={passes} />
          <Stat label="Score" value={score} />
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            onClick={onToggleAutoPlay}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
            aria-pressed={autoPlay}
            title={autoPlay ? "Stop auto-play (P)" : "Start auto-play (P)"}
            aria-label={autoPlay ? "Stop auto-play" : "Start auto-play"}
            className={clsx(
              "h-9 px-3 rounded-full inline-flex items-center gap-1.5 focus-ring text-[12.5px] font-semibold transition",
              autoPlay
                ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                : "pill",
            )}
          >
            {autoPlay ? <PauseIcon /> : <PlayIcon />}
            <span className="tracking-tight">{autoPlay ? "Auto" : "Auto"}</span>
            {autoPlay && (
              <span
                aria-hidden
                className="ml-0.5 w-1.5 h-1.5 rounded-full bg-[color:var(--accent-ink)] animate-pulse"
              />
            )}
          </motion.button>
          <IconBtn onClick={onUndo} disabled={!canUndo} label="Undo (Z)">
            <UndoIcon />
          </IconBtn>
          <IconBtn onClick={onHint} label="Hint (H)">
            <HintIcon />
          </IconBtn>
          <IconBtn
            onClick={onToggleTheme}
            label={theme === "felt" ? "Switch to light (T)" : "Switch to dark (T)"}
          >
            {theme === "felt" ? <SunIcon /> : <MoonIcon />}
          </IconBtn>
          <IconBtn onClick={onStats} label="Statistics (I)">
            <StatsIcon />
          </IconBtn>
          <IconBtn onClick={onSettings} label="Settings (,)">
            <GearIcon />
          </IconBtn>
          <div className="w-px h-5 bg-[color:var(--line)] mx-1.5" aria-hidden />
          <IconBtn onClick={onRestart} label="Restart same deal (R)">
            <RestartIcon />
          </IconBtn>
          <motion.button
            onClick={onNewGame}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
            className={clsx(
              "ml-1 px-4 h-9 pill-accent text-[13px] font-semibold focus-ring",
              "tracking-tight",
            )}
          >
            New deal
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  onClick,
  children,
  label,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      // Tooltip (title) stripped when disabled — disabled buttons aren't in tab
      // order so the tooltip would never reach keyboard users (Interfaces #6).
      title={disabled ? undefined : label}
      aria-label={label}
      aria-disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
      className={clsx(
        "icon-btn w-9 h-9 rounded-full grid place-items-center focus-ring",
        "text-[color:var(--fg-soft)]",
        disabled && "opacity-30 pointer-events-none",
      )}
    >
      {children}
    </motion.button>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10H9" />
    </svg>
  );
}
function HintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.5 1 2.3h6c0-.8.3-1.7 1-2.3A7 7 0 0 0 12 2Z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A8 8 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
function StatsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 5.5a1 1 0 0 1 1.52-.86l11 6.5a1 1 0 0 1 0 1.72l-11 6.5A1 1 0 0 1 7 18.5z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1.2" />
      <rect x="14" y="5" width="4" height="14" rx="1.2" />
    </svg>
  );
}

import { motion } from "motion/react";
import clsx from "clsx";

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="flex flex-col items-start leading-none">
      <div className="text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.14em] text-[color:var(--fg-dim)] font-medium">
        {label}
      </div>
      <div className="tabular text-[15px] sm:text-[17px] mt-1 sm:mt-1.5 font-semibold text-[color:var(--fg)]">
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
    <header className="relative z-20 px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3">
      <div className="flex items-center justify-between gap-3 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-4 sm:gap-7 flex-wrap">
          <Stat label="Time" value={formatTime(elapsed)} />
          <Stat label="Moves" value={moves} />
          <Stat label="Passes" value={passes} />
          <Stat label="Score" value={score} />
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-end">
          <motion.button
            onClick={onToggleAutoPlay}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
            aria-pressed={autoPlay}
            title={autoPlay ? "Stop auto-play (P)" : "Start auto-play (P)"}
            aria-label={autoPlay ? "Stop auto-play" : "Start auto-play"}
            className={clsx(
              "h-9 px-2.5 sm:px-3 rounded-full inline-flex items-center gap-1.5 focus-ring text-[12.5px] font-semibold transition",
              autoPlay
                ? "bg-[color:var(--accent)] text-[color:var(--accent-ink)]"
                : "pill",
            )}
          >
            {autoPlay ? <PauseIcon /> : <PlayIcon />}
            <span className="tracking-tight hidden sm:inline">Auto</span>
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
          <div className="hidden sm:block w-px h-5 bg-[color:var(--line)] mx-1.5" aria-hidden />
          <IconBtn onClick={onRestart} label="Restart same deal (R)">
            <RestartIcon />
          </IconBtn>
          <motion.button
            onClick={onNewGame}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
            className={clsx(
              "ml-1 px-3 sm:px-4 h-9 pill-accent text-[12.5px] sm:text-[13px] font-semibold focus-ring",
              "tracking-tight whitespace-nowrap",
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
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <polygon
        points="4.367 3.044 3.771 6.798 7.516 6.145 4.367 3.044"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        fill="currentColor"
      />
      <polyline
        points="10 7 10 10 12 12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m5,5.101c1.271-1.297,3.041-2.101,5-2.101,3.866,0,7,3.134,7,7s-3.134,7-7,7c-3.526,0-6.444-2.608-6.929-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
function HintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <polygon
        points="11 3 9 9 16 9 9 17 11 11 4 11 11 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        fill="currentColor"
      />
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
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden>
      <rect x="12.5" y="2" width="4" height="14" rx="1.75" ry="1.75" />
      <rect x="7" y="7" width="4" height="9" rx="1.75" ry="1.75" />
      <rect x="1.5" y="11" width="4" height="5" rx="1.75" ry="1.75" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <line x1="3" y1="6" x2="10" y2="6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="12.5" cy="6" r="2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="15" y1="6" x2="17" y2="6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="17" y1="14" x2="10" y2="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx="7.5" cy="14" r="2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <line x1="5" y1="14" x2="3" y2="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="m5,5.101c1.271-1.297,3.041-2.101,5-2.101,3.866,0,7,3.134,7,7s-3.134,7-7,7c-2.792,0-5.203-1.635-6.326-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <polygon
        points="4.367 3.044 3.771 6.798 7.516 6.145 4.367 3.044"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        fill="currentColor"
      />
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

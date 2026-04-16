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
  drawCount: 1 | 3;
  onNewGame: () => void;
  onRestart: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onHint: () => void;
  onSettings: () => void;
  onStats: () => void;
  theme: "felt" | "paper";
  onToggleTheme: () => void;
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
}: Props) {
  return (
    <header className="relative z-20 px-5 pt-4 pb-3">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-[18px] leading-none font-semibold tracking-tight">
            Solitaire
          </div>
          <div className="h-4 w-px bg-[color:var(--line)]" />
          <div className="text-[11px] font-medium tracking-wide uppercase text-[color:var(--fg-dim)]">
            Klondike · draw {drawCount}
          </div>
        </div>

        <div className="flex items-center gap-7">
          <Stat label="Time" value={formatTime(elapsed)} />
          <Stat label="Moves" value={moves} />
          <Stat label="Score" value={score} />
        </div>

        <div className="flex items-center gap-1.5">
          <IconBtn onClick={onUndo} disabled={!canUndo} hint="Undo · Z">
            <UndoIcon />
          </IconBtn>
          <IconBtn onClick={onHint} hint="Hint · H">
            <HintIcon />
          </IconBtn>
          <IconBtn onClick={onToggleTheme} hint={theme === "felt" ? "Light · T" : "Dark · T"}>
            {theme === "felt" ? <SunIcon /> : <MoonIcon />}
          </IconBtn>
          <IconBtn onClick={onStats} hint="Stats · I">
            <StatsIcon />
          </IconBtn>
          <IconBtn onClick={onSettings} hint="Settings · ,">
            <GearIcon />
          </IconBtn>
          <div className="w-px h-5 bg-[color:var(--line)] mx-1.5" />
          <IconBtn onClick={onRestart} hint="Restart · R">
            <RestartIcon />
          </IconBtn>
          <button
            onClick={onNewGame}
            className={clsx(
              "ml-1 px-4 h-9 pill-accent text-[13px] font-semibold focus-ring",
              "tracking-tight",
            )}
          >
            New deal
          </button>
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  onClick,
  children,
  hint,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={hint}
      aria-label={hint}
      className={clsx(
        "w-9 h-9 rounded-full grid place-items-center focus-ring transition",
        "text-[color:var(--fg-soft)] hover:text-[color:var(--fg)] hover:bg-[color:var(--surface)]",
        disabled && "opacity-30 pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function UndoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10H9" />
    </svg>
  );
}
function HintIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.5 1 2.3h6c0-.8.3-1.7 1-2.3A7 7 0 0 0 12 2Z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A8 8 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}
function StatsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

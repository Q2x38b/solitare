import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Board } from "./components/Board";
import { TopBar } from "./components/TopBar";
import { Modal } from "./components/Modal";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { WinPanel } from "./components/WinPanel";
import { WinSparkles } from "./components/WinSparkles";
import { useGame } from "./hooks/useGame";
import { useSound } from "./hooks/useSound";
import { isGameStuck } from "./game/engine";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular px-1.5 h-5 inline-flex items-center rounded-md bg-[color:var(--surface)] border border-[color:var(--line)] text-[10.5px] font-semibold text-[color:var(--fg-soft)]">
        {children}
      </span>
    </span>
  );
}

export default function App() {
  const g = useGame();
  const play = useSound(g.settings.sound);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showStuck, setShowStuck] = useState(false);
  // Track whether we've surfaced the stuck popup for this particular seed
  // so dismissing it doesn't re-trigger on the next render.
  const stuckAckedSeedRef = useRef<number | null>(null);

  // Apply theme with a one-frame "disable transitions" guard so hover/focus
  // transitions don't briefly flash during the color swap.
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-disable-transitions", "");
    html.dataset.theme = g.settings.theme === "paper" ? "light" : "dark";
    // Force style flush then remove the guard next frame
    void html.offsetHeight;
    const id = window.requestAnimationFrame(() => {
      html.removeAttribute("data-disable-transitions");
    });
    return () => cancelAnimationFrame(id);
  }, [g.settings.theme]);

  useEffect(() => {
    if (g.state.won) {
      setShowWin(true);
      play("win");
    }
  }, [g.state.won, play]);

  // Surface the "no more moves" popup when the game is definitively stuck.
  // Re-arm the guard whenever a new seed is dealt so the next game can also
  // detect a dead end.
  useEffect(() => {
    if (stuckAckedSeedRef.current !== g.state.seed) {
      stuckAckedSeedRef.current = null;
    }
    if (
      isGameStuck(g.state) &&
      stuckAckedSeedRef.current !== g.state.seed &&
      !g.autoPlay
    ) {
      setShowStuck(true);
      g.setAutoPlay(false);
    }
  }, [g.state, g.autoPlay, g]);

  const onNewGame = useCallback(() => {
    play("shuffle");
    g.setAutoPlay(false);
    g.newRound();
    setShowWin(false);
    setShowStuck(false);
    setShowSettings(false);
  }, [g, play]);

  const onRestart = useCallback(() => {
    play("shuffle");
    g.setAutoPlay(false);
    g.restart();
    setShowWin(false);
    setShowStuck(false);
  }, [g, play]);

  const onUndo = useCallback(() => {
    play("click");
    g.setAutoPlay(false);
    g.undo();
  }, [g, play]);

  const onHint = useCallback(() => {
    play("click");
    g.hint();
    setTimeout(() => g.clearHint(), 1600);
  }, [g, play]);

  const onToggleTheme = useCallback(() => {
    g.updateSettings({ theme: g.settings.theme === "felt" ? "paper" : "felt" });
  }, [g]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          onUndo();
        }
        return;
      }
      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          play(g.state.stock.length > 0 ? "flip" : "shuffle");
          g.draw();
          break;
        case "z":
          onUndo();
          break;
        case "h":
          onHint();
          break;
        case "n":
          onNewGame();
          break;
        case "r":
          onRestart();
          break;
        case "t":
          onToggleTheme();
          break;
        case "i":
          setShowStats((v) => !v);
          break;
        case ",":
          setShowSettings((v) => !v);
          break;
        case "a":
          g.autoComplete();
          break;
        case "p":
          play("click");
          g.setAutoPlay(!g.autoPlay);
          break;
        case "escape":
          setShowSettings(false);
          setShowStats(false);
          setShowWin(false);
          break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [g, onUndo, onHint, onNewGame, onRestart, onToggleTheme, play]);

  return (
    <div className="table-surface relative w-screen h-screen flex flex-col">
      <TopBar
        elapsed={g.elapsed}
        moves={g.state.moves}
        score={g.state.score}
        passes={g.state.passes}
        onNewGame={onNewGame}
        onRestart={onRestart}
        onUndo={onUndo}
        canUndo={g.undoStack.length > 0 && !g.isAutoRunning && !g.autoPlay}
        onHint={onHint}
        onSettings={() => setShowSettings(true)}
        onStats={() => setShowStats(true)}
        theme={g.settings.theme}
        onToggleTheme={onToggleTheme}
        autoPlay={g.autoPlay}
        onToggleAutoPlay={() => {
          play("click");
          g.setAutoPlay(!g.autoPlay);
        }}
      />
      <main className="relative flex-1 min-h-0">
        <Board
          state={g.state}
          showHint={g.showHint}
          onDraw={g.draw}
          onMove={(from, to, count) => g.attempt({ from, to, count })}
          onAuto={(from, count) => g.attemptAuto(from, count)}
          onAutoComplete={g.autoComplete}
          isAutoRunning={g.isAutoRunning}
          play={play}
        />
      </main>

      <footer className="px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between text-[10.5px] sm:text-[11px] tracking-wide text-[color:var(--fg-dim)] font-medium">
        <div className="hidden sm:block">
          Double-click to auto-move · drag stacks to build down · K starts an empty column
        </div>
        <div className="sm:hidden text-[10px]">Double-tap · drag to build · K opens empties</div>
        <div className="hidden md:flex items-center gap-3">
          <Kbd>Space</Kbd> draw
          <Kbd>Z</Kbd> undo
          <Kbd>H</Kbd> hint
          <Kbd>A</Kbd> auto
          <Kbd>N</Kbd> new
        </div>
      </footer>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <SettingsPanel
          settings={g.settings}
          onChange={(p) => g.updateSettings(p)}
          onNewGame={onNewGame}
        />
      </Modal>
      <Modal open={showStats} onClose={() => setShowStats(false)} title="Statistics">
        <StatsPanel stats={g.stats} />
      </Modal>
      <Modal open={showWin && g.state.won} onClose={() => setShowWin(false)}>
        <WinPanel
          elapsed={g.elapsed}
          moves={g.state.moves}
          score={g.state.score}
          onNewGame={onNewGame}
          onClose={() => setShowWin(false)}
        />
      </Modal>
      <Modal
        open={showStuck}
        onClose={() => {
          stuckAckedSeedRef.current = g.state.seed;
          setShowStuck(false);
        }}
      >
        <div className="text-center py-2">
          <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[color:var(--fg-dim)]">
            Dead end
          </div>
          <h2
            className="mt-2 tracking-tight font-semibold"
            style={{
              fontSize: "clamp(24px, 3.2vw, 32px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            No more moves.
          </h2>
          <p className="text-[13px] text-[color:var(--fg-soft)] mt-2 leading-snug">
            The stock is empty and nothing on the board will advance. You can
            restart this same deal or try a new shuffle.
          </p>
          <div className="hair my-5" />
          <div className="flex gap-2 justify-center">
            <motion.button
              onClick={() => {
                stuckAckedSeedRef.current = g.state.seed;
                setShowStuck(false);
              }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
              className="px-4 h-10 pill text-[13px] font-semibold focus-ring"
            >
              View board
            </motion.button>
            <motion.button
              onClick={onRestart}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
              className="px-4 h-10 pill text-[13px] font-semibold focus-ring"
            >
              Restart
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
      </Modal>
      <WinSparkles show={showWin && g.state.won} />
    </div>
  );
}

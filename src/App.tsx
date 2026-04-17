import { useCallback, useEffect, useState } from "react";
import { Board } from "./components/Board";
import { TopBar } from "./components/TopBar";
import { Modal } from "./components/Modal";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { WinPanel } from "./components/WinPanel";
import { WinSparkles } from "./components/WinSparkles";
import { useGame } from "./hooks/useGame";
import { useSound } from "./hooks/useSound";

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

  const onNewGame = useCallback(() => {
    play("shuffle");
    g.setAutoPlay(false);
    g.newRound();
    setShowWin(false);
    setShowSettings(false);
  }, [g, play]);

  const onRestart = useCallback(() => {
    play("shuffle");
    g.setAutoPlay(false);
    g.restart();
    setShowWin(false);
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
        drawCount={g.state.drawCount}
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
      <div className="hair mx-5" />
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

      <footer className="px-5 py-3 flex items-center justify-between text-[11px] tracking-wide text-[color:var(--fg-dim)] font-medium">
        <div>Double-click to auto-move · drag stacks to build down · K starts an empty column</div>
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
      <WinSparkles show={showWin && g.state.won} />
    </div>
  );
}

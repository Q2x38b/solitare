import { useCallback, useEffect, useState } from "react";
import { Board } from "./components/Board";
import { TopBar } from "./components/TopBar";
import { Modal } from "./components/Modal";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { WinOverlay } from "./components/WinOverlay";
import { useGame } from "./hooks/useGame";
import { useSound } from "./hooks/useSound";

export default function App() {
  const g = useGame();
  const play = useSound(g.settings.sound);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = g.settings.theme === "paper" ? "light" : "dark";
  }, [g.settings.theme]);

  useEffect(() => {
    if (g.state.won) {
      setShowWin(true);
      play("win");
    }
  }, [g.state.won, play]);

  const onNewGame = useCallback(() => {
    play("shuffle");
    g.newRound();
    setShowWin(false);
    setShowSettings(false);
  }, [g, play]);

  const onRestart = useCallback(() => {
    play("shuffle");
    g.restart();
    setShowWin(false);
  }, [g, play]);

  const onUndo = useCallback(() => {
    play("click");
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
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
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
    <div className="table-felt relative w-screen h-screen flex flex-col">
      <TopBar
        elapsed={g.elapsed}
        moves={g.state.moves}
        score={g.state.score}
        drawCount={g.state.drawCount}
        onNewGame={onNewGame}
        onRestart={onRestart}
        onUndo={onUndo}
        canUndo={g.undoStack.length > 0 && !g.isAutoRunning}
        onHint={onHint}
        onSettings={() => setShowSettings(true)}
        onStats={() => setShowStats(true)}
        theme={g.settings.theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="hair mx-6 opacity-70" />
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

      <footer className="px-6 py-3 flex items-center justify-between text-[11.5px] font-display italic tracking-[0.12em] text-[color:var(--fg-soft)] uppercase opacity-80">
        <div>double-click or drop onto foundations to build up · K to empty columns</div>
        <div className="hidden md:block">
          space · draw &nbsp;·&nbsp; z · undo &nbsp;·&nbsp; h · hint &nbsp;·&nbsp; a · auto &nbsp;·&nbsp; n · new
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

      <WinOverlay
        show={showWin && g.state.won}
        elapsed={g.elapsed}
        moves={g.state.moves}
        score={g.state.score}
        onNewGame={onNewGame}
        onClose={() => setShowWin(false)}
      />
    </div>
  );
}

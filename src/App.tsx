import { useCallback, useEffect, useRef, useState } from "react";
import { Board } from "./components/Board";
import { TopBar } from "./components/TopBar";
import { AnimatedDialog } from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatsPanel } from "./components/StatsPanel";
import { WinPanel } from "./components/WinPanel";
import { WinSparkles } from "./components/WinSparkles";
import { useGame } from "./hooks/useGame";
import { useSound } from "./hooks/useSound";
import { isGameStuck } from "./game/engine";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="tabular px-1.5 h-5 inline-flex items-center rounded-md bg-[color:var(--surface)] border border-[color:var(--line)] text-[10.5px] font-semibold text-[color:var(--fg-soft)]">
      {children}
    </span>
  );
}

// Module-scope ref so useGame's callback and useSound's play function can
// reference each other without a circular useState dance inside the body.
type SoundName = "flip" | "place" | "shuffle" | "win" | "click";

export default function App() {
  // useGame needs `play` to fire auto-play sounds, but `play` itself
  // depends on settings.sound which comes out of useGame. Break the
  // cycle with a ref that useGame calls through, and we populate it
  // once useSound has been created.
  const playRef = useRef<((n: SoundName) => void) | null>(null);
  const playProxy = useCallback((n: SoundName) => playRef.current?.(n), []);
  const g = useGame({ play: playProxy });
  const play = useSound(g.settings.sound);
  useEffect(() => {
    playRef.current = play;
  }, [play]);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showStuck, setShowStuck] = useState(false);
  const stuckAckedSeedRef = useRef<number | null>(null);

  useEffect(() => {
    if (g.state.won) {
      setShowWin(true);
      play("win");
    }
  }, [g.state.won, play]);

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
          setShowStuck(false);
          break;
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [g, onUndo, onHint, onNewGame, onRestart, play]);

  const closeStuck = () => {
    stuckAckedSeedRef.current = g.state.seed;
    setShowStuck(false);
  };

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

      <AnimatedDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        title="Settings"
      >
        <SettingsPanel
          settings={g.settings}
          onChange={(p) => g.updateSettings(p)}
          onNewGame={onNewGame}
        />
      </AnimatedDialog>
      <AnimatedDialog
        open={showStats}
        onOpenChange={setShowStats}
        title="Statistics"
      >
        <StatsPanel stats={g.stats} />
      </AnimatedDialog>
      <AnimatedDialog open={showWin && g.state.won} onOpenChange={setShowWin}>
        <WinPanel
          elapsed={g.elapsed}
          moves={g.state.moves}
          score={g.state.score}
          onNewGame={onNewGame}
          onClose={() => setShowWin(false)}
        />
      </AnimatedDialog>
      <AnimatedDialog
        open={showStuck}
        onOpenChange={(o) => !o && closeStuck()}
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
            <Button variant="secondary" size="lg" onClick={closeStuck}>
              View board
            </Button>
            <Button variant="secondary" size="lg" onClick={onRestart}>
              Restart
            </Button>
            <Button variant="default" size="lg" onClick={onNewGame}>
              New deal
            </Button>
          </div>
        </div>
      </AnimatedDialog>
      <WinSparkles show={showWin && g.state.won} />
    </div>
  );
}

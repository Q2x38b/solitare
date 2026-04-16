import { useCallback, useEffect, useRef, useState } from "react";
import {
  canAutoComplete,
  drawFromStock,
  findAutoFoundationMove,
  findBestMoveForCard,
  newGame,
  tryMove,
  undoMove,
} from "../game/engine";
import type { GameState, Move, MoveAttempt, PileId, Settings, Stats } from "../game/types";

const STATE_KEY = "solitaire:v1:state";
const SETTINGS_KEY = "solitaire:v1:settings";
const STATS_KEY = "solitaire:v1:stats";

const defaultSettings: Settings = {
  drawCount: 1,
  theme: "felt",
  sound: true,
  autoMove: true,
  animations: true,
};

const defaultStats: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestTimeSec: null,
  bestMoves: null,
  bestScore: null,
  currentStreak: 0,
  longestStreak: 0,
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export interface UseGameReturn {
  state: GameState;
  settings: Settings;
  stats: Stats;
  undoStack: Move[];
  elapsed: number;
  showHint: PileId | null;
  draw: () => void;
  attempt: (a: MoveAttempt) => boolean;
  attemptAuto: (from: PileId, count: number) => boolean;
  undo: () => void;
  restart: () => void;
  newRound: () => void;
  autoComplete: () => void;
  updateSettings: (p: Partial<Settings>) => void;
  hint: () => void;
  clearHint: () => void;
  isAutoRunning: boolean;
}

export function useGame(): UseGameReturn {
  const [settings, setSettings] = useState<Settings>(() => loadJSON(SETTINGS_KEY, defaultSettings));
  const [stats, setStats] = useState<Stats>(() => loadJSON(STATS_KEY, defaultStats));

  const [state, setState] = useState<GameState>(() => {
    const saved = loadJSON<GameState | null>(STATE_KEY, null as unknown as GameState);
    if (saved && saved.tableau && saved.stock) return saved as GameState;
    return newGame({ drawCount: settings.drawCount });
  });
  const [undoStack, setUndoStack] = useState<Move[]>([]);
  const [elapsed, setElapsed] = useState<number>(0);
  const [showHint, setShowHint] = useState<PileId | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const winRecorded = useRef(false);

  // Tick timer
  useEffect(() => {
    if (state.won || state.startedAt === null) return;
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      setElapsed(
        state.elapsedBefore + Math.floor((now - (state.startedAt ?? now)) / 1000),
      );
      raf = window.setTimeout(tick, 250) as unknown as number;
    };
    tick();
    return () => clearTimeout(raf);
  }, [state.startedAt, state.won, state.elapsedBefore]);

  useEffect(() => {
    if (state.startedAt === null) setElapsed(0);
  }, [state.seed, state.startedAt]);

  // Persist
  useEffect(() => {
    saveJSON(STATE_KEY, state);
  }, [state]);
  useEffect(() => {
    saveJSON(SETTINGS_KEY, settings);
  }, [settings]);
  useEffect(() => {
    saveJSON(STATS_KEY, stats);
  }, [stats]);

  // Record win
  useEffect(() => {
    if (!state.won || winRecorded.current) return;
    winRecorded.current = true;
    const totalSec = elapsed;
    setStats((s) => {
      const streak = s.currentStreak + 1;
      return {
        gamesPlayed: s.gamesPlayed + 1,
        gamesWon: s.gamesWon + 1,
        bestTimeSec: s.bestTimeSec === null ? totalSec : Math.min(s.bestTimeSec, totalSec),
        bestMoves: s.bestMoves === null ? state.moves : Math.min(s.bestMoves, state.moves),
        bestScore: s.bestScore === null ? state.score : Math.max(s.bestScore, state.score),
        currentStreak: streak,
        longestStreak: Math.max(s.longestStreak, streak),
      };
    });
  }, [state.won, state.moves, state.score, elapsed]);

  const draw = useCallback(() => {
    const r = drawFromStock(state);
    if (!r) return;
    setState(r.state);
    setUndoStack((u) => [...u, r.move]);
    setShowHint(null);
  }, [state]);

  const attempt = useCallback(
    (a: MoveAttempt) => {
      const r = tryMove(state, a);
      if (!r) return false;
      setState(r.state);
      setUndoStack((u) => [...u, r.move]);
      setShowHint(null);
      return true;
    },
    [state],
  );

  const attemptAuto = useCallback(
    (from: PileId, count: number) => {
      const to = findBestMoveForCard(state, from, count);
      if (!to) return false;
      return attempt({ from, to, count });
    },
    [state, attempt],
  );

  const undo = useCallback(() => {
    setUndoStack((u) => {
      if (u.length === 0) return u;
      const last = u[u.length - 1];
      setState((s) => undoMove(s, last));
      return u.slice(0, -1);
    });
  }, []);

  const restart = useCallback(() => {
    setState((s) => {
      const fresh = newGame({ drawCount: s.drawCount, seed: s.seed });
      return fresh;
    });
    setUndoStack([]);
    winRecorded.current = false;
  }, []);

  const newRound = useCallback(() => {
    setStats((s) => {
      if (!state.won && state.moves > 0) {
        return {
          ...s,
          gamesPlayed: s.gamesPlayed + 1,
          currentStreak: 0,
        };
      }
      return s;
    });
    setState(newGame({ drawCount: settings.drawCount }));
    setUndoStack([]);
    winRecorded.current = false;
  }, [settings.drawCount, state.won, state.moves]);

  const autoComplete = useCallback(() => {
    if (!canAutoComplete(state)) return;
    setIsAutoRunning(true);
    let current = state;
    const moves: Move[] = [];
    const step = () => {
      const m = findAutoFoundationMove(current);
      if (!m) {
        setIsAutoRunning(false);
        setState(current);
        setUndoStack((u) => [...u, ...moves]);
        return;
      }
      const r = tryMove(current, m);
      if (!r) {
        setIsAutoRunning(false);
        setState(current);
        setUndoStack((u) => [...u, ...moves]);
        return;
      }
      current = r.state;
      moves.push(r.move);
      setState(current);
      setUndoStack((u) => [...u, r.move]);
      if (current.won) {
        setIsAutoRunning(false);
        return;
      }
      setTimeout(step, 70);
    };
    step();
  }, [state]);

  const updateSettings = useCallback((p: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...p };
      return next;
    });
  }, []);

  useEffect(() => {
    if (state.drawCount !== settings.drawCount) {
      // Changing draw count mid-game will apply on next new game
    }
  }, [settings.drawCount, state.drawCount]);

  const hint = useCallback(() => {
    const auto = findAutoFoundationMove(state);
    if (auto) {
      setShowHint(auto.from);
      return;
    }
    // search tableau
    for (let i = 0; i < 7; i++) {
      const col = state.tableau[i];
      for (let j = 0; j < col.length; j++) {
        if (!col[j].faceUp) continue;
        const count = col.length - j;
        const to = findBestMoveForCard(state, `t${i}` as PileId, count);
        if (to) {
          setShowHint(`t${i}` as PileId);
          return;
        }
      }
    }
    if (state.waste.length) {
      const to = findBestMoveForCard(state, "waste", 1);
      if (to) {
        setShowHint("waste");
        return;
      }
    }
    setShowHint("stock");
  }, [state]);

  const clearHint = useCallback(() => setShowHint(null), []);

  return {
    state,
    settings,
    stats,
    undoStack,
    elapsed,
    showHint,
    draw,
    attempt,
    attemptAuto,
    undo,
    restart,
    newRound,
    autoComplete,
    updateSettings,
    hint,
    clearHint,
    isAutoRunning,
  };
}

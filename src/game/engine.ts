import type { Card, GameState, Move, PileId, Rank, Suit } from "./types";

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const colorOf = (s: Suit): "red" | "black" =>
  s === "H" || s === "D" ? "red" : "black";

export const rankChar = (r: Rank): string =>
  r === 1 ? "A" : r === 11 ? "J" : r === 12 ? "Q" : r === 13 ? "K" : String(r);

export const suitChar = (s: Suit): string =>
  ({ S: "♠", H: "♥", D: "♦", C: "♣" }[s]);

// Mulberry32 PRNG for reproducible shuffles
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({ id: `${s}${r}`, suit: s, rank: r, faceUp: false });
    }
  }
  return deck;
}

export function shuffle(deck: Card[], seed: number): Card[] {
  const rng = mulberry32(seed);
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function newGame(opts: { seed?: number; drawCount?: 1 | 2 | 3 } = {}): GameState {
  const seed = opts.seed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const deck = shuffle(buildDeck(), seed);
  const tableau: GameState["tableau"] = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++], faceUp: row === col };
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    drawCount: opts.drawCount ?? 1,
    moves: 0,
    score: 0,
    passes: 0,
    startedAt: null,
    elapsedBefore: 0,
    won: false,
    seed,
  };
}

export function pileRef(state: GameState, id: PileId): Card[] {
  if (id === "stock") return state.stock;
  if (id === "waste") return state.waste;
  if (id.startsWith("f")) return state.foundations[Number(id[1])];
  return state.tableau[Number(id[1])];
}

export function topOf(pile: Card[]): Card | undefined {
  return pile[pile.length - 1];
}

export function canStackOnTableau(top: Card | undefined, moving: Card): boolean {
  if (!top) return moving.rank === 13;
  if (!top.faceUp) return false;
  return colorOf(top.suit) !== colorOf(moving.suit) && top.rank === moving.rank + 1;
}

export function canPlaceOnFoundation(top: Card | undefined, moving: Card, foundationIdx: number, state: GameState): boolean {
  if (!top) {
    if (moving.rank !== 1) return false;
    const used = state.foundations.map((f) => f[0]?.suit).filter(Boolean);
    if (used.includes(moving.suit)) return false;
    return !state.foundations[foundationIdx][0];
  }
  return top.suit === moving.suit && top.rank + 1 === moving.rank;
}

export function foundationIndexForSuit(state: GameState, suit: Suit): number | null {
  for (let i = 0; i < 4; i++) {
    const f = state.foundations[i];
    if (f.length && f[0].suit === suit) return i;
  }
  for (let i = 0; i < 4; i++) {
    if (!state.foundations[i].length) {
      const used = state.foundations.map((f) => f[0]?.suit).filter(Boolean);
      if (!used.includes(suit)) return i;
    }
  }
  return null;
}

function scoreForMove(from: PileId, to: PileId): number {
  if (from === "waste" && to.startsWith("t")) return 5;
  if (from === "waste" && to.startsWith("f")) return 10;
  if (from.startsWith("t") && to.startsWith("f")) return 10;
  if (from.startsWith("f") && to.startsWith("t")) return -15;
  if (from.startsWith("t") && to.startsWith("t")) return 0;
  return 0;
}

function scoreForFlip(): number {
  return 5;
}

function startTimer(state: GameState): GameState {
  if (state.startedAt === null) return { ...state, startedAt: Date.now() };
  return state;
}

export interface MoveAttempt {
  from: PileId;
  to: PileId;
  count: number;
}

export function tryMove(state: GameState, attempt: MoveAttempt): { state: GameState; move: Move } | null {
  const src = pileRef(state, attempt.from);
  if (attempt.count < 1 || src.length < attempt.count) return null;
  const moving = src.slice(src.length - attempt.count);
  if (!moving.every((c) => c.faceUp)) return null;

  if (attempt.to.startsWith("f")) {
    if (attempt.count !== 1) return null;
    const fIdx = Number(attempt.to[1]);
    const foundation = state.foundations[fIdx];
    if (!canPlaceOnFoundation(topOf(foundation), moving[0], fIdx, state)) return null;
  } else if (attempt.to.startsWith("t")) {
    const tIdx = Number(attempt.to[1]);
    const target = state.tableau[tIdx];
    if (!canStackOnTableau(topOf(target), moving[0])) return null;
  } else {
    return null;
  }

  const next = structuredClone(state) as GameState;
  const nSrc = pileRef(next, attempt.from);
  const nDst = pileRef(next, attempt.to);
  const removed = nSrc.splice(nSrc.length - attempt.count, attempt.count);
  nDst.push(...removed);

  let flipped = false;
  if (attempt.from.startsWith("t")) {
    const col = pileRef(next, attempt.from);
    const last = col[col.length - 1];
    if (last && !last.faceUp) {
      last.faceUp = true;
      flipped = true;
    }
  }

  let scoreDelta = scoreForMove(attempt.from, attempt.to);
  if (flipped) scoreDelta += scoreForFlip();
  next.score = Math.max(0, next.score + scoreDelta);
  next.moves += 1;
  const started = startTimer(next);
  next.startedAt = started.startedAt;
  next.won = isWon(next);

  const move: Move = {
    from: attempt.from,
    to: attempt.to,
    count: attempt.count,
    flipped,
    scoreDelta,
  };
  return { state: next, move };
}

export function drawFromStock(state: GameState): { state: GameState; move: Move } | null {
  const n = state.drawCount;
  if (state.stock.length === 0 && state.waste.length === 0) return null;
  const next = structuredClone(state) as GameState;
  const move: Move = { from: "stock", to: "waste", count: 0, scoreDelta: 0 };
  if (next.stock.length === 0) {
    move.recycled = true;
    move.prevWaste = state.waste.slice();
    move.prevStock = state.stock.slice();
    const recycled = next.waste.slice().reverse().map((c) => ({ ...c, faceUp: false }));
    next.stock = recycled;
    next.waste = [];
    next.passes += 1;
    if (next.drawCount === 1 && next.passes > 1) {
      next.score = Math.max(0, next.score - 100);
      move.scoreDelta = -100;
    } else if (next.drawCount === 2 && next.passes > 2) {
      next.score = Math.max(0, next.score - 50);
      move.scoreDelta = -50;
    } else if (next.drawCount === 3 && next.passes > 3) {
      next.score = Math.max(0, next.score - 20);
      move.scoreDelta = -20;
    }
  } else {
    const take = Math.min(n, next.stock.length);
    const drawn = next.stock.splice(next.stock.length - take, take).reverse();
    for (const c of drawn) c.faceUp = true;
    next.waste.push(...drawn);
    move.count = take;
  }
  next.moves += 1;
  const started = startTimer(next);
  next.startedAt = started.startedAt;
  next.won = isWon(next);
  return { state: next, move };
}

export function undoMove(state: GameState, move: Move): GameState {
  const prev = structuredClone(state) as GameState;
  if (move.from === "stock" && move.to === "waste") {
    if (move.recycled) {
      prev.waste = move.prevWaste ?? [];
      prev.stock = move.prevStock ?? [];
      prev.passes = Math.max(0, prev.passes - 1);
    } else {
      const back = prev.waste.splice(prev.waste.length - move.count, move.count).reverse();
      for (const c of back) c.faceUp = false;
      prev.stock.push(...back);
    }
  } else {
    const src = pileRef(prev, move.from);
    const dst = pileRef(prev, move.to);
    if (move.flipped && move.from.startsWith("t")) {
      const col = pileRef(prev, move.from);
      const last = col[col.length - 1];
      if (last) last.faceUp = false;
    }
    const removed = dst.splice(dst.length - move.count, move.count);
    src.push(...removed);
  }
  prev.score = Math.max(0, prev.score - move.scoreDelta);
  prev.moves = Math.max(0, prev.moves - 1);
  prev.won = false;
  return prev;
}

export function isWon(state: GameState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

export function canAutoComplete(state: GameState): boolean {
  if (state.stock.length > 0 || state.waste.length > 0) return false;
  return state.tableau.every((col) => col.every((c) => c.faceUp));
}

export function findAutoFoundationMove(
  state: GameState,
  opts: { unsafe?: boolean } = {},
): MoveAttempt | null {
  const sources: PileId[] = ["waste", "t0", "t1", "t2", "t3", "t4", "t5", "t6"];
  for (const src of sources) {
    const pile = pileRef(state, src);
    const top = pile[pile.length - 1];
    if (!top || !top.faceUp) continue;
    const fIdx = foundationIndexForSuit(state, top.suit);
    if (fIdx === null) continue;
    const fTop = state.foundations[fIdx][state.foundations[fIdx].length - 1];
    if (!canPlaceOnFoundation(fTop, top, fIdx, state)) continue;
    if (opts.unsafe) {
      return { from: src, to: `f${fIdx}` as PileId, count: 1 };
    }
    const minOther = Math.min(
      ...state.foundations
        .filter((_, i) => i !== fIdx)
        .map((f) => (f[f.length - 1] ? f[f.length - 1].rank : 0)),
    );
    if (top.rank <= 2 || top.rank <= minOther + 2) {
      return { from: src, to: `f${fIdx}` as PileId, count: 1 };
    }
  }
  return null;
}

export function findBestMoveForCard(state: GameState, from: PileId, count: number): PileId | null {
  const src = pileRef(state, from);
  if (src.length < count) return null;
  const moving = src.slice(src.length - count);
  if (!moving.every((c) => c.faceUp)) return null;

  if (count === 1) {
    const fIdx = foundationIndexForSuit(state, moving[0].suit);
    if (fIdx !== null) {
      const top = state.foundations[fIdx][state.foundations[fIdx].length - 1];
      if (canPlaceOnFoundation(top, moving[0], fIdx, state)) return `f${fIdx}` as PileId;
    }
  }
  const emptyCol: PileId[] = [];
  const nonEmpty: PileId[] = [];
  for (let i = 0; i < 7; i++) {
    const t = state.tableau[i];
    const pid = `t${i}` as PileId;
    if (pid === from) continue;
    if (t.length === 0) emptyCol.push(pid);
    else nonEmpty.push(pid);
  }
  for (const pid of nonEmpty) {
    const top = topOf(pileRef(state, pid));
    if (canStackOnTableau(top, moving[0])) return pid;
  }
  if (moving[0].rank === 13 && emptyCol.length && from !== emptyCol[0]) return emptyCol[0];
  return null;
}

/**
 * Greedy auto-player: returns the next move or "draw" decision, or null if
 * the solver gives up. Priority order:
 *   1. Ace / 2 → foundation (always safe)
 *   2. Any tableau move that flips a face-down card
 *   3. Safe foundation move (rank ≤ min(other foundation tops) + 2)
 *   4. Waste → tableau if it stacks
 *   5. Tableau → tableau that unblocks a buried face-down row (multi-card)
 *   6. Draw from stock (unless both stock and waste are empty, i.e. would
 *      just cycle a recycled deck with nothing new to commit)
 */
export type AutoAction =
  | { kind: "move"; move: MoveAttempt }
  | { kind: "draw" };

export function findAutoPlayAction(state: GameState): AutoAction | null {
  const tableauSrcs: PileId[] = ["t0", "t1", "t2", "t3", "t4", "t5", "t6"];

  // 1. Ace / 2 → foundation
  for (const src of [...tableauSrcs, "waste" as PileId]) {
    const pile = pileRef(state, src);
    const top = pile[pile.length - 1];
    if (!top || !top.faceUp) continue;
    if (top.rank > 2) continue;
    const fIdx = foundationIndexForSuit(state, top.suit);
    if (fIdx === null) continue;
    const fTop = state.foundations[fIdx][state.foundations[fIdx].length - 1];
    if (canPlaceOnFoundation(fTop, top, fIdx, state)) {
      return { kind: "move", move: { from: src, to: `f${fIdx}` as PileId, count: 1 } };
    }
  }

  // 2. Tableau move that flips a face-down card
  for (let i = 0; i < 7; i++) {
    const col = state.tableau[i];
    // find first face-up card
    let firstUp = -1;
    for (let j = 0; j < col.length; j++) {
      if (col[j].faceUp) {
        firstUp = j;
        break;
      }
    }
    if (firstUp === -1) continue;
    // Only a move that takes everything from firstUp to end flips the face-down below
    if (firstUp === 0) continue; // nothing face-down to flip
    const moving = col.slice(firstUp);
    // Try tableau → foundation (only works for single-card)
    if (moving.length === 1) {
      const card = moving[0];
      const fIdx = foundationIndexForSuit(state, card.suit);
      if (fIdx !== null) {
        const fTop = state.foundations[fIdx][state.foundations[fIdx].length - 1];
        if (canPlaceOnFoundation(fTop, card, fIdx, state)) {
          return { kind: "move", move: { from: `t${i}` as PileId, to: `f${fIdx}` as PileId, count: 1 } };
        }
      }
    }
    // Try tableau → other tableau column
    for (let j = 0; j < 7; j++) {
      if (i === j) continue;
      const target = state.tableau[j];
      const tTop = target[target.length - 1];
      if (canStackOnTableau(tTop, moving[0])) {
        return {
          kind: "move",
          move: { from: `t${i}` as PileId, to: `t${j}` as PileId, count: moving.length },
        };
      }
    }
  }

  // 3. Safe foundation move (heuristic)
  const safe = findAutoFoundationMove(state);
  if (safe) return { kind: "move", move: safe };

  // 4. Waste → tableau if it stacks (stacks onto an existing column, not empty)
  if (state.waste.length) {
    const card = state.waste[state.waste.length - 1];
    for (let j = 0; j < 7; j++) {
      const target = state.tableau[j];
      if (target.length === 0) continue;
      const tTop = target[target.length - 1];
      if (canStackOnTableau(tTop, card)) {
        return { kind: "move", move: { from: "waste", to: `t${j}` as PileId, count: 1 } };
      }
    }
    // Also: waste K → empty column
    if (card.rank === 13) {
      for (let j = 0; j < 7; j++) {
        if (state.tableau[j].length === 0) {
          return { kind: "move", move: { from: "waste", to: `t${j}` as PileId, count: 1 } };
        }
      }
    }
  }

  // 5. Tableau → empty column for King that frees something
  for (let i = 0; i < 7; i++) {
    const col = state.tableau[i];
    if (col.length === 0) continue;
    let firstUp = -1;
    for (let j = 0; j < col.length; j++) {
      if (col[j].faceUp) {
        firstUp = j;
        break;
      }
    }
    if (firstUp <= 0) continue; // no face-down below
    const top = col[firstUp];
    if (top.rank !== 13) continue;
    for (let j = 0; j < 7; j++) {
      if (j === i) continue;
      if (state.tableau[j].length === 0) {
        return {
          kind: "move",
          move: { from: `t${i}` as PileId, to: `t${j}` as PileId, count: col.length - firstUp },
        };
      }
    }
  }

  // 6. Draw from stock
  if (state.stock.length > 0) {
    return { kind: "draw" };
  }
  // Recycle stock only if we haven't recycled too many times already
  const recycleBudget = state.drawCount === 1 ? 2 : state.drawCount === 2 ? 3 : 4;
  if (state.waste.length > 0 && state.passes < recycleBudget) {
    return { kind: "draw" };
  }

  return null;
}

/**
 * Definitively stuck: no stock, no waste, and no legal tableau move left.
 * (We intentionally skip the harder "is this position unwinnable" solver
 * question — false-positives are annoying. This version only fires when
 * the player truly has nothing they can do.)
 */
export function isGameStuck(state: GameState): boolean {
  if (state.won) return false;
  if (state.stock.length > 0 || state.waste.length > 0) return false;
  for (let i = 0; i < 7; i++) {
    const col = state.tableau[i];
    for (let j = 0; j < col.length; j++) {
      if (!col[j].faceUp) continue;
      const count = col.length - j;
      if (findBestMoveForCard(state, `t${i}` as PileId, count)) return false;
    }
  }
  return true;
}

export function hasAnyLegalMove(state: GameState): boolean {
  for (let i = 0; i < 7; i++) {
    const col = state.tableau[i];
    for (let j = 0; j < col.length; j++) {
      if (!col[j].faceUp) continue;
      const count = col.length - j;
      if (findBestMoveForCard(state, `t${i}` as PileId, count)) return true;
    }
  }
  if (state.waste.length) {
    if (findBestMoveForCard(state, "waste", 1)) return true;
  }
  if (state.stock.length > 0 || state.waste.length > 0) return true;
  return false;
}

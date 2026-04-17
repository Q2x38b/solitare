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

export type AutoAction =
  | { kind: "move"; move: MoveAttempt }
  | { kind: "draw" };

/**
 * Smarter auto-player. Instead of a fixed priority ladder, enumerate every
 * legal move, score each by how much it advances the game, and pick the
 * best. Key signals that push a score up:
 *   - Flipping a face-down card (the single biggest progress event)
 *   - Getting Aces / 2s onto the foundation immediately
 *   - Emptying a tableau column (creates valuable King real-estate)
 *   - Safely committing to the foundation (opposite-colour +2 rule)
 * Key signals that push a score down:
 *   - Breaking an intact face-up run without unlocking anything
 *   - Parking a card on foundation when its same-rank mate could still
 *     reveal face-down cards in the tableau
 *   - Moving a King into an empty column for no reason (wastes the slot)
 *   - Dumping waste onto an empty column if it's not a King (illegal
 *     anyway, but scored so it never shows up)
 * If no move scores above the draw threshold, draw from stock.
 */
export function findAutoPlayAction(state: GameState): AutoAction | null {
  const tableauSrcs: PileId[] = ["t0", "t1", "t2", "t3", "t4", "t5", "t6"];

  type Scored = { action: AutoAction; score: number };
  const candidates: Scored[] = [];

  // --- Opposite-colour safety check for foundation plays ---------------
  // A card of rank R is "safe" to foundation when both opposite-colour
  // foundations are at rank ≥ R - 2. Below that we risk stranding an
  // opposite-colour R-1 card that wanted to stack.
  const isFoundationSafe = (card: Card): boolean => {
    if (card.rank <= 2) return true;
    const oppositeSuits: Suit[] =
      colorOf(card.suit) === "red" ? ["S", "C"] : ["H", "D"];
    let minOpp = 13;
    for (const s of oppositeSuits) {
      const fIdx = foundationIndexForSuit(state, s);
      const f = fIdx !== null ? state.foundations[fIdx] : [];
      const topRank = f[f.length - 1]?.rank ?? 0;
      if (topRank < minOpp) minOpp = topRank;
    }
    return card.rank <= minOpp + 2;
  };

  // Cache: is this suit's matching-colour partner still needed on the
  // tableau? (i.e. would sending this card to the foundation orphan a
  // multi-card sequence that wanted it?)
  const sameColourMateOnTableau = (card: Card): boolean => {
    // Only 3+ matters — 2s can always go.
    if (card.rank <= 2) return false;
    const sameColour = colorOf(card.suit);
    for (let i = 0; i < 7; i++) {
      const col = state.tableau[i];
      for (let j = 0; j < col.length; j++) {
        const c = col[j];
        if (!c.faceUp) continue;
        if (colorOf(c.suit) !== sameColour) continue;
        if (c.rank !== card.rank) continue;
        // The mate card exists on tableau — check the card immediately
        // below (rank - 1, opposite colour). If that rank-1 opposite
        // card is still somewhere in play (tableau face-up/down or
        // waste/stock), then we still need SOME rank-card to anchor
        // its eventual placement.
        return true;
      }
    }
    return false;
  };

  // --- Collect foundation plays -----------------------------------------
  for (const src of [...tableauSrcs, "waste" as PileId]) {
    const pile = pileRef(state, src);
    const top = pile[pile.length - 1];
    if (!top || !top.faceUp) continue;
    const fIdx = foundationIndexForSuit(state, top.suit);
    if (fIdx === null) continue;
    const fTop = state.foundations[fIdx][state.foundations[fIdx].length - 1];
    if (!canPlaceOnFoundation(fTop, top, fIdx, state)) continue;

    let score = 0;
    // Aces and 2s: always highest priority.
    if (top.rank <= 2) {
      score = 1000;
    } else if (isFoundationSafe(top)) {
      score = 260;
      // Slight penalty if the same-colour mate is still buried — we
      // might still need this rank's partner to anchor a tableau run.
      if (sameColourMateOnTableau(top)) score -= 40;
    } else {
      // Unsafe foundation play. Keep it in play unless doing so also
      // flips a face-down below, which swings the calculus.
      score = 20;
    }

    // Big bonus if this move flips a face-down card.
    if (src.startsWith("t")) {
      const col = pileRef(state, src);
      if (col.length >= 2 && !col[col.length - 2].faceUp) {
        score += 320;
      } else if (col.length === 1) {
        // Emptying a column is also valuable (opens King slot).
        score += 120;
      }
    }

    candidates.push({
      action: { kind: "move", move: { from: src, to: `f${fIdx}` as PileId, count: 1 } },
      score,
    });
  }

  // --- Tableau → tableau moves -----------------------------------------
  // Try every face-up suffix of every column as a candidate stack.
  for (let i = 0; i < 7; i++) {
    const col = state.tableau[i];
    let firstUp = -1;
    for (let j = 0; j < col.length; j++) {
      if (col[j].faceUp) {
        firstUp = j;
        break;
      }
    }
    if (firstUp < 0) continue;

    // Iterate chunk sizes from largest (whole face-up run) down to 1.
    // Larger chunks are naturally preferred because they can flip face-
    // downs; smaller chunks are only useful for chain rebuilds.
    for (let count = col.length - firstUp; count >= 1; count--) {
      const startIdx = col.length - count;
      if (startIdx < firstUp) break;
      const moving = col.slice(startIdx);
      const head = moving[0];
      const flipsFaceDown = startIdx === firstUp && firstUp > 0;
      const emptiesColumn = startIdx === 0;

      for (let j = 0; j < 7; j++) {
        if (i === j) continue;
        const target = state.tableau[j];
        const tTop = target[target.length - 1];
        if (!canStackOnTableau(tTop, head)) continue;

        const toEmpty = target.length === 0;
        let score = 0;

        if (flipsFaceDown) {
          // Best kind of tableau move.
          score = 520 + firstUp * 35;
        } else if (emptiesColumn && !toEmpty) {
          // Empties a column (useful real-estate), but only if the
          // destination isn't itself an empty column (which would be
          // pointless shuffling).
          score = 180;
        } else {
          // Pure chain rebuild. Only interesting if the head already
          // sits on its anchor and we're building a longer sequence.
          // In practice low-score, so it won't be picked unless
          // nothing better is available.
          score = 30;
        }

        // Kings to empty columns: only when it actually unblocks.
        if (head.rank === 13 && toEmpty && !flipsFaceDown) {
          // Discourage — no point sending a King to empty unless it
          // reveals a face-down, which is already scored above.
          score -= 100;
        }

        // Prefer moves that don't break an already-stacked run: if the
        // card immediately above the chunk (col[startIdx - 1]) forms a
        // valid descending alt-colour with the new target top, we're
        // not really "breaking" anything.
        if (startIdx > firstUp) {
          const above = col[startIdx - 1];
          if (above.faceUp) score -= 30;
        }

        candidates.push({
          action: {
            kind: "move",
            move: { from: `t${i}` as PileId, to: `t${j}` as PileId, count },
          },
          score,
        });
      }
    }
  }

  // --- Waste → tableau -------------------------------------------------
  if (state.waste.length) {
    const card = state.waste[state.waste.length - 1];
    for (let j = 0; j < 7; j++) {
      const target = state.tableau[j];
      if (target.length === 0) {
        if (card.rank === 13) {
          candidates.push({
            action: { kind: "move", move: { from: "waste", to: `t${j}` as PileId, count: 1 } },
            score: 240,
          });
        }
        continue;
      }
      const tTop = target[target.length - 1];
      if (canStackOnTableau(tTop, card)) {
        candidates.push({
          action: { kind: "move", move: { from: "waste", to: `t${j}` as PileId, count: 1 } },
          score: 300,
        });
      }
    }
  }

  // Pick the highest-scoring action, if it's worth more than a draw.
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length && candidates[0].score > 15) {
    return candidates[0].action;
  }

  // --- Fallback: draw ---------------------------------------------------
  if (state.stock.length > 0) return { kind: "draw" };
  const recycleBudget = state.drawCount === 1 ? 2 : state.drawCount === 2 ? 3 : 4;
  if (state.waste.length > 0 && state.passes < recycleBudget) {
    return { kind: "draw" };
  }

  // Final fallback: if the best candidate was below the draw threshold
  // but we literally can't draw, take it anyway to avoid giving up
  // prematurely.
  if (candidates.length) return candidates[0].action;
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

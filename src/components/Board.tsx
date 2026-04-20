import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Card as CardView } from "./Card";
import { Pile } from "./Pile";
import { SuitIcon } from "./SuitIcon";
import { FannedCardsGlyph } from "./FannedCardsGlyph";
import { canAutoComplete, pileRef } from "../game/engine";
import type { Card, GameState, PileId, Suit } from "../game/types";

interface Props {
  state: GameState;
  showHint: PileId | null;
  onDraw: () => void;
  onMove: (from: PileId, to: PileId, count: number) => boolean;
  onAuto: (from: PileId, count: number) => boolean;
  onFlipRequest?: () => void;
  onAutoComplete: () => void;
  isAutoRunning: boolean;
  play: (n: "flip" | "place" | "shuffle" | "click" | "win") => void;
}

type DragState = {
  from: PileId;
  cards: Card[];
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  pointerId: number;
  hoverPile: PileId | null;
  didMove: boolean;
  // Smoothed pointer velocity (px / ms), used for drag-tilt rotation.
  vx: number;
  lastMoveX: number;
  lastMoveT: number;
};

const FOUNDATION_SUITS: Suit[] = ["S", "H", "D", "C"];

export function Board({
  state,
  showHint,
  onDraw,
  onMove,
  onAuto,
  onAutoComplete,
  isAutoRunning,
  play,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pileRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dims, setDims] = useState({ w: 980, cw: 92, ch: 132, gap: 16, faceUpGap: 30, faceDownGap: 12 });
  const [drag, setDrag] = useState<DragState | null>(null);
  // Cards whose target position changed in the most recent render — lifted
  // above the pack for the duration of the slide so they don't visually
  // pass beneath other tableau cards.
  const prevPosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [liftedIds, setLiftedIds] = useState<Set<string>>(() => new Set());

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const rect = frame.getBoundingClientRect();
      const availableW = rect.width - 24;
      const availableH = rect.height - 24;

      // 7 columns + 6 gaps. cw scales with available width; gap is 18% of
      // cw so the formula is 7*cw + 6*0.18*cw = 8.08*cw ≈ availableW.
      // Min 40 so even a 340px-wide viewport fits all 7 columns.
      const cwByWidth = Math.floor(availableW / 8.08);
      const cwMaxByHeight = Math.floor((availableH - 24 - 18 * 11) / 2.1);
      const cw = Math.max(40, Math.min(118, cwByWidth, cwMaxByHeight));
      const ch = Math.round(cw * 1.42);
      const gap = Math.round(cw * 0.18);
      const targetW = cw * 7 + gap * 6;
      setDims({
        w: targetW,
        cw,
        ch,
        gap,
        faceUpGap: Math.round(ch * 0.26),
        faceDownGap: Math.round(ch * 0.1),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const topRowY = 8;
  const tableauY = topRowY + dims.ch + 32;

  const pileOrigin = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    const xStart = 0;
    map["stock"] = { x: xStart, y: topRowY };
    map["waste"] = { x: xStart + dims.cw + dims.gap, y: topRowY };
    for (let i = 0; i < 4; i++) {
      map[`f${i}`] = { x: xStart + (dims.cw + dims.gap) * (3 + i), y: topRowY };
    }
    for (let i = 0; i < 7; i++) {
      map[`t${i}`] = { x: xStart + (dims.cw + dims.gap) * i, y: tableauY };
    }
    return map;
  }, [dims, topRowY, tableauY]);

  const cardTransforms = useMemo(() => {
    const map = new Map<string, { x: number; y: number; z: number; draggable: boolean; from: PileId; fromIdx: number }>();
    state.stock.forEach((c, i) => {
      const p = pileOrigin["stock"];
      map.set(c.id, {
        x: p.x + Math.min(i, 3) * 0.5,
        y: p.y + Math.min(i, 3) * 0.5,
        z: i,
        draggable: false,
        from: "stock",
        fromIdx: i,
      });
    });
    // Show as many fanned waste cards as the current drawCount (1/2/3).
    const wasteDisplay = state.drawCount;
    const wasteOffset = Math.round(dims.cw * 0.26);
    state.waste.forEach((c, i) => {
      const p = pileOrigin["waste"];
      const fromTop = state.waste.length - 1 - i;
      const offsetSlot = fromTop < wasteDisplay ? wasteDisplay - 1 - fromTop : 0;
      map.set(c.id, {
        x: p.x + offsetSlot * wasteOffset,
        y: p.y,
        z: i,
        draggable: i === state.waste.length - 1,
        from: "waste",
        fromIdx: i,
      });
    });
    for (let f = 0; f < 4; f++) {
      const pile = state.foundations[f];
      const p = pileOrigin[`f${f}`];
      pile.forEach((c, i) => {
        map.set(c.id, {
          x: p.x,
          y: p.y,
          z: i,
          draggable: i === pile.length - 1,
          from: `f${f}` as PileId,
          fromIdx: i,
        });
      });
    }
    for (let t = 0; t < 7; t++) {
      const pile = state.tableau[t];
      const p = pileOrigin[`t${t}`];
      let y = p.y;
      pile.forEach((c, i) => {
        map.set(c.id, {
          x: p.x,
          y,
          z: i,
          draggable: c.faceUp,
          from: `t${t}` as PileId,
          fromIdx: i,
        });
        y += c.faceUp ? dims.faceUpGap : dims.faceDownGap;
      });
    }
    return map;
  }, [state, pileOrigin, dims]);

  // Detect cards whose position changed between renders and lift them.
  useEffect(() => {
    const prev = prevPosRef.current;
    const next = new Map<string, { x: number; y: number }>();
    const moved = new Set<string>();
    cardTransforms.forEach((info, id) => {
      next.set(id, { x: info.x, y: info.y });
      const p = prev.get(id);
      if (p && (Math.abs(p.x - info.x) > 1 || Math.abs(p.y - info.y) > 1)) {
        moved.add(id);
      }
    });
    prevPosRef.current = next;
    if (moved.size) {
      setLiftedIds(moved);
      const t = window.setTimeout(() => setLiftedIds(new Set()), 420);
      return () => window.clearTimeout(t);
    }
  }, [cardTransforms]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, card: Card) => {
      if (isAutoRunning) return;
      if (e.button !== 0) return;
      const info = cardTransforms.get(card.id);
      if (!info || !info.draggable) return;
      if (info.from === "stock") return;

      let cards: Card[] = [];
      if (info.from.startsWith("t")) {
        const pile = state.tableau[Number(info.from[1])];
        cards = pile.slice(info.fromIdx);
        if (!cards.every((c) => c.faceUp)) return;
      } else if (info.from === "waste") {
        cards = [state.waste[state.waste.length - 1]];
      } else if (info.from.startsWith("f")) {
        const pile = state.foundations[Number(info.from[1])];
        cards = [pile[pile.length - 1]];
      }
      if (!cards.length) return;

      const frameRect = frameRef.current!.getBoundingClientRect();
      const boardEl = (e.currentTarget as HTMLElement).parentElement!;
      const boardRect = boardEl.getBoundingClientRect();
      const px = e.clientX - boardRect.left;
      const py = e.clientY - boardRect.top;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDrag({
        from: info.from,
        cards,
        startX: px,
        startY: py,
        offsetX: px - info.x,
        offsetY: py - info.y,
        x: info.x,
        y: info.y,
        pointerId: e.pointerId,
        hoverPile: null,
        didMove: false,
        vx: 0,
        lastMoveX: px,
        lastMoveT: performance.now(),
      });
      // Prevent native text-select
      e.preventDefault();
      // unused vars for TS
      void frameRect;
    },
    [cardTransforms, state.tableau, state.waste, state.foundations, isAutoRunning],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;
      if (e.pointerId !== drag.pointerId) return;
      const boardEl = pileRefs.current["stock"]?.parentElement;
      if (!boardEl) return;
      const boardRect = boardEl.getBoundingClientRect();
      const px = e.clientX - boardRect.left;
      const py = e.clientY - boardRect.top;
      const dx = px - drag.startX;
      const dy = py - drag.startY;
      const didMove = drag.didMove || Math.abs(dx) + Math.abs(dy) > 4;
      const x = px - drag.offsetX;
      const y = py - drag.offsetY;
      const hover = detectHover(px, py, drag.from, drag.cards.length, pileRefs.current, boardRect);
      // Smoothed horizontal velocity for the drag tilt.
      const now = performance.now();
      const dt = Math.max(8, now - drag.lastMoveT);
      const rawVx = (px - drag.lastMoveX) / dt;
      const vx = drag.vx * 0.65 + rawVx * 0.35;
      setDrag({
        ...drag,
        x,
        y,
        hoverPile: hover,
        didMove,
        vx,
        lastMoveX: px,
        lastMoveT: now,
      });
    },
    [drag],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;
      if (e.pointerId !== drag.pointerId) return;
      const d = drag;
      setDrag(null);
      // Lift the cards that were being dragged for both the successful
      // target slide AND the snap-back animation. Without this, a rejected
      // drop (especially from / to a foundation) would animate its cards
      // *underneath* the other piles they pass through.
      const ids = new Set(d.cards.map((c) => c.id));
      setLiftedIds(ids);
      window.setTimeout(() => {
        setLiftedIds((cur) => {
          // Only clear if we still own the set (a newer move may have
          // replaced it through the cardTransforms effect).
          let same = cur.size === ids.size;
          if (same) for (const id of ids) if (!cur.has(id)) { same = false; break; }
          return same ? new Set() : cur;
        });
      }, 420);
      if (!d.didMove) {
        const ok = onAuto(d.from, d.cards.length);
        if (ok) play("place");
      } else if (d.hoverPile) {
        const ok = onMove(d.from, d.hoverPile, d.cards.length);
        if (ok) play("place");
      }
    },
    [drag, onAuto, onMove, play],
  );

  useEffect(() => {
    if (!drag) return;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [drag, handlePointerMove, handlePointerUp]);

  const onStockClick = useCallback(() => {
    if (isAutoRunning) return;
    play(state.stock.length > 0 ? "flip" : "shuffle");
    onDraw();
  }, [onDraw, state.stock.length, play, isAutoRunning]);

  const onCardDoubleClick = useCallback(
    (card: Card) => {
      const info = cardTransforms.get(card.id);
      if (!info || !info.draggable) return;
      if (info.from === "stock") return;
      const count = info.from.startsWith("t")
        ? state.tableau[Number(info.from[1])].length - info.fromIdx
        : 1;
      const ok = onAuto(info.from, count);
      if (ok) play("place");
    },
    [cardTransforms, state.tableau, onAuto, play],
  );

  const draggingIds = useMemo(
    () => new Set(drag?.cards.map((c) => c.id) ?? []),
    [drag],
  );

  const allCards = useMemo(() => {
    const out: Card[] = [];
    for (const c of state.stock) out.push(c);
    for (const c of state.waste) out.push(c);
    for (const f of state.foundations) for (const c of f) out.push(c);
    for (const t of state.tableau) for (const c of t) out.push(c);
    return out;
  }, [state]);

  const canAuto = canAutoComplete(state);
  const compactCards = dims.cw < 74;
  const maxColHeight = Math.max(
    ...state.tableau.map((col) => {
      let h = 0;
      col.forEach((c) => {
        h += c.faceUp ? dims.faceUpGap : dims.faceDownGap;
      });
      return h;
    }),
  );
  const boardHeight = tableauY + maxColHeight + dims.ch + 32;

  return (
    <div
      ref={frameRef}
      className="relative w-full h-full overflow-auto thin-scroll flex items-start justify-center"
      style={{ touchAction: "none" }}
    >
      <div
        className="relative"
        style={{ width: dims.w, height: boardHeight, margin: "16px 0" }}
      >
        {/* Stock */}
        <div
          ref={(el) => {
            pileRefs.current["stock"] = el;
          }}
          style={{
            position: "absolute",
            left: pileOrigin["stock"].x,
            top: pileOrigin["stock"].y,
          }}
        >
          <Pile
            id="stock"
            width={dims.cw}
            height={dims.ch}
            hot={showHint === "stock"}
            onClick={onStockClick}
            centerGlyph={state.stock.length === 0 && state.waste.length > 0 ? "↻" : state.stock.length === 0 && state.waste.length === 0 ? "∅" : ""}
          />
        </div>

        {/* Waste */}
        <div
          ref={(el) => {
            pileRefs.current["waste"] = el;
          }}
          style={{
            position: "absolute",
            left: pileOrigin["waste"].x,
            top: pileOrigin["waste"].y,
          }}
        >
          <Pile
            id="waste"
            width={dims.cw + Math.round(dims.cw * 0.52)}
            height={dims.ch}
            hot={showHint === "waste"}
            dashed={false}
          />
        </div>

        {/* Foundations */}
        {[0, 1, 2, 3].map((f) => (
          <div
            key={f}
            ref={(el) => {
              pileRefs.current[`f${f}`] = el;
            }}
            style={{
              position: "absolute",
              left: pileOrigin[`f${f}`].x,
              top: pileOrigin[`f${f}`].y,
            }}
          >
            <Pile
              id={`f${f}` as PileId}
              width={dims.cw}
              height={dims.ch}
              hot={showHint === `f${f}`}
              centerGlyph={
                <SuitIcon suit={FOUNDATION_SUITS[f]} size={Math.max(20, dims.ch * 0.28)} />
              }
              glyphMuted
            />
          </div>
        ))}

        {/* Tableau slots */}
        {[0, 1, 2, 3, 4, 5, 6].map((t) => (
          <div
            key={t}
            ref={(el) => {
              pileRefs.current[`t${t}`] = el;
            }}
            style={{
              position: "absolute",
              left: pileOrigin[`t${t}`].x,
              top: pileOrigin[`t${t}`].y,
            }}
          >
            <Pile
              id={`t${t}` as PileId}
              width={dims.cw}
              height={dims.ch}
              hot={showHint === `t${t}`}
              centerGlyph={
                state.tableau[t].length === 0 ? (
                  <FannedCardsGlyph size={Math.max(22, dims.ch * 0.32)} />
                ) : undefined
              }
              glyphMuted
            />
          </div>
        ))}

        {/* Cards */}
        {allCards.map((card) => {
          const info = cardTransforms.get(card.id)!;
          const isDragging = draggingIds.has(card.id);
          const isLifted = !isDragging && liftedIds.has(card.id);
          const dragIndex = isDragging ? drag!.cards.findIndex((c) => c.id === card.id) : -1;
          const x = isDragging ? drag!.x : info.x;
          const y = isDragging ? drag!.y + dragIndex * dims.faceUpGap : info.y;
          const z = isDragging
            ? 9000 + dragIndex
            : isLifted
              ? 5000 + info.z
              : info.z + (info.from.startsWith("t") ? 100 : 0);

          // Drag tilt: top card follows smoothed pointer velocity,
          // subsequent cards in the stack trail slightly for a natural
          // ribbon feel. Clamped to keep it subtle.
          const tiltMax = 10;
          const rawTilt = isDragging && drag ? drag.vx * 14 : 0;
          const tilt =
            rawTilt > tiltMax ? tiltMax : rawTilt < -tiltMax ? -tiltMax : rawTilt;
          const dragRotate = isDragging
            ? dragIndex === 0
              ? tilt
              : tilt * Math.max(0.25, 1 - dragIndex * 0.15)
            : 0;
          return (
            <motion.div
              key={card.id}
              initial={false}
              animate={{
                x,
                y,
                rotate: dragRotate,
                scale: isDragging ? 1.02 : 1,
              }}
              transition={
                isDragging
                  ? {
                      type: "spring",
                      stiffness: 1000,
                      damping: 55,
                      mass: 0.3,
                      rotate: { type: "spring", stiffness: 320, damping: 22, mass: 0.5 },
                    }
                  : { type: "spring", stiffness: 440, damping: 36, mass: 0.55 }
              }
              style={{
                position: "absolute",
                width: dims.cw,
                height: dims.ch,
                zIndex: z,
                pointerEvents: info.draggable || isDragging ? "auto" : "none",
              }}
              onPointerDown={(e) => handlePointerDown(e, card)}
              onDoubleClick={() => onCardDoubleClick(card)}
              className="relative will-change-transform"
            >
              <div
                className={clsx(
                  "w-full h-full rounded-[14px] relative",
                  isDragging ? "card-shadow-drag" : "card-shadow-1",
                )}
              >
                <CardView card={card} compact={compactCards} />
              </div>
            </motion.div>
          );
        })}

        {/* Hint ring overlay — spans the full card stack for tableau piles
            (top card through bottom of last card), single-card for waste /
            foundation. Wrapped in AnimatePresence so it fades out when the
            hint timeout clears instead of snapping away. */}
        <AnimatePresence>
          {showHint && (() => {
            const src = showHint;
            if (!src.startsWith("t") && src !== "waste" && !src.startsWith("f")) return null;
            const pile = pileRef(state, src);
            if (pile.length === 0) return null;

            const topInfo = cardTransforms.get(pile[0].id);
            const bottomInfo = cardTransforms.get(pile[pile.length - 1].id);
            if (!topInfo || !bottomInfo) return null;

            // For tableau, the stack extends from the top card's y to the
            // bottom card's y + card height. For waste / foundation, both
            // refs resolve to the same card so the ring fits one card.
            const top = topInfo.y;
            const bottom = bottomInfo.y + dims.ch;

            return (
              <motion.div
                key={src}
                className="hint-ring"
                aria-hidden
                style={{
                  left: topInfo.x - 4,
                  top: top - 4,
                  width: dims.cw + 8,
                  height: bottom - top + 8,
                }}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{
                  duration: 0.22,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              />
            );
          })()}
        </AnimatePresence>

        {/* Auto-complete button */}
        <AnimatePresence>
          {canAuto && !state.won && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={onAutoComplete}
              disabled={isAutoRunning}
              className="absolute left-1/2 -translate-x-1/2 px-4 h-9 pill-accent text-[13px] font-medium focus-ring"
              style={{ top: topRowY + dims.ch + 2 }}
            >
              Auto-complete
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function detectHover(
  x: number,
  y: number,
  from: PileId,
  count: number,
  refs: Record<string, HTMLDivElement | null>,
  boardRect: DOMRect,
): PileId | null {
  const candidates: PileId[] = [];
  if (count === 1) {
    candidates.push("f0", "f1", "f2", "f3");
  }
  for (let i = 0; i < 7; i++) candidates.push(`t${i}` as PileId);

  let best: PileId | null = null;
  let bestArea = 0;
  for (const id of candidates) {
    if (id === from) continue;
    const el = refs[id];
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const rx = r.left - boardRect.left;
    const ry = r.top - boardRect.top;
    const extendDown = id.startsWith("t") ? 800 : 0;
    const left = rx - 8;
    const right = rx + r.width + 8;
    const top = ry - 8;
    const bottom = ry + r.height + extendDown;
    if (x >= left && x <= right && y >= top && y <= bottom) {
      const area = (right - left) * (bottom - top);
      if (best === null || area < bestArea) {
        best = id;
        bestArea = area;
      }
    }
  }
  return best;
}

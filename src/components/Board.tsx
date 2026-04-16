import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Card as CardView } from "./Card";
import { Pile } from "./Pile";
import { canAutoComplete } from "../game/engine";
import type { Card, GameState, PileId } from "../game/types";

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
};

const SUIT_SYMBOLS: Record<string, string> = { S: "♠", H: "♥", D: "♦", C: "♣" };
const FOUNDATION_LABELS = ["spades", "hearts", "diamonds", "clubs"];
const FOUNDATION_SUITS = ["S", "H", "D", "C"];

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
  const [dims, setDims] = useState({ w: 980, h: 680, cw: 82, ch: 114, gap: 14, faceUpGap: 26, faceDownGap: 12 });
  const [drag, setDrag] = useState<DragState | null>(null);

  // Compute sizes responsively based on frame size
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => {
      const rect = frame.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const targetW = Math.min(1080, Math.max(680, w - 24));
      const cw = Math.floor((targetW - 14 * 6) / 7);
      const ch = Math.round(cw * 1.42);
      const gap = Math.round(cw * 0.17);
      setDims({
        w: targetW,
        h,
        cw,
        ch,
        gap,
        faceUpGap: Math.round(ch * 0.24),
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

  const topRowY = 18;
  const tableauY = 18 + dims.ch + 34;

  // Coordinates for each pile's top-left
  const pileOrigin = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    const innerW = dims.w;
    const xStart = Math.max(0, (innerW - (dims.cw * 7 + dims.gap * 6)) / 2);
    map["stock"] = { x: xStart, y: topRowY };
    map["waste"] = { x: xStart + dims.cw + dims.gap, y: topRowY };
    for (let i = 0; i < 4; i++) {
      map[`f${i}`] = { x: xStart + (dims.cw + dims.gap) * (3 + i), y: topRowY };
    }
    for (let i = 0; i < 7; i++) {
      map[`t${i}`] = { x: xStart + (dims.cw + dims.gap) * i, y: tableauY };
    }
    return map;
  }, [dims]);

  // Compute every card's target position
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
    // waste: show last few offset horizontally for draw-3
    const wasteDisplay = state.drawCount === 3 ? 3 : 1;
    const wasteOffset = Math.round(dims.cw * 0.22);
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
      const px = e.clientX - frameRect.left;
      const py = e.clientY - frameRect.top;
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
      });
    },
    [cardTransforms, state.tableau, state.waste, state.foundations, isAutoRunning],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;
      if (e.pointerId !== drag.pointerId) return;
      const frameRect = frameRef.current!.getBoundingClientRect();
      const px = e.clientX - frameRect.left;
      const py = e.clientY - frameRect.top;
      const dx = px - drag.startX;
      const dy = py - drag.startY;
      const didMove = drag.didMove || Math.abs(dx) + Math.abs(dy) > 4;
      const x = px - drag.offsetX;
      const y = py - drag.offsetY;
      const hover = detectHover(px, py, drag.from, drag.cards.length, pileRefs.current, frameRect);
      setDrag({ ...drag, x, y, hoverPile: hover, didMove });
    },
    [drag],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!drag) return;
      if (e.pointerId !== drag.pointerId) return;
      const d = drag;
      setDrag(null);
      if (!d.didMove) {
        // Treat as click: attempt auto-move to foundation/tableau
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

  return (
    <div
      ref={frameRef}
      className="relative w-full h-full overflow-auto thin-scroll"
      style={{ touchAction: "none" }}
    >
      <div
        className="relative mx-auto"
        style={{ width: dims.w, height: tableauY + dims.ch + dims.faceUpGap * 12 + 40 }}
      >
        {/* Top row: stock, waste, foundations */}
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
            label={state.stock.length === 0 ? "reset" : ""}
            suitHint={state.stock.length === 0 && state.waste.length === 0 ? "⊘" : ""}
          />
        </div>

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
            width={dims.cw + Math.round(dims.cw * 0.44)}
            height={dims.ch}
            hot={showHint === "waste"}
            dashed={false}
          />
        </div>

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
              hot={drag?.hoverPile === `f${f}` || showHint === `f${f}`}
              suitHint={SUIT_SYMBOLS[FOUNDATION_SUITS[f]]}
              label={FOUNDATION_LABELS[f]}
            />
          </div>
        ))}

        {/* Tableau columns */}
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
              hot={drag?.hoverPile === `t${t}` || showHint === `t${t}`}
              label={state.tableau[t].length === 0 ? "K" : ""}
            />
          </div>
        ))}

        {/* Cards */}
        {allCards.map((card) => {
          const info = cardTransforms.get(card.id)!;
          const isDragging = draggingIds.has(card.id);
          const dragIndex = isDragging ? drag!.cards.findIndex((c) => c.id === card.id) : -1;
          const x = isDragging ? drag!.x : info.x;
          const y = isDragging
            ? drag!.y + dragIndex * dims.faceUpGap
            : info.y;
          const z = isDragging ? 9000 + dragIndex : info.z + (info.from.startsWith("t") ? 100 : 0);

          return (
            <motion.div
              key={card.id}
              initial={false}
              animate={{ x, y, rotate: isDragging ? (dragIndex === 0 ? -1.2 : 0) : 0 }}
              transition={
                isDragging
                  ? { type: "spring", stiffness: 900, damping: 50, mass: 0.35 }
                  : { type: "spring", stiffness: 420, damping: 36, mass: 0.6 }
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
              className={clsx("relative will-change-transform")}
            >
              <div
                className={clsx(
                  "w-full h-full rounded-[10px] relative",
                  isDragging ? "card-shadow-drag" : info.z > 0 && info.from.startsWith("t") && card.faceUp ? "card-shadow-1" : "card-shadow-1",
                )}
                style={{ transform: isDragging ? "translateY(-2px)" : undefined }}
              >
                <CardView card={card} tiny={dims.cw < 78} />
              </div>
            </motion.div>
          );
        })}

        {/* Auto-complete button */}
        <AnimatePresence>
          {canAuto && !state.won && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={onAutoComplete}
              disabled={isAutoRunning}
              className={clsx(
                "absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-full focus-ring",
                "bg-[color:var(--accent)] text-[color:var(--bg)] font-display italic",
                "tracking-wide text-[14px] shadow-lg hover:brightness-110",
              )}
              style={{ top: topRowY + dims.ch + 8 }}
            >
              complete →
            </motion.button>
          )}
        </AnimatePresence>

        {/* Empty hint for stock reset */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: pileOrigin["stock"].x + dims.cw / 2 - 8,
            top: pileOrigin["stock"].y + dims.ch / 2 - 8,
          }}
        >
          {state.stock.length === 0 && state.waste.length > 0 && (
            <div className="font-display italic text-[color:var(--fg-soft)] opacity-60 text-[18px]">
              ↻
            </div>
          )}
        </div>
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
  frameRect: DOMRect,
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
    const rx = r.left - frameRect.left;
    const ry = r.top - frameRect.top;
    // For tableau columns, extend vertically to cover whole stack
    const extendDown = id.startsWith("t") ? 620 : 0;
    const left = rx - 8;
    const right = rx + r.width + 8;
    const top = ry - 8;
    const bottom = ry + r.height + extendDown;
    if (x >= left && x <= right && y >= top && y <= bottom) {
      // Choose the most specific overlap by area
      const area = (right - left) * (bottom - top);
      if (best === null || area < bestArea) {
        best = id;
        bestArea = area;
      }
    }
  }
  return best;
}


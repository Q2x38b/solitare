import { memo } from "react";
import clsx from "clsx";
import { colorOf, rankChar, suitChar } from "../game/engine";
import type { Card as CardT } from "../game/types";

interface Props {
  card: CardT;
  faceDown?: boolean;
  dim?: boolean;
  compact?: boolean;
}

function CardInner({ card, faceDown, dim, compact }: Props) {
  const hidden = faceDown || !card.faceUp;

  if (hidden) {
    return (
      <div
        className={clsx(
          "card-back absolute inset-0 rounded-[14px] overflow-hidden",
          "ring-1 ring-black/40",
        )}
        aria-label="Face-down card"
      />
    );
  }

  const color = colorOf(card.suit);
  const isRed = color === "red";
  const r = rankChar(card.rank);
  const s = suitChar(card.suit);

  const inkClass = isRed ? "text-[color:var(--color-card-red)]" : "text-[color:var(--color-card-ink)]";

  return (
    <div
      className={clsx(
        "card-face absolute inset-0 rounded-[14px] overflow-hidden",
        dim && "opacity-60",
      )}
      aria-label={`${r} of ${card.suit}`}
    >
      {/* Top-left rank + suit */}
      <div
        className={clsx(
          "absolute top-2 left-2 leading-none select-none tracking-tight",
          inkClass,
        )}
      >
        <div
          className="font-semibold"
          style={{
            fontSize: compact ? 18 : 22,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          {r}
        </div>
        <div
          className="mt-0.5"
          style={{
            fontSize: compact ? 13 : 15,
            lineHeight: 1,
          }}
        >
          {s}
        </div>
      </div>

      {/* Bottom-right rank + suit (small, mirrored) */}
      <div
        className={clsx(
          "absolute bottom-2 right-2 leading-none select-none tracking-tight text-right",
          inkClass,
        )}
      >
        <div
          className="font-semibold"
          style={{
            fontSize: compact ? 13 : 15,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          {r}
        </div>
        <div
          className="mt-0.5"
          style={{
            fontSize: compact ? 11 : 13,
            lineHeight: 1,
          }}
        >
          {s}
        </div>
      </div>
    </div>
  );
}

export const Card = memo(CardInner);

import { memo } from "react";
import clsx from "clsx";
import { colorOf, rankChar } from "../game/engine";
import type { Card as CardT } from "../game/types";
import { SuitIcon } from "./SuitIcon";

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
  const inkClass = isRed
    ? "text-[color:var(--color-card-red)]"
    : "text-[color:var(--color-card-ink)]";

  const rankSize = compact ? 18 : 22;
  const suitSize = compact ? 13 : 16;

  return (
    <div
      className={clsx(
        "card-face absolute inset-0 rounded-[14px] overflow-hidden",
        dim && "opacity-60",
      )}
      aria-label={`${r} of ${card.suit}`}
    >
      {/* Top-left */}
      <div className={clsx("absolute top-2 left-2 leading-none select-none", inkClass)}>
        <div
          className="font-semibold"
          style={{ fontSize: rankSize, lineHeight: 0.95, letterSpacing: "-0.03em" }}
        >
          {r}
        </div>
        <div className="mt-1">
          <SuitIcon suit={card.suit} size={suitSize} />
        </div>
      </div>

      {/* Bottom-right — rotated 180° so reading orientation matches top-left */}
      <div
        className={clsx(
          "absolute bottom-2 right-2 leading-none select-none",
          inkClass,
        )}
        style={{ transform: "rotate(180deg)", transformOrigin: "center" }}
      >
        <div
          className="font-semibold"
          style={{ fontSize: rankSize, lineHeight: 0.95, letterSpacing: "-0.03em" }}
        >
          {r}
        </div>
        <div className="mt-1">
          <SuitIcon suit={card.suit} size={suitSize} />
        </div>
      </div>
    </div>
  );
}

export const Card = memo(CardInner);

import { memo } from "react";
import clsx from "clsx";
import { colorOf, rankChar, suitChar } from "../game/engine";
import type { Card as CardT } from "../game/types";

interface Props {
  card: CardT;
  faceDown?: boolean;
  dim?: boolean;
  tiny?: boolean;
}

function CardInner({ card, faceDown, dim, tiny }: Props) {
  const hidden = faceDown || !card.faceUp;
  const color = colorOf(card.suit);
  const isRed = color === "red";

  if (hidden) {
    return (
      <div
        className={clsx(
          "card-back absolute inset-0 rounded-[10px] overflow-hidden",
          "ring-1 ring-black/30",
        )}
        aria-label="Face-down card"
      />
    );
  }

  const r = rankChar(card.rank);
  const s = suitChar(card.suit);

  return (
    <div
      className={clsx(
        "card-face absolute inset-0 rounded-[10px] overflow-hidden",
        "ring-1 ring-[color:color-mix(in_oklab,#000_16%,transparent)]",
        dim && "opacity-60",
      )}
      aria-label={`${r} of ${card.suit}`}
    >
      <div
        className={clsx(
          "absolute top-1.5 left-2 leading-none select-none",
          isRed ? "text-[color:var(--color-red)]" : "text-[color:var(--color-black)]",
        )}
      >
        <div
          className={clsx(
            "font-display tracking-tight",
            tiny ? "text-[15px]" : "text-[22px]",
          )}
          style={{ lineHeight: 0.9 }}
        >
          {r}
        </div>
        <div
          className={clsx(
            "text-center -mt-0.5",
            tiny ? "text-[12px]" : "text-[14px]",
            isRed ? "text-[color:var(--color-red-ink)]" : "text-[color:var(--color-black)]",
          )}
        >
          {s}
        </div>
      </div>

      <div
        className={clsx(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          isRed ? "text-[color:var(--color-red)]" : "text-[color:var(--color-black)]",
        )}
      >
        {card.rank === 11 || card.rank === 12 || card.rank === 13 ? (
          <FaceGlyph rank={card.rank} suit={s} isRed={isRed} />
        ) : (
          <div className="font-display text-[44px] opacity-85" style={{ lineHeight: 1 }}>
            {s}
          </div>
        )}
      </div>

      <div
        className={clsx(
          "absolute bottom-1.5 right-2 leading-none select-none rotate-180",
          isRed ? "text-[color:var(--color-red)]" : "text-[color:var(--color-black)]",
        )}
      >
        <div
          className={clsx(
            "font-display tracking-tight",
            tiny ? "text-[15px]" : "text-[22px]",
          )}
          style={{ lineHeight: 0.9 }}
        >
          {r}
        </div>
        <div
          className={clsx(
            "text-center -mt-0.5",
            tiny ? "text-[12px]" : "text-[14px]",
            isRed ? "text-[color:var(--color-red-ink)]" : "text-[color:var(--color-black)]",
          )}
        >
          {s}
        </div>
      </div>
    </div>
  );
}

function FaceGlyph({ rank, suit, isRed }: { rank: number; suit: string; isRed: boolean }) {
  const letter = rank === 11 ? "J" : rank === 12 ? "Q" : "K";
  return (
    <div className="relative flex items-center justify-center">
      <div
        className="absolute font-display italic opacity-15"
        style={{
          fontSize: 92,
          lineHeight: 1,
          color: isRed ? "var(--color-red)" : "var(--color-black)",
        }}
      >
        {letter}
      </div>
      <div
        className="relative font-display"
        style={{
          fontSize: 34,
          lineHeight: 1,
          color: isRed ? "var(--color-red-ink)" : "var(--color-black)",
        }}
      >
        {suit}
      </div>
    </div>
  );
}

export const Card = memo(CardInner);

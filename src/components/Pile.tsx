import { forwardRef, type ReactNode } from "react";
import clsx from "clsx";
import type { PileId } from "../game/types";

interface Props {
  id: PileId;
  centerGlyph?: ReactNode;
  glyphMuted?: boolean;
  glyphSize?: number;
  hot?: boolean;
  dashed?: boolean;
  onClick?: () => void;
  width: number;
  height: number;
  children?: ReactNode;
}

export const Pile = forwardRef<HTMLDivElement, Props>(function Pile(
  { id, centerGlyph, glyphMuted, glyphSize, hot, dashed = true, onClick, width, height, children },
  ref,
) {
  return (
    <div
      ref={ref}
      data-pile={id}
      onClick={onClick}
      className={clsx(
        "relative rounded-[14px] select-none transition-[box-shadow,background-color,border-color] duration-200",
        dashed && "slot",
        hot && "slot-hot",
        onClick && "cursor-pointer",
      )}
      style={{ width, height }}
    >
      {centerGlyph !== undefined && centerGlyph !== "" && (
        <div
          className={clsx(
            "absolute inset-0 grid place-items-center pointer-events-none",
            glyphMuted ? "text-[color:var(--fg-dim)]" : "text-[color:var(--fg-soft)]",
          )}
          style={{
            fontSize: glyphSize ?? Math.max(18, height * 0.3),
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          <span className="font-semibold tracking-tight inline-flex items-center justify-center">
            {centerGlyph}
          </span>
        </div>
      )}
      {children}
    </div>
  );
});

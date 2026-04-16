import { forwardRef } from "react";
import clsx from "clsx";
import type { PileId } from "../game/types";

interface Props {
  id: PileId;
  centerGlyph?: string;
  glyphMuted?: boolean;
  hot?: boolean;
  dashed?: boolean;
  onClick?: () => void;
  width: number;
  height: number;
  children?: React.ReactNode;
}

export const Pile = forwardRef<HTMLDivElement, Props>(function Pile(
  { id, centerGlyph, glyphMuted, hot, dashed = true, onClick, width, height, children },
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
      {centerGlyph && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div
            className={clsx(
              "font-semibold tracking-tight",
              glyphMuted ? "text-[color:var(--fg-dim)]" : "text-[color:var(--fg-soft)]",
            )}
            style={{ fontSize: Math.max(18, height * 0.32), lineHeight: 1, letterSpacing: "-0.03em" }}
          >
            {centerGlyph}
          </div>
        </div>
      )}
      {children}
    </div>
  );
});

import { forwardRef } from "react";
import clsx from "clsx";
import type { PileId } from "../game/types";

interface Props {
  id: PileId;
  label?: string;
  suitHint?: string;
  hot?: boolean;
  dashed?: boolean;
  onClick?: () => void;
  width: number;
  height: number;
  children?: React.ReactNode;
}

export const Pile = forwardRef<HTMLDivElement, Props>(function Pile(
  { id, label, suitHint, hot, dashed = true, onClick, width, height, children },
  ref,
) {
  return (
    <div
      ref={ref}
      data-pile={id}
      onClick={onClick}
      className={clsx(
        "relative rounded-[12px] select-none transition-[box-shadow,background-color,border-color] duration-200",
        dashed && "slot",
        hot && "slot-hot",
      )}
      style={{ width, height }}
    >
      {(label || suitHint) && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            {suitHint && (
              <div
                className="font-display opacity-30"
                style={{ fontSize: Math.max(20, height * 0.28), lineHeight: 1 }}
              >
                {suitHint}
              </div>
            )}
            {label && (
              <div className="font-display italic text-[color:var(--fg-soft)] opacity-60 text-[12px] tracking-wider uppercase mt-1">
                {label}
              </div>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
});

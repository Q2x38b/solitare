import type { SVGProps } from "react";

interface Props extends Omit<SVGProps<SVGSVGElement>, "children"> {
  size?: number | string;
}

export function FannedCardsGlyph({ size = "1em", style, ...rest }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      style={{ display: "block", ...style }}
      {...rest}
    >
      <g transform="rotate(-16 14 18)">
        <rect x="8" y="8.8" width="12" height="17" rx="2" />
      </g>
      <g transform="rotate(16 18 18)">
        <rect x="12" y="7.6" width="12" height="17" rx="2" />
      </g>
    </svg>
  );
}

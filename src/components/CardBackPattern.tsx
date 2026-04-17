// Card-back pattern: dark panel with a handful of chunky, fully-rounded
// diagonal pill stripes. Drawn as SVG so each stripe has truly round
// end-caps (a CSS repeating gradient can't do that).

interface Props {
  inset?: number;
  radius?: number;
}

// viewBox chosen close to the 82×116 card proportions we actually render;
// preserveAspectRatio="slice" scales and crops without distorting the pills.
const VB_W = 100;
const VB_H = 140;

// Stripes are placed along the Y axis then rotated -45° through the centre
// of the viewBox. Thickness + step tuned so ~5–6 bars are visible per card
// with clear dark gaps between them.
// Step/thickness picked so the gap is small (6 units) and the phase is
// offset so a stripe lands right at the bottom-right corner of the card
// after the -45° rotation — avoids the oversized dark wedge there.
const STRIPE_THICKNESS = 16;
const STRIPE_STEP = 22;
const STRIPE_X = -100;
const STRIPE_WIDTH = 300;
const FIRST_Y = -110;
const LAST_Y = 260;

export function CardBackPattern({ inset = 8, radius = 6 }: Props) {
  const ys: number[] = [];
  for (let y = FIRST_Y; y <= LAST_Y; y += STRIPE_STEP) ys.push(y);

  return (
    <svg
      aria-hidden
      className="absolute overflow-hidden"
      style={{ inset, borderRadius: radius }}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={VB_W} height={VB_H} fill="#1d1d1f" />
      <g transform={`rotate(-45 ${VB_W / 2} ${VB_H / 2})`}>
        {ys.map((y) => (
          <rect
            key={y}
            x={STRIPE_X}
            y={y}
            width={STRIPE_WIDTH}
            height={STRIPE_THICKNESS}
            rx={STRIPE_THICKNESS / 2}
            ry={STRIPE_THICKNESS / 2}
            fill="#4a4a4e"
          />
        ))}
      </g>
    </svg>
  );
}

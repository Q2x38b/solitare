// Card-back pattern: panel with fully-rounded diagonal pill stripes.
// Uses preserveAspectRatio="xMidYMid slice" (not "none") so the pills
// stay perfectly round. The viewBox aspect (100 × 150) closely matches
// the 8px-framed slot aspect, and the stripe phase is tuned so both
// diagonal corners land inside a stripe — no dead wedges, no stretch.

interface Props {
  inset?: number;
  radius?: number;
}

const VB_W = 100;
const VB_H = 150;

// Chunky bars, modest gap, phase offset to cover both corners after the
// -45° rotation. See top-of-file notes in git history for the derivation.
const STRIPE_THICKNESS = 26;
const STRIPE_STEP = 36;
const STRIPE_X = -160;
const STRIPE_WIDTH = 420;
const FIRST_Y = -200;
const LAST_Y = 240;

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
      <rect width={VB_W} height={VB_H} fill="var(--card-back-panel)" />
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
            fill="var(--card-back-stripe)"
          />
        ))}
      </g>
    </svg>
  );
}

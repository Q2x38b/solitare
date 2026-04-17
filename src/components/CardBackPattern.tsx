// Card-back pattern: panel with fully-rounded diagonal pill stripes.
// Drawn as SVG so each stripe has truly round end-caps (a CSS repeating
// gradient can't do that). Colours pull from CSS vars so light + dark
// themes both look intentional.

interface Props {
  inset?: number;
  radius?: number;
}

// viewBox tuned close to the 82×116 card aspect (~0.707). The stripes are
// laid out horizontally then rotated -45° through the centre, with enough
// over-spill on all sides that the pattern tiles the full slice-cropped
// visible area without any dead wedges.
const VB_W = 100;
const VB_H = 140;

// Dense: 13-unit thickness, 17-unit step (gap 4). Extended Y range covers
// both the top-left and bottom-right corners after rotation.
const STRIPE_THICKNESS = 13;
const STRIPE_STEP = 17;
const STRIPE_X = -120;
const STRIPE_WIDTH = 340;
const FIRST_Y = -180;
const LAST_Y = 320;

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
      <rect
        width={VB_W}
        height={VB_H}
        fill="var(--card-back-panel)"
      />
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

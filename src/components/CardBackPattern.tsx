// Card-back pattern: panel with fully-rounded diagonal pill stripes.
// Stripes are generated symmetrically around the viewBox centre, and the
// viewBox is rotated -45° through that same centre — giving the pattern
// 180° rotational symmetry, so where stripes enter at the top-left they
// exit at the bottom-right at the matching angle/offset.

interface Props {
  inset?: number;
  radius?: number;
}

const VB_W = 100;
const VB_H = 150;
const CENTER_Y = VB_H / 2; // 75

// Thickness / step derived so both diagonal corners of the viewBox land
// inside a stripe after the -45° rotation (corners map to pre-rotation
// y ≈ -13.4 and y ≈ 163.4). The nearest stripes at k=±3 sit at y=-15 /
// y=165, which with thickness 24 cover [-27,-3] and [153,177] — both
// corners comfortably inside the pattern.
const STRIPE_THICKNESS = 24;
const STRIPE_STEP = 30;
const STRIPE_X = -160;
const STRIPE_WIDTH = 420;
// ±4 steps on each side of centre = 9 stripes rendered. Rotation clips
// to ~7 visible; the outer two provide slack for card aspect variance.
const HALF_SPAN = 4;

export function CardBackPattern({ inset = 8, radius = 6 }: Props) {
  const ys: number[] = [];
  for (let k = -HALF_SPAN; k <= HALF_SPAN; k++) {
    ys.push(CENTER_Y + k * STRIPE_STEP);
  }

  return (
    <svg
      aria-hidden
      className="absolute overflow-hidden"
      style={{ inset, borderRadius: radius }}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={VB_W} height={VB_H} fill="var(--card-back-panel)" />
      <g transform={`rotate(-45 ${VB_W / 2} ${CENTER_Y})`}>
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

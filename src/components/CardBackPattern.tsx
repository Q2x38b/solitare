// Card-back pattern: panel with fully-rounded diagonal pill stripes.
// The SVG uses preserveAspectRatio="none" with a viewBox whose aspect
// matches the slot, so the pattern fills edge-to-edge (no bottom wedge).
// Because we pick the viewBox aspect to match, the pills don't distort.

interface Props {
  inset?: number;
  radius?: number;
}

// Target aspect matches an 82×116 card slot minus the 8px frame on each
// side: ~66×100, aspect 0.66. We use a nominal 100-unit wide viewBox and
// compute the height from the aspect so the SVG coordinate system is
// consistent regardless of actual card size.
const VB_W = 100;
const VB_H = 150;

// Fewer, cleaner stripes — tuned so ~8 pills are visible without leaving
// corner wedges empty. Thickness 22, step 36 → gap 14.
const STRIPE_THICKNESS = 22;
const STRIPE_STEP = 36;
const STRIPE_X = -160;
const STRIPE_WIDTH = 420;
// Y range generous enough to cover both rotated corners.
const FIRST_Y = -200;
const LAST_Y = 340;

export function CardBackPattern({ inset = 8, radius = 6 }: Props) {
  const ys: number[] = [];
  for (let y = FIRST_Y; y <= LAST_Y; y += STRIPE_STEP) ys.push(y);

  return (
    <svg
      aria-hidden
      className="absolute overflow-hidden"
      style={{ inset, borderRadius: radius }}
      // Stretch so the viewBox maps 1:1 to the slot — eliminates the
      // slice-cropping wedge that was showing at the card's bottom-right.
      preserveAspectRatio="none"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="100%"
      height="100%"
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

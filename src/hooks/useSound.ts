import { useCallback, useRef } from "react";

type SoundName = "flip" | "place" | "shuffle" | "win" | "click";

function createBeep(ctx: AudioContext, freq: number, dur: number, type: OscillatorType = "sine", gain = 0.08) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur + 0.02);
}

export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      try {
        if (!ctxRef.current) {
          ctxRef.current = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") ctx.resume();
        switch (name) {
          case "flip":
            createBeep(ctx, 520, 0.06, "triangle", 0.05);
            setTimeout(() => createBeep(ctx, 720, 0.05, "triangle", 0.04), 30);
            break;
          case "place":
            createBeep(ctx, 220, 0.08, "sine", 0.07);
            break;
          case "shuffle":
            createBeep(ctx, 160, 0.15, "sawtooth", 0.04);
            setTimeout(() => createBeep(ctx, 200, 0.12, "sawtooth", 0.04), 70);
            break;
          case "win":
            [523, 659, 784, 1046].forEach((f, i) =>
              setTimeout(() => createBeep(ctx, f, 0.22, "triangle", 0.06), i * 110),
            );
            break;
          case "click":
            createBeep(ctx, 880, 0.04, "square", 0.03);
            break;
        }
      } catch {
        // ignore
      }
    },
    [enabled],
  );

  return play;
}

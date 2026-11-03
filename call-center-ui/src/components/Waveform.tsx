import { useRef } from "react";
import { useVoiceLevel } from "../useVoiceLevel";

// Resting height and how much each bar grows with the voice level.
const BARS = [
  [0.22, 0.4], [0.4, 0.6], [0.6, 0.9], [0.45, 0.7], [0.8, 1.1], [0.55, 0.9],
  [0.75, 1.0], [0.35, 0.6], [0.6, 0.8], [0.28, 0.5], [0.45, 0.6], [0.2, 0.35],
];

/** Voice waveform whose bars move with the live audio level. */
export function Waveform({ live, dark = false }: { live: boolean; dark?: boolean }) {
  const wrap = useRef<HTMLDivElement>(null);
  useVoiceLevel(wrap, live);

  return (
    <div
      ref={wrap}
      aria-hidden
      className={`wave flex h-14 items-center justify-center gap-1 ${live ? "" : "dim"} ${dark ? "on-dark" : ""}`}
    >
      {BARS.map(([base, gain], i) => (
        <span
          key={i}
          style={{ ["--base" as string]: live ? base * 0.6 : 0.12, ["--gain" as string]: gain } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

import { useRef } from "react";
import type { Speaker } from "../useCall";
import { useVoiceLevel } from "../useVoiceLevel";

type Props = { live: boolean; busy: boolean; speaker: Speaker; size?: number };

/** Agent orb that pulses with the bot's (or caller's) voice level. */
export function Orb({ live, busy, speaker, size = 220 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  useVoiceLevel(wrap, live);

  const mode = busy ? "connecting" : !live ? "idle" : speaker === "user" ? "user" : "";

  return (
    <div ref={wrap} className="orb-wrap" style={{ width: size }} aria-hidden>
      <div className="orb-ring" />
      <div className="orb-ring r2" />
      <div className={`orb ${mode}`} />
    </div>
  );
}

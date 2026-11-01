import { useEffect, useRef } from "react";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import type { Speaker } from "../useCall";

type Props = { live: boolean; busy: boolean; speaker: Speaker };

/** Agent orb that pulses with the bot's (or caller's) voice level. */
export function Orb({ live, busy, speaker }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const current = useRef(0);
  const botLevel = useRef(0);
  const userLevel = useRef(0);

  useRTVIClientEvent(RTVIEvent.RemoteAudioLevel, (level: number) => {
    botLevel.current = level;
  });
  useRTVIClientEvent(RTVIEvent.LocalAudioLevel, (level: number) => {
    userLevel.current = level;
  });

  // Smooth the level with rAF and write a CSS variable (no React re-renders).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const raw = live ? Math.max(botLevel.current, userLevel.current * 0.7) : 0;
      const target = Math.min(1, raw * 3);
      current.current += (target - current.current) * 0.2;
      wrap.current?.style.setProperty("--level", current.current.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  const mode = busy ? "connecting" : !live ? "idle" : speaker === "user" ? "user" : "";

  return (
    <div ref={wrap} className="orb-wrap" aria-hidden>
      <div className="orb-ring r2" />
      <div className="orb-ring" />
      <div className={`orb ${mode}`} />
      <div className="orb-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-10 w-10">
          <path d="M4 13a8 8 0 0 1 16 0" strokeLinecap="round" />
          <rect x="2.5" y="12.5" width="4" height="6" rx="1.6" />
          <rect x="17.5" y="12.5" width="4" height="6" rx="1.6" />
          <path d="M19.5 18.5c0 1.6-2 2.5-5 2.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

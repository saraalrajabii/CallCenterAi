import { useEffect, useRef, type RefObject } from "react";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";

/**
 * Writes the current voice level (bot or caller, 0..1, smoothed) into the
 * `--level` CSS variable of `target`, every animation frame, without re-rendering.
 */
export function useVoiceLevel(target: RefObject<HTMLElement | null>, live: boolean) {
  const current = useRef(0);
  const bot = useRef(0);
  const user = useRef(0);

  useRTVIClientEvent(RTVIEvent.RemoteAudioLevel, (level: number) => {
    bot.current = level;
  });
  useRTVIClientEvent(RTVIEvent.LocalAudioLevel, (level: number) => {
    user.current = level;
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const raw = live ? Math.max(bot.current, user.current * 0.7) : 0;
      const goal = Math.min(1, raw * 3);
      current.current += (goal - current.current) * 0.2;
      target.current?.style.setProperty("--level", current.current.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, target]);
}

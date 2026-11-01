import { useCallback, useEffect, useRef, useState } from "react";
import { RTVIEvent, type TransportState } from "@pipecat-ai/client-js";
import {
  useConversationContext,
  usePipecatClient,
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";

export type Speaker = "none" | "bot" | "user";

export type LogEntry = { id: number; time: string; name: string; detail?: string };

let logId = 0;
const now = () => new Date().toLocaleTimeString("en-GB", { hour12: false });

/** Connection, speaking state, errors and an event log for the call screen. */
export function useCall() {
  const client = usePipecatClient();
  const state = usePipecatClientTransportState();
  const [speaker, setSpeaker] = useState<Speaker>("none");
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const { sendText } = useConversationContext();
  const pending = useRef<string | null>(null);

  const push = useCallback((name: string, detail?: unknown) => {
    const d =
      detail === undefined ? undefined : typeof detail === "string" ? detail : JSON.stringify(detail);
    setLog((l) => [...l.slice(-199), { id: ++logId, time: now(), name, detail: d }]);
  }, []);

  useRTVIClientEvent(RTVIEvent.TransportStateChanged, (s: TransportState) => {
    push("transportStateChanged", s);
    if (s === "ready") setStartedAt(Date.now());
    if (s === "disconnected" || s === "error") {
      setStartedAt(null);
      setSpeaker("none");
    }
  });
  useRTVIClientEvent(RTVIEvent.BotReady, () => push("botReady"));
  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, () => setSpeaker("bot"));
  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => setSpeaker((s) => (s === "bot" ? "none" : s)));
  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, () => setSpeaker("user"));
  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, () => setSpeaker((s) => (s === "user" ? "none" : s)));
  useRTVIClientEvent(RTVIEvent.Error, (msg) => {
    const data = msg?.data as { error?: string; message?: string } | undefined;
    const text = data?.error ?? data?.message ?? "حدث خطأ غير متوقع";
    push("error", text);
    setError(text);
  });
  useRTVIClientEvent(RTVIEvent.DeviceError, (e) => {
    push("deviceError", e);
    setError("تعذّر الوصول إلى الميكروفون. تأكدي من السماح للمتصفح باستخدامه.");
  });

  const isLive = state === "connected" || state === "ready";
  const isBusy = ["initializing", "initialized", "authenticating", "authenticated", "connecting", "disconnecting"].includes(state);

  const start = useCallback(async () => {
    if (!client) return;
    setError(null);
    push("connect", "/api/offer");
    try {
      // ICE servers (STUN locally, free TURN when deployed) come from the bot server.
      let iceServers: RTCIceServer[] = [{ urls: ["stun:stun.l.google.com:19302"] }];
      try {
        const res = await fetch("/api/ice");
        if (res.ok) iceServers = (await res.json()).iceServers;
      } catch {
        /* fall back to STUN */
      }
      push("iceServers", iceServers.map((s) => [s.urls].flat()[0]).join(", "));
      await client.connect({
        webrtcRequestParams: { endpoint: "/api/offer" },
        iceConfig: { iceServers },
      });
    } catch (e) {
      const text = e instanceof Error ? e.message : String(e);
      push("connectFailed", text);
      setError(
        "تعذّر الاتصال بالبوت. تأكد إن البوت شغّال ثم حاول مرة ثانية.",
      );
      try {
        await client.disconnect();
      } catch {
        /* already disconnected */
      }
    }
  }, [client, push]);

  const end = useCallback(async () => {
    push("disconnect");
    await client?.disconnect();
  }, [client, push]);

  // Send a typed question. If no call is active, start one and send it once the bot is ready.
  const ask = useCallback(
    async (text: string) => {
      if (state === "ready") {
        await sendText(text);
        return;
      }
      pending.current = text;
      if (!isLive && !isBusy) await start();
    },
    [state, isLive, isBusy, sendText, start],
  );

  useEffect(() => {
    if (state === "ready" && pending.current) {
      const text = pending.current;
      pending.current = null;
      sendText(text).catch(() => undefined);
    }
    if (state === "disconnected" || state === "error") pending.current = null;
  }, [state, sendText]);

  return { ask, state, isLive, isBusy, speaker, error, setError, log, clearLog: () => setLog([]), startedAt, start, end };
}

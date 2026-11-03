import { usePipecatClientMediaDevices, usePipecatClientMicControl } from "@pipecat-ai/client-react";
import { Icon } from "./icons";

type Props = { live: boolean; busy: boolean; onStart: () => void; onEnd: () => void };

/** Call / hang-up button, mute toggle and microphone picker (hero call card). */
export function Controls({ live, busy, onStart, onEnd }: Props) {
  const { isMicEnabled, enableMic } = usePipecatClientMicControl();
  const { availableMics, selectedMic, updateMic } = usePipecatClientMediaDevices();
  const muted = live && !isMicEnabled;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => enableMic(!isMicEnabled)}
          disabled={!live}
          aria-pressed={muted}
          aria-label={muted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
          className={`grid h-13 w-13 shrink-0 place-items-center rounded-2xl border transition disabled:opacity-40 ${
            muted ? "border-rose-200 bg-rose-50 text-rose-600" : "border-line bg-white text-ink hover:bg-soft"
          }`}
        >
          <Icon name={muted ? "micOff" : "mic"} />
        </button>
        <button
          type="button"
          onClick={live ? onEnd : onStart}
          disabled={busy}
          data-testid="call-button"
          className={`font-display flex h-13 flex-1 items-center justify-center gap-2.5 rounded-2xl px-5 text-[15px] font-bold transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
            live ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-ink text-white hover:bg-palm"
          }`}
        >
          <Icon name={live ? "hangup" : "phone"} />
          <span>{busy ? "جاري الاتصال…" : live ? "إنهاء المكالمة" : "اتصل بالمساعد"}</span>
        </button>
      </div>

      {availableMics.length > 1 && (
        <label className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>الميكروفون</span>
          <select
            value={"deviceId" in selectedMic ? selectedMic.deviceId : ""}
            onChange={(e) => updateMic(e.target.value)}
            className="max-w-56 truncate rounded-lg border border-line bg-ground px-2 py-1.5 text-ink focus:border-palm-500 focus:outline-none"
          >
            {availableMics.map((m) => (
              <option key={m.deviceId} value={m.deviceId}>
                {m.label || "ميكروفون"}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

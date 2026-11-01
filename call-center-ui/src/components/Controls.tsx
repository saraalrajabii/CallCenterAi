import { usePipecatClientMediaDevices, usePipecatClientMicControl } from "@pipecat-ai/client-react";

type Props = { live: boolean; busy: boolean; onStart: () => void; onEnd: () => void };

const PhoneIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`h-5 w-5 ${className}`}>
    <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" />
  </svg>
);

const MicIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" strokeLinecap="round" />
    {off && <path d="M4 4l16 16" strokeLinecap="round" />}
  </svg>
);

/** Call / hang-up button, mute toggle and microphone picker. */
export function Controls({ live, busy, onStart, onEnd }: Props) {
  const { isMicEnabled, enableMic } = usePipecatClientMicControl();
  const { availableMics, selectedMic, updateMic } = usePipecatClientMediaDevices();

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={live ? onEnd : onStart}
          disabled={busy}
          data-testid="call-button"
          className={`flex h-13 flex-1 items-center justify-center gap-2.5 rounded-2xl px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 ${
            live
              ? "bg-rose-600 shadow-rose-600/25 hover:bg-rose-700"
              : "bg-palm-600 shadow-palm-600/25 hover:bg-palm-700"
          }`}
        >
          <PhoneIcon className={live ? "rotate-[135deg]" : ""} />
          <span>{busy ? "جاري الاتصال…" : live ? "إنهاء المكالمة" : "اتصل بخدمة العملاء"}</span>
        </button>

        <button
          type="button"
          onClick={() => enableMic(!isMicEnabled)}
          disabled={!live}
          aria-pressed={!isMicEnabled}
          title={isMicEnabled ? "كتم الميكروفون" : "إلغاء الكتم"}
          className={`grid h-13 w-13 shrink-0 place-items-center rounded-2xl border p-3.5 transition disabled:opacity-40 ${
            !isMicEnabled
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-sand-200 bg-white text-ink/70 hover:border-palm-200 hover:text-palm-700"
          }`}
        >
          <MicIcon off={!isMicEnabled} />
        </button>
      </div>

      {availableMics.length > 0 && (
        <label className="flex w-full items-center justify-between gap-2 text-xs text-ink/50">
          <span>الميكروفون</span>
          <select
            value={"deviceId" in selectedMic ? selectedMic.deviceId : ""}
            onChange={(e) => updateMic(e.target.value)}
            className="max-w-60 truncate rounded-lg border border-sand-200 bg-sand-50 px-2 py-1.5 text-ink/80 focus:border-palm-500 focus:outline-none"
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

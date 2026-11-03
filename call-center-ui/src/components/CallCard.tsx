import type { useCall } from "../useCall";
import { Controls } from "./Controls";
import { Transcript } from "./Transcript";
import { Waveform } from "./Waveform";

type Call = ReturnType<typeof useCall>;

export const STATUS: Record<string, { label: string; tone: string; dot: string }> = {
  disconnected: { label: "متاح الآن", tone: "bg-[#EAF4EE] text-[#0F5132]", dot: "bg-palm-500" },
  initializing: { label: "تجهيز الميكروفون", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-500 live-dot" },
  initialized: { label: "متاح الآن", tone: "bg-[#EAF4EE] text-[#0F5132]", dot: "bg-palm-500" },
  authenticating: { label: "جاري الاتصال", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-500 live-dot" },
  authenticated: { label: "جاري الاتصال", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-500 live-dot" },
  connecting: { label: "جاري الاتصال", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-500 live-dot" },
  connected: { label: "متصل", tone: "bg-[#EAF4EE] text-[#0F5132]", dot: "bg-palm-500 live-dot" },
  ready: { label: "متصل", tone: "bg-[#EAF4EE] text-[#0F5132]", dot: "bg-palm-500 live-dot" },
  disconnecting: { label: "جاري الإنهاء", tone: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  error: { label: "خطأ", tone: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
};

export function speakerLine(call: Call) {
  if (call.isBusy) return "لحظات ونوصلك…";
  if (!call.isLive) return "مساعد صوتي ذكي";
  if (call.speaker === "bot") return "يتحدث الآن…";
  if (call.speaker === "user") return "يسمعك…";
  return "بانتظار سؤالك";
}

/** The live call widget shown in the hero. */
export function CallCard({ call, timer }: { call: Call; timer: string | null }) {
  const status = STATUS[call.state] ?? STATUS.disconnected;

  return (
    <section
      id="call"
      aria-label="مكالمة المساعد"
      className="w-full scroll-mt-6 rounded-[28px] bg-white p-5 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="orb-mini h-11 w-11 shrink-0" aria-hidden />
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">مساعد واحة النخيل</div>
            <div className="mt-0.5 text-xs text-muted">{speakerLine(call)}</div>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.tone}`}
          data-testid="status"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          <span>{status.label}</span>
          {timer && <span dir="ltr" className="font-mono">{timer}</span>}
        </span>
      </div>

      <div className="mb-4 mt-5 rounded-2xl bg-ground">
        <Waveform live={call.isLive} />
      </div>

      <Transcript live={call.isLive} onAsk={call.ask} />

      <div className="mt-4">
        <Controls live={call.isLive} busy={call.isBusy} onStart={call.start} onEnd={call.end} />
      </div>
    </section>
  );
}

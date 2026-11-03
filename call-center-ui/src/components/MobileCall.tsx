import { useState, type FormEvent } from "react";
import { usePipecatClientMicControl } from "@pipecat-ai/client-react";
import type { useCall } from "../useCall";
import { speakerLine } from "./CallCard";
import { Icon } from "./icons";
import { Orb } from "./Orb";
import { PartText, useChatMessages } from "./Transcript";

type Call = ReturnType<typeof useCall>;

const SUGGESTIONS = ["كم سعر التوصيل السريع؟", "توصلون يوم الجمعة؟", "كيف أرجع شحنة؟"];

/** Full-screen call view on phones, shown while a call is active. */
export function MobileCall({ call, timer, onMinimize }: { call: Call; timer: string | null; onMinimize: () => void }) {
  const messages = useChatMessages();
  const { isMicEnabled, enableMic } = usePipecatClientMicControl();
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const muted = call.isLive && !isMicEnabled;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastBot = [...messages].reverse().find((m) => m.role === "assistant");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    call.ask(t);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="مكالمة المساعد"
      className="fixed inset-0 z-50 flex flex-col gap-5 overflow-hidden bg-palm px-5 pb-6 pt-6 text-white md:hidden"
    >
      <header className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onMinimize}
          aria-label="تصغير المكالمة"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"
        >
          <Icon name="back" />
        </button>
        <div className="text-center">
          <div className="font-display text-base font-bold">مساعد واحة النخيل</div>
          <div dir="ltr" className="text-[13px] text-mist">{timer ?? "--:--"}</div>
        </div>
        <span className="h-11 w-11" aria-hidden />
      </header>

      <div className="grid place-items-center pt-2">
        <Orb live={call.isLive} busy={call.isBusy} speaker={call.speaker} size={210} />
        <p className="mt-3 flex items-center gap-2 text-[13px] text-mist">
          <span className="live-dot h-2 w-2 rounded-full bg-lime" />
          {speakerLine(call)}
        </p>
      </div>

      <section aria-label="النص المباشر" aria-live="polite" className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden">
        {lastUser && (
          <p className="m-0 line-clamp-2 text-sm leading-7 text-mist">
            أنت: {lastUser.parts.map((p, j) => <PartText key={j} text={p.text} />)}
          </p>
        )}
        {lastBot ? (
          <p className="font-display m-0 line-clamp-5 text-[21px] font-semibold leading-[1.6]">
            {lastBot.parts.map((p, j) => <PartText key={j} text={p.text} dimClass="text-white/45" />)}
          </p>
        ) : (
          <p className="font-display m-0 text-[21px] font-semibold leading-[1.6] text-white/60">
            {call.isBusy ? "جاري الاتصال بالمساعد…" : "تفضّل، اسأل سؤالك."}
          </p>
        )}
      </section>

      {typing ? (
        <form onSubmit={submit} className="flex gap-2">
          <label htmlFor="m-ask" className="sr-only-label">اكتب سؤالك</label>
          <input
            id="m-ask"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب سؤالك…"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 text-[15px] text-white placeholder:text-white/50 focus:outline-none"
          />
          <button type="submit" aria-label="إرسال" disabled={!draft.trim()} className="grid h-12 w-12 place-items-center rounded-2xl bg-lime text-ink disabled:opacity-40">
            <Icon name="send" className="h-5 w-5 -scale-x-100" />
          </button>
        </form>
      ) : (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => call.ask(q)}
              className="h-10 shrink-0 rounded-full border border-white/20 px-3.5 text-[13px] text-white"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-[28px] bg-white/[0.06] p-3">
        <button
          type="button"
          onClick={() => enableMic(!isMicEnabled)}
          disabled={!call.isLive}
          aria-pressed={muted}
          aria-label={muted ? "إلغاء كتم الميكروفون" : "كتم الميكروفون"}
          className={`grid h-14 w-14 place-items-center rounded-full disabled:opacity-40 ${muted ? "bg-white text-rose-600" : "bg-white/10"}`}
        >
          <Icon name={muted ? "micOff" : "mic"} className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setTyping((t) => !t)}
          aria-pressed={typing}
          aria-label="كتابة سؤال"
          className={`grid h-14 w-14 place-items-center rounded-full ${typing ? "bg-lime text-ink" : "bg-white/10"}`}
        >
          <Icon name="chat" className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={call.end}
          disabled={!call.isLive}
          aria-label="إنهاء المكالمة"
          className="grid h-14 flex-1 place-items-center rounded-full bg-rose-600 disabled:opacity-60"
        >
          <Icon name="hangup" className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

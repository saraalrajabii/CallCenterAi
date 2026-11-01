import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePipecatConversation, type BotOutputText } from "@pipecat-ai/client-react";

const isBotText = (t: unknown): t is BotOutputText =>
  !!t && typeof t === "object" && "spoken" in (t as object) && "unspoken" in (t as object);

function PartText({ text }: { text: ReactNode | BotOutputText }) {
  if (isBotText(text)) {
    return (
      <>
        <span>{text.spoken}</span>
        <span className="opacity-40">{text.unspoken}</span>
      </>
    );
  }
  return <>{text}</>;
}

/** Live conversation transcript plus a box to type a question. */
export function Transcript({ live, onAsk }: { live: boolean; onAsk: (text: string) => void }) {
  const { messages } = usePipecatConversation();
  const box = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

  const visible = messages.filter((m) => m.role === "user" || m.role === "assistant");

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    onAsk(text);
  };

  return (
    <section className="card flex h-full min-h-[380px] flex-col overflow-hidden rounded-3xl">
      <header className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">المحادثة المباشرة</h2>
          <p className="text-xs text-ink/45">نص المكالمة يظهر هنا أولاً بأول</p>
        </div>
        <span className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-ink/55">{visible.length} رسالة</span>
      </header>

      <div ref={box} className="scroll-thin max-h-[440px] flex-1 space-y-3 overflow-y-auto bg-sand-50/60 px-5 py-4" data-testid="transcript">
        {visible.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center text-ink/45">
            <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-palm-50 text-palm-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                <path d="M4 5h16v11H8l-4 4z" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm">{live ? "تفضّل، اسأل سؤالك بالصوت أو بالكتابة." : "اتصل بنا أو اكتب سؤالك لتبدأ المحادثة."}</p>
          </div>
        )}
        {visible.map((m, i) => {
          const mine = m.role === "user";
          return (
            <div key={`${m.createdAt}-${i}`} className={`bubble-in flex ${mine ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-7 ${
                  mine
                    ? "rounded-tr-md bg-palm-700 text-white"
                    : "rounded-tl-md border border-sand-200 bg-white text-ink shadow-sm"
                }`}
              >
                <div className={`mb-0.5 text-[11px] font-medium ${mine ? "text-white/60" : "text-palm-600"}`}>
                  {mine ? "أنت" : "مساعد واحة النخيل"}
                </div>
                {m.parts.map((p, j) => (
                  <PartText key={j} text={p.text} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-sand-200 bg-white p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="اكتب سؤالك هنا…"
          className="flex-1 rounded-xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-sm placeholder:text-ink/35 focus:border-palm-500 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-xl bg-palm-600 px-5 text-sm font-semibold text-white transition hover:bg-palm-700 disabled:cursor-not-allowed disabled:opacity-35"
        >
          إرسال
        </button>
      </form>
    </section>
  );
}

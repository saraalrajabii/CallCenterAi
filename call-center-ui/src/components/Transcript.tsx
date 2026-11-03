import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePipecatConversation, type BotOutputText, type ConversationMessage } from "@pipecat-ai/client-react";
import { Icon } from "./icons";

const isBotText = (t: unknown): t is BotOutputText =>
  !!t && typeof t === "object" && "spoken" in (t as object) && "unspoken" in (t as object);

export function PartText({ text, dimClass = "opacity-40" }: { text: ReactNode | BotOutputText; dimClass?: string }) {
  if (isBotText(text)) {
    return (
      <>
        <span>{text.spoken}</span>
        <span className={dimClass}>{text.unspoken}</span>
      </>
    );
  }
  return <>{text}</>;
}

/** User and assistant messages of the conversation, in order. */
export function useChatMessages(): ConversationMessage[] {
  const { messages } = usePipecatConversation();
  return messages.filter((m) => m.role === "user" || m.role === "assistant");
}

/** Compact live transcript plus a box to type a question (inside the hero call card). */
export function Transcript({ live, onAsk }: { live: boolean; onAsk: (text: string) => void }) {
  const messages = useChatMessages();
  const box = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");

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
    <div className="flex flex-col gap-3">
      <div
        ref={box}
        className="scroll-thin flex h-56 flex-col gap-2.5 overflow-y-auto"
        data-testid="transcript"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="m-auto max-w-64 text-center text-sm leading-7 text-muted">
            {live ? "تفضّل، اسأل بصوتك أو اكتب سؤالك." : "اضغط «اتصل بالمساعد» واسأل عن الأسعار أو التتبّع أو الإرجاع."}
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.role === "user";
            return (
              <div
                key={`${m.createdAt}-${i}`}
                className={`bubble-in max-w-[85%] px-3.5 py-2.5 text-[14px] leading-7 ${
                  mine
                    ? "self-start rounded-[16px_16px_16px_6px] bg-palm text-white"
                    : "self-end rounded-[16px_16px_6px_16px] bg-ground text-ink"
                }`}
              >
                <span className="sr-only-label">{mine ? "أنت: " : "المساعد: "}</span>
                {m.parts.map((p, j) => (
                  <PartText key={j} text={p.text} dimClass={mine ? "opacity-60" : "text-muted/70"} />
                ))}
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="ask-input" className="sr-only-label">
          اكتب سؤالك
        </label>
        <input
          id="ask-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="أو اكتب سؤالك هنا…"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-ground px-3.5 text-sm placeholder:text-muted/80 focus:border-palm-500 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="إرسال"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-palm text-lime transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Icon name="send" className="h-5 w-5 -scale-x-100" />
        </button>
      </form>
    </div>
  );
}

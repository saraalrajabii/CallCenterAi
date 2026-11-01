import type { LogEntry } from "../useCall";

/** Collapsible technical log, for debugging the bot connection. */
export function EventLog({ log, onClear }: { log: LogEntry[]; onClear: () => void }) {
  return (
    <details className="group rounded-2xl border border-sand-200 bg-white/70 text-xs">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-ink/50 hover:text-ink/80">
        <span>سجل الأحداث التقني ({log.length})</span>
        <span className="transition group-open:rotate-180">▾</span>
      </summary>
      <div className="border-t border-sand-200">
        <div dir="ltr" className="scroll-thin max-h-56 overflow-y-auto px-4 py-2 font-mono leading-6" data-testid="event-log">
          {log.length === 0 && <p className="text-ink/35">No events yet.</p>}
          {log.map((e) => (
            <div
              key={e.id}
              className={`truncate ${e.name.toLowerCase().includes("error") || e.name === "connectFailed" ? "text-rose-600" : "text-ink/55"}`}
              title={e.detail}
            >
              <span className="text-ink/35">{e.time}</span> <span className="text-ink/85">{e.name}</span> {e.detail}
            </div>
          ))}
        </div>
        <div className="flex justify-end px-3 pb-3">
          <button onClick={onClear} className="rounded-lg px-2 py-1 text-ink/45 hover:bg-sand-100 hover:text-ink/80">
            مسح السجل
          </button>
        </div>
      </div>
    </details>
  );
}

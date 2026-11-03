import type { LogEntry } from "../useCall";

/** Collapsible technical log, for debugging the bot connection. */
export function EventLog({ log, onClear }: { log: LogEntry[]; onClear: () => void }) {
  return (
    <details className="group rounded-2xl border border-line bg-white/70 text-xs">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-muted hover:text-ink">
        <span>سجل الأحداث التقني ({log.length})</span>
        <span className="transition group-open:rotate-180" aria-hidden>▾</span>
      </summary>
      <div className="border-t border-line">
        <div dir="ltr" className="scroll-thin max-h-56 overflow-y-auto px-4 py-2 font-mono leading-6" data-testid="event-log">
          {log.length === 0 && <p className="text-muted">No events yet.</p>}
          {log.map((e) => (
            <div
              key={e.id}
              className={`truncate ${e.name.toLowerCase().includes("error") || e.name === "connectFailed" ? "text-rose-700" : "text-muted"}`}
              title={e.detail}
            >
              <span className="text-muted/70">{e.time}</span> <span className="text-ink">{e.name}</span> {e.detail}
            </div>
          ))}
        </div>
        <div className="flex justify-end px-3 pb-3">
          <button onClick={onClear} className="min-h-9 rounded-lg px-2 text-muted hover:bg-soft hover:text-ink">
            مسح السجل
          </button>
        </div>
      </div>
    </details>
  );
}

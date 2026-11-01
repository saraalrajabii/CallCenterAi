import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Orb } from "./components/Orb";
import { Controls } from "./components/Controls";
import { Transcript } from "./components/Transcript";
import { EventLog } from "./components/EventLog";
import { useCall } from "./useCall";

/* ---------------------------------------------------------------- data */
// Mirrors knowledge.md so the page and the bot say the same thing.

const SERVICES = [
  { title: "توصيل عادي", desc: "داخل المدينة خلال 24 ساعة", price: 15, icon: "box" },
  { title: "توصيل سريع", desc: "داخل المدينة خلال 3 ساعات", price: 30, icon: "bolt", featured: true },
  { title: "بين المدن", desc: "من 2 إلى 3 أيام عمل", price: 35, icon: "route" },
  { title: "طرود كبيرة", desc: "أكثر من 20 كغ · 2 إلى 4 أيام", price: 60, icon: "truck" },
] as const;

const QUICK = [
  "كم سعر التوصيل السريع؟",
  "هل توصلون يوم الجمعة؟",
  "وصلتني الشحنة تالفة، وش أسوي؟",
  "كيف أرجع شحنة؟",
];

const CITIES = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "أبها"];

const STATUS: Record<string, { label: string; tone: string }> = {
  disconnected: { label: "متاح الآن", tone: "bg-palm-50 text-palm-700" },
  initializing: { label: "تجهيز الميكروفون", tone: "bg-amber-50 text-amber-700" },
  initialized: { label: "متاح الآن", tone: "bg-palm-50 text-palm-700" },
  authenticating: { label: "جاري الاتصال", tone: "bg-amber-50 text-amber-700" },
  authenticated: { label: "جاري الاتصال", tone: "bg-amber-50 text-amber-700" },
  connecting: { label: "جاري الاتصال", tone: "bg-amber-50 text-amber-700" },
  connected: { label: "متصل", tone: "bg-palm-600 text-white" },
  ready: { label: "متصل", tone: "bg-palm-600 text-white" },
  disconnecting: { label: "جاري الإنهاء", tone: "bg-amber-50 text-amber-700" },
  error: { label: "خطأ", tone: "bg-rose-50 text-rose-700" },
};

/* --------------------------------------------------------------- icons */

const Icon = ({ name, className = "h-6 w-6" }: { name: string; className?: string }) => {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, ReactNode> = {
    box: (<><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z" {...p} /><path d="M3 7.5 12 12l9-4.5M12 12v9" {...p} /></>),
    bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" {...p} />,
    route: (<><circle cx="6" cy="18" r="2.5" {...p} /><circle cx="18" cy="6" r="2.5" {...p} /><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5" {...p} /></>),
    truck: (<><path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8z" {...p} /><circle cx="6" cy="17.5" r="2" {...p} /><circle cx="17" cy="17.5" r="2" {...p} /></>),
    clock: (<><circle cx="12" cy="12" r="9" {...p} /><path d="M12 7v5l3 2" {...p} /></>),
    phone: <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" {...p} />,
    chat: <path d="M4 5h16v11H8l-4 4z" {...p} />,
    mail: (<><rect x="3" y="5" width="18" height="14" rx="2" {...p} /><path d="m3 7 9 6 9-6" {...p} /></>),
    search: (<><circle cx="11" cy="11" r="7" {...p} /><path d="m20 20-3.5-3.5" {...p} /></>),
    pin: (<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" {...p} /><circle cx="12" cy="9.5" r="2.5" {...p} /></>),
    shield: <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" {...p} />,
    star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" {...p} />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
};

const Logo = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <div className={`grid h-10 w-10 place-items-center rounded-xl ${light ? "bg-white/10 ring-1 ring-white/15" : "bg-palm-700"}`}>
      {/* palm leaves + motion lines */}
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <path d="M17 28c0-6 .5-11 1.5-15" stroke="#fbbf24" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M18.5 13c-2-4-6-5-10-3 3.5.2 6 1.3 10 3zM18.5 13c1-4.5 5-6.5 9-5.5-3.4 1-6 2.6-9 5.5zM18.5 13c-4.3-.2-7.5 2-8.5 6 2.4-2.6 5-4.3 8.5-6zM18.5 13c4 .3 6.8 3 7 7-2-2.8-4.4-4.8-7-7z" fill="#fff" />
        <path d="M3 22h6M5 26h5" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
    <div className="leading-tight">
      <div className={`text-[15px] font-bold ${light ? "text-white" : "text-ink"}`}>واحة النخيل</div>
      <div className={`text-[11px] font-medium tracking-wide ${light ? "text-white/60" : "text-ink/50"}`}>للتوصيل · PALM OASIS</div>
    </div>
  </div>
);

/* ---------------------------------------------------------------- hooks */

function useTimer(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return null;
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ app */

export default function App() {
  const call = useCall();
  const timer = useTimer(call.startedAt);
  const status = STATUS[call.state] ?? STATUS.disconnected;
  const [tracking, setTracking] = useState("");
  const [trackError, setTrackError] = useState<string | null>(null);

  const hint = call.isBusy
    ? "لحظات ونوصلك بالمساعد…"
    : !call.isLive
      ? "مساعد صوتي يرد عليك فوراً بدون انتظار"
      : call.speaker === "bot"
        ? "المساعد يتحدث…"
        : call.speaker === "user"
          ? "نسمعك…"
          : "تفضّل، كيف نقدر نخدمك؟";

  const submitTracking = (e: FormEvent) => {
    e.preventDefault();
    const id = tracking.trim().toUpperCase();
    if (!/^PO\d{8}$/.test(id)) {
      setTrackError("رقم الشحنة يبدأ بـ PO ثم 8 أرقام، مثل PO12345678");
      return;
    }
    setTrackError(null);
    call.ask(`أبغى أتتبع شحنتي رقم ${id}`);
    document.getElementById("support")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const askQuick = (q: string) => {
    call.ask(q);
    document.getElementById("support")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-full">
      {/* Utility bar */}
      <div className="bg-palm-900 text-[12px] text-white/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <span className="truncate">🚚 توصيل لـ 6 مدن في المملكة · الدفع عند الاستلام متاح</span>
          <span className="hidden shrink-0 items-center gap-1.5 sm:flex" dir="ltr">
            <Icon name="phone" className="h-3.5 w-3.5" /> 920000000
          </span>
        </div>
      </div>

      {/* Hero */}
      <div className="hero-bg">
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo light />
          <nav className="hidden items-center gap-7 text-sm text-white/75 md:flex">
            <a href="#services" className="hover:text-white">خدماتنا</a>
            <a href="#support" className="hover:text-white">خدمة العملاء</a>
            <a href="#contact" className="hover:text-white">تواصل معنا</a>
          </nav>
          <a href="#support" className="rounded-xl bg-sun-400 px-4 py-2 text-sm font-semibold text-palm-900 shadow-lg shadow-black/10 transition hover:bg-sun-300">
            تحدث معنا
          </a>
        </header>

        <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-24 lg:pt-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/85 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full bg-sun-400" /> خدمة عملاء بالذكاء الاصطناعي
            </span>
            <h1 className="mt-4 text-[34px] font-bold leading-[1.25] text-white sm:text-5xl sm:leading-[1.2]">
              شحنتك توصل أسرع،
              <br />
              <span className="text-sun-400">وسؤالك ينجاوب فوراً.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-white/70">
              تتبّع شحنتك، اعرف الأسعار، أو اطلب إرجاع — كلّم مساعدنا الصوتي مباشرة من المتصفح بدون انتظار على الخط.
            </p>

            <form onSubmit={submitTracking} className="mt-7 max-w-lg">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">
                <Icon name="search" className="mr-2 h-5 w-5 shrink-0 text-ink/40" />
                <input
                  value={tracking}
                  onChange={(e) => {
                    setTracking(e.target.value);
                    setTrackError(null);
                  }}
                  dir="ltr"
                  placeholder="PO12345678"
                  aria-label="رقم الشحنة"
                  className="min-w-0 flex-1 bg-transparent py-2 text-right text-[15px] tracking-wider placeholder:text-ink/30 focus:outline-none"
                />
                <button type="submit" className="shrink-0 rounded-xl bg-palm-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-palm-700">
                  تتبّع الشحنة
                </button>
              </div>
              <p className={`mt-2 text-xs ${trackError ? "text-sun-300" : "text-white/50"}`} data-testid="track-hint">
                {trackError ?? "أدخل رقم الشحنة وسيساعدك المساعد في تتبعها"}
              </p>
            </form>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-white">
              {[
                ["+٤٥٠", "موظف"],
                ["٦", "مدن رئيسية"],
                ["منذ ٢٠١٨", "في خدمتكم"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-xl font-bold">{n}</div>
                  <div className="text-xs text-white/55">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Route illustration */}
          <div className="relative hidden lg:block" aria-hidden>
            <svg viewBox="0 0 420 320" className="w-full">
              <path d="M40 260 C 120 260, 120 160, 210 160 S 300 60, 380 60" stroke="rgba(255,255,255,.35)" strokeWidth="3" fill="none" className="route" />
              <circle cx="40" cy="260" r="10" fill="#fbbf24" />
              <circle cx="40" cy="260" r="20" fill="rgba(251,191,36,.2)" />
              <g transform="translate(350 22)">
                <path d="M30 76s-24-21-24-39a24 24 0 0 1 48 0c0 18-24 39-24 39z" fill="#fff" />
                <circle cx="30" cy="37" r="9" fill="#0b5d3b" />
              </g>
              <g transform="translate(160 118)">
                <rect x="0" y="10" width="64" height="40" rx="6" fill="#fff" />
                <path d="M64 22h22l14 14v14H64z" fill="#fbbf24" />
                <rect x="72" y="26" width="14" height="10" rx="2" fill="#0b5d3b" opacity=".85" />
                <circle cx="18" cy="52" r="8" fill="#0a4a30" stroke="#fff" strokeWidth="3" />
                <circle cx="82" cy="52" r="8" fill="#0a4a30" stroke="#fff" strokeWidth="3" />
                <path d="M14 26h18M14 34h28" stroke="#0b5d3b" strokeWidth="3" strokeLinecap="round" />
                <path d="M-26 22h18M-34 32h22M-22 42h14" stroke="rgba(255,255,255,.45)" strokeWidth="3" strokeLinecap="round" />
              </g>
            </svg>
            <div className="absolute bottom-6 right-4 rounded-2xl bg-white/95 px-4 py-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs text-ink/55">
                <span className="h-2 w-2 rounded-full bg-palm-500" /> شحنة في الطريق
              </div>
              <div className="mt-0.5 text-sm font-semibold text-ink">الرياض ← جدة · ٢-٣ أيام</div>
            </div>
          </div>
        </section>
      </div>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Error banner */}
        {call.error && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" data-testid="error">
            <span className="mt-0.5">⚠</span>
            <p dir="auto" className="flex-1 break-words text-start leading-6">
              {call.error.toLowerCase().includes("api key")
                ? "مفتاح OpenAI غير صحيح أو منتهي. حدّث OPENAI_API_KEY في ملف .env وأعد تشغيل البوت."
                : call.error}
            </p>
            <button onClick={() => call.setError(null)} className="text-rose-400 hover:text-rose-700" aria-label="إغلاق">
              ✕
            </button>
          </div>
        )}

        {/* Support */}
        <section id="support" className="scroll-mt-6 pt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-sun-600">خدمة العملاء</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">كلّمنا مباشرة من المتصفح</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink/50">
              <Icon name="clock" className="h-4 w-4" /> الأحد–الخميس ٨ص–١٠م · الجمعة والسبت ٢م–١٠م
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Call card */}
            <div className="card flex flex-col items-center gap-5 rounded-3xl p-6">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-palm-50 text-palm-700">
                    <Icon name="chat" className="h-5 w-5" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">مساعد واحة النخيل</div>
                    <div className="text-xs text-ink/45">مساعد صوتي ذكي</div>
                  </div>
                </div>
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${status.tone}`} data-testid="status">
                  {call.isLive ? (
                    <span className="bars flex h-3.5 items-center gap-0.5"><span /><span /><span /><span /></span>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                  <span>{status.label}</span>
                  {timer && <span className="font-mono opacity-75" dir="ltr">{timer}</span>}
                </div>
              </div>

              <div className="py-3">
                <Orb live={call.isLive} busy={call.isBusy} speaker={call.speaker} />
              </div>

              <p className="min-h-6 text-center text-sm text-ink/60" aria-live="polite">
                {hint}
              </p>

              <Controls live={call.isLive} busy={call.isBusy} onStart={call.start} onEnd={call.end} />

              <div className="w-full border-t border-sand-200 pt-4">
                <p className="mb-2.5 text-xs font-medium text-ink/45">أسئلة شائعة — اضغط للسؤال</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => askQuick(q)}
                      className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-xs text-ink/75 transition hover:border-palm-200 hover:bg-palm-50 hover:text-palm-700"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Transcript live={call.isLive} onAsk={call.ask} />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-6 pt-16">
          <p className="text-sm font-semibold text-sun-600">خدماتنا وأسعارنا</p>
          <h2 className="mt-1 text-2xl font-bold sm:text-3xl">أسعار واضحة، بدون مفاجآت</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className={`relative rounded-3xl p-5 transition hover:-translate-y-0.5 ${
                  "featured" in s && s.featured ? "bg-palm-700 text-white shadow-xl shadow-palm-700/20" : "card"
                }`}
              >
                {"featured" in s && s.featured && (
                  <span className="absolute left-4 top-4 rounded-full bg-sun-400 px-2 py-0.5 text-[11px] font-semibold text-palm-900">الأكثر طلباً</span>
                )}
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${"featured" in s && s.featured ? "bg-white/10 text-sun-300" : "bg-palm-50 text-palm-600"}`}>
                  <Icon name={s.icon} />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className={`mt-1 text-sm ${"featured" in s && s.featured ? "text-white/65" : "text-ink/55"}`}>{s.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{s.price}</span>
                  <span className={`text-sm ${"featured" in s && s.featured ? "text-white/65" : "text-ink/50"}`}>ريال</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { icon: "shield", t: "تأمين على الشحنات", d: "تأمين اختياري بـ 2% من القيمة يغطي التلف والضياع." },
              { icon: "box", t: "إرجاع خلال 7 أيام", d: "إرجاع مجاني إذا كان الخطأ منّا، واسترداد خلال 5–10 أيام عمل." },
              { icon: "star", t: "برنامج نخلة للولاء", d: "كل 100 نقطة = توصيل عادي مجاني." },
            ].map((f) => (
              <div key={f.t} className="flex gap-3 rounded-2xl border border-sand-200 bg-sand-100/60 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-palm-600">
                  <Icon name={f.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.t}</div>
                  <div className="mt-0.5 text-[13px] leading-6 text-ink/55">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-6 pt-16">
          <div className="card grid gap-6 rounded-3xl p-6 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:p-8">
            <div>
              <h2 className="text-xl font-bold">نوصل لك وين ما كنت</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CITIES.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 rounded-full bg-palm-50 px-2.5 py-1 text-xs text-palm-700">
                    <Icon name="pin" className="h-3 w-3" /> {c}
                  </span>
                ))}
              </div>
            </div>
            {[
              { icon: "phone", l: "الكول سنتر", v: "920000000" },
              { icon: "chat", l: "واتساب", v: "0500000000" },
              { icon: "mail", l: "البريد", v: "support@palm-oasis.example" },
            ].map((c) => (
              <div key={c.l} className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-100 text-palm-700">
                  <Icon name={c.icon} className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-ink/45">{c.l}</div>
                  <div className="truncate text-sm font-semibold" dir="ltr">{c.v}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-10">
          <EventLog log={call.log} onClear={call.clearLog} />
        </div>
      </main>

      <footer className="mt-10 border-t border-sand-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-ink/45 sm:flex-row sm:px-6">
          <Logo />
          <p>شركة وهمية لأغراض تعليمية · جميع الأرقام والعناوين غير حقيقية</p>
        </div>
      </footer>
    </div>
  );
}

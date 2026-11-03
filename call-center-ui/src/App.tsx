import { useEffect, useState, type FormEvent } from "react";
import { CallCard } from "./components/CallCard";
import { EventLog } from "./components/EventLog";
import { Icon } from "./components/icons";
import { MobileCall } from "./components/MobileCall";
import { useCall } from "./useCall";

/* ---------------------------------------------------------------- data */
// Mirrors knowledge.md so the page and the bot say the same thing.

const PRICES = [
  { title: "توصيل عادي", desc: "داخل المدينة · خلال ٢٤ ساعة", price: "١٥" },
  { title: "توصيل سريع", desc: "داخل المدينة · خلال ٣ ساعات", price: "٣٠", featured: true },
  { title: "بين المدن", desc: "٢–٣ أيام عمل", price: "٣٥" },
  { title: "طرود كبيرة", desc: "أكثر من ٢٠ كغ · ٢–٤ أيام عمل", price: "٦٠" },
];

const TRACK_STEPS = [
  { title: "تم الاستلام", place: "الرياض", fill: "full" },
  { title: "في الطريق", place: "الرياض ← جدة", fill: "full" },
  { title: "خرجت للتوصيل", place: "جدة", fill: "half" },
  { title: "تم التسليم", place: "جدة", fill: "none" },
] as const;

const CITIES = ["الرياض", "جدة", "الدمام", "مكة", "المدينة", "أبها"];

const QUICK = ["توصلون يوم الجمعة؟", "كيف أرجع شحنة؟", "وش الأشياء الممنوع شحنها؟", "وصلتني الشحنة تالفة، وش أسوي؟"];

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

// On phones the call opens full screen, so only scroll to the call card on wider screens.
const scrollToCall = () => {
  if (window.matchMedia("(min-width: 768px)").matches) {
    document.getElementById("call")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

/* ------------------------------------------------------------------ app */

export default function App() {
  const call = useCall();
  const timer = useTimer(call.startedAt);
  const [tracking, setTracking] = useState("");
  const [trackError, setTrackError] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);

  // A new call always opens the full-screen view on phones.
  useEffect(() => {
    if (call.isBusy) setMinimized(false);
  }, [call.isBusy]);

  const ask = (q: string) => {
    setMinimized(false);
    call.ask(q);
    scrollToCall();
  };

  const startCall = () => {
    setMinimized(false);
    call.start();
    scrollToCall();
  };

  const submitTracking = (e: FormEvent) => {
    e.preventDefault();
    const id = tracking.trim().toUpperCase();
    if (!/^PO\d{8}$/.test(id)) {
      setTrackError("رقم الشحنة يبدأ بـ PO ثم ٨ أرقام، مثل PO12345678");
      return;
    }
    setTrackError(null);
    ask(`أبغى أتتبع شحنتي رقم ${id}`);
  };

  const showMobileCall = (call.isLive || call.isBusy) && !minimized;

  // Keep the page behind the full-screen call view from scrolling.
  useEffect(() => {
    if (!showMobileCall || window.matchMedia("(min-width: 768px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showMobileCall]);

  return (
    <div className="min-h-full" dir="rtl">
      {/* Nav */}
      <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 text-ink no-underline">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-palm text-lime">
            <Icon name="palm" className="h-6 w-6" />
          </span>
          <span className="font-display text-lg font-bold">واحة النخيل</span>
        </a>
        <nav aria-label="القائمة الرئيسية" className="order-3 flex w-full gap-1.5 overflow-x-auto rounded-full border border-line bg-white p-1.5 sm:order-none sm:w-auto">
          {[
            ["#top", "تتبّع"],
            ["#services", "الخدمات"],
            ["#prices", "الأسعار"],
            ["#help", "المساعدة"],
          ].map(([href, label], i) => (
            <a
              key={href}
              href={href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm no-underline ${i === 0 ? "bg-soft text-ink" : "text-[#45534C] hover:text-ink"}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={startCall}
          disabled={call.isLive || call.isBusy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white transition hover:bg-palm disabled:opacity-60"
        >
          <Icon name="phone" className="h-4 w-4" />
          {call.isLive ? "المكالمة شغّالة" : "كلّم المساعد"}
        </button>
      </header>

      {/* Error banner */}
      {call.error && (
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" data-testid="error">
            <span className="mt-0.5" aria-hidden>⚠</span>
            <p dir="auto" className="flex-1 break-words text-start leading-6">
              {call.error.toLowerCase().includes("api key")
                ? "مفتاح OpenAI غير صحيح أو منتهي. حدّث OPENAI_API_KEY وأعد تشغيل البوت."
                : call.error}
            </p>
            <button onClick={() => call.setError(null)} className="grid h-7 w-7 place-items-center text-rose-500 hover:text-rose-800" aria-label="إغلاق التنبيه">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section id="top" className="mx-auto max-w-[1240px] px-4 pt-2 sm:px-6">
        <div className="flex flex-wrap items-center gap-10 overflow-hidden rounded-[36px] bg-palm px-6 py-10 sm:px-12 sm:py-14 lg:gap-12">
          <div className="min-w-0 flex-[1_1_440px] text-white">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3.5 py-1.5 text-[13px] text-[#DDE7E1]">
              <span className="h-2 w-2 rounded-full bg-lime" />
              مساعد صوتي بالذكاء الاصطناعي
            </p>
            <h1 className="font-display m-0 text-[40px] font-extrabold leading-[1.18] tracking-[-0.5px] sm:text-6xl">
              اسأل عن شحنتك
              <br />
              <span className="text-lime">وخذ الجواب بصوت.</span>
            </h1>
            <p className="mt-5 max-w-[480px] text-[17px] leading-[1.85] text-mist">
              مكالمة من المتصفح بضغطة وحدة. المساعد يفهم العربي والإنجليزي، ويرد عليك فوراً عن الأسعار والتتبّع والإرجاع.
            </p>

            <form onSubmit={submitTracking} aria-label="تتبّع الشحنة" className="mt-8 max-w-[520px]">
              <div className="flex items-center gap-2 rounded-[20px] bg-white p-2">
                <Icon name="search" className="ms-2.5 h-5 w-5 shrink-0 text-muted" />
                <label htmlFor="tracking" className="sr-only-label">
                  رقم الشحنة
                </label>
                <input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => {
                    setTracking(e.target.value);
                    setTrackError(null);
                  }}
                  dir="ltr"
                  placeholder="PO12345678"
                  aria-describedby="track-hint"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-right text-base font-medium tracking-wider text-ink placeholder:text-muted/70 focus:outline-none"
                />
                <button type="submit" className="font-display min-h-12 shrink-0 rounded-[14px] bg-lime px-6 text-[15px] font-bold text-ink transition hover:bg-lime-200">
                  تتبّع
                </button>
              </div>
              <p id="track-hint" className={`mt-2 text-xs ${trackError ? "text-lime" : "text-mist/80"}`} data-testid="track-hint">
                {trackError ?? "أدخل رقم الشحنة وسيتتبّعها لك المساعد"}
              </p>
            </form>

            <ul aria-label="مزايا" className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
              {["رد فوري بدون انتظار", "عربي · English", "٦ مدن في المملكة"].map((t) => (
                <li key={t} className="rounded-xl bg-white/[0.06] px-3.5 py-2 text-sm text-[#DDE7E1]">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 flex-[1_1_360px] lg:ms-auto lg:max-w-[460px]">
            <CallCard call={call} timer={timer} />
          </div>
        </div>
      </section>

      {/* Bento */}
      <section id="services" className="mx-auto max-w-[1240px] scroll-mt-6 px-4 pt-20 sm:px-6 sm:pt-24">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display m-0 max-w-[560px] text-3xl font-bold leading-[1.35] sm:text-[40px]">
            كل اللي تحتاجه من شركة توصيل… بمكالمة وحدة
          </h2>
          <p className="m-0 max-w-[380px] text-base leading-[1.8] text-muted">
            المساعد يعرف كل خدماتنا وأسعارنا وسياساتنا، وما يجاوب إلا من معلومات الشركة.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <article className="min-w-0 flex-[2_1_520px] rounded-[28px] border border-line bg-white p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display m-0 text-[22px] font-bold">تتبّع لحظي</h3>
                <p className="mt-1.5 text-sm text-muted">قل رقم شحنتك، والمساعد يخبرك وين وصلت.</p>
              </div>
              <span dir="ltr" className="rounded-[10px] bg-ground px-3 py-1.5 text-[13px] font-semibold">
                PO12345678
              </span>
            </div>
            <ol className="m-0 mt-7 flex list-none flex-wrap gap-2 p-0" aria-label="مثال على مراحل الشحنة">
              {TRACK_STEPS.map((s) => (
                <li key={s.title} className="min-w-0 flex-[1_1_110px]">
                  <div
                    className={`h-1.5 rounded-full ${
                      s.fill === "full" ? "bg-palm-500" : s.fill === "half" ? "bg-[linear-gradient(to_left,#138A55_40%,#E3E6DC_40%)]" : "bg-line"
                    }`}
                  />
                  <div className={`mt-3 text-sm font-semibold ${s.fill === "none" ? "text-muted" : ""}`}>{s.title}</div>
                  <div className="text-xs text-muted">{s.place}</div>
                </li>
              ))}
            </ol>
          </article>

          <article className="flex min-w-0 flex-[1_1_300px] flex-col justify-between gap-6 rounded-[28px] bg-lime p-7">
            <h3 className="font-display m-0 text-[22px] font-bold">يفهم لهجتك</h3>
            <div className="flex flex-col items-start gap-2">
              <span className="rounded-[14px] bg-ink/[0.08] px-3.5 py-2 text-sm">«الشحنة وصلت مكسورة، وش أسوي؟»</span>
              <span dir="ltr" className="rounded-[14px] bg-ink/[0.08] px-3.5 py-2 text-sm">“Do you deliver on Fridays?”</span>
            </div>
          </article>

          <article className="min-w-0 flex-[1_1_300px] rounded-[28px] border border-line bg-white p-7">
            <div className="font-display text-[56px] font-extrabold leading-none text-palm">٦</div>
            <h3 className="font-display mb-4 mt-2 text-xl font-bold">مدن نخدمها</h3>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <span key={c} className="rounded-full bg-ground px-3 py-1.5 text-[13px]">
                  {c}
                </span>
              ))}
            </div>
          </article>

          <article className="min-w-0 flex-[1_1_300px] rounded-[28px] bg-ink p-7 text-white">
            <Icon name="undo" className="h-7 w-7 text-lime" />
            <h3 className="font-display mb-2 mt-4 text-xl font-bold">إرجاع خلال ٧ أيام</h3>
            <p className="m-0 text-sm leading-[1.8] text-[#B9C6BF]">مجاني إذا كان الخطأ منّا، والاسترداد خلال ٥–١٠ أيام عمل.</p>
          </article>

          <article className="min-w-0 flex-[1_1_300px] rounded-[28px] border border-line bg-white p-7">
            <Icon name="shield" className="h-7 w-7 text-palm-500" />
            <h3 className="font-display mb-2 mt-4 text-xl font-bold">تأمين على الشحنة</h3>
            <p className="m-0 text-sm leading-[1.8] text-muted">٢٪ من قيمة الشحنة، ويغطي التلف والضياع بالقيمة الكاملة.</p>
          </article>
        </div>
      </section>

      {/* Prices */}
      <section id="prices" className="mx-auto max-w-[1240px] scroll-mt-6 px-4 pt-20 sm:px-6 sm:pt-24">
        <h2 className="font-display m-0 mb-7 text-3xl font-bold sm:text-[40px]">أسعار واضحة، بدون مفاجآت</h2>
        <div className="overflow-hidden rounded-[28px] border border-line bg-white">
          {PRICES.map((p, i) => (
            <div
              key={p.title}
              className={`flex flex-wrap items-center gap-4 px-7 py-5 ${i < PRICES.length - 1 ? "border-b border-soft" : ""} ${p.featured ? "bg-[#F7FBEA]" : ""}`}
            >
              <div className="flex-[1_1_220px]">
                <div className="text-[17px] font-semibold">
                  {p.title}
                  {p.featured && <span className="ms-2 rounded-full bg-lime px-2.5 py-0.5 text-xs font-bold">الأكثر طلباً</span>}
                </div>
                <div className="text-[13px] text-muted">{p.desc}</div>
              </div>
              <div className="font-display text-[28px] font-bold">
                {p.price} <span className="text-sm font-medium text-muted">ريال</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-muted">الدفع عند الاستلام متاح برسوم ٥ ريال · مدى، فيزا، ماستركارد، Apple Pay</p>
      </section>

      {/* Ask */}
      <section id="help" className="mx-auto max-w-[1240px] scroll-mt-6 px-4 py-20 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-[36px] bg-ink px-6 py-10 text-white sm:p-12">
          <div className="min-w-0 flex-[1_1_380px]">
            <h2 className="font-display m-0 text-[28px] font-bold leading-[1.4] sm:text-4xl">
              عندك سؤال؟ <span className="text-lime">اضغط وابدأ الكلام.</span>
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="min-h-11 rounded-full border border-white/20 px-4 text-sm text-white transition hover:border-lime hover:text-lime"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={startCall}
            disabled={call.isLive || call.isBusy}
            className="font-display inline-flex min-h-14 items-center gap-3 rounded-full bg-lime px-7 text-lg font-bold text-ink transition hover:bg-lime-200 disabled:opacity-60"
          >
            <Icon name="phone" className="h-5 w-5" />
            {call.isLive ? "المكالمة شغّالة" : "اتصل الآن"}
          </button>
        </div>

        <div className="mt-10">
          <EventLog log={call.log} onClear={call.clearLog} />
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-wrap justify-between gap-3 px-4 py-6 text-[13px] text-muted sm:px-6">
          <span>© واحة النخيل للتوصيل</span>
          <span>شركة وهمية لأغراض تعليمية · جميع الأرقام والعناوين غير حقيقية</span>
        </div>
      </footer>

      {/* Phones: full-screen call view while a call is active */}
      {showMobileCall && <MobileCall call={call} timer={timer} onMinimize={() => setMinimized(true)} />}

      {/* Phones: a bar to reopen a minimized call */}
      {(call.isLive || call.isBusy) && minimized && (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="fixed inset-x-4 bottom-4 z-40 flex min-h-14 items-center justify-between rounded-2xl bg-palm px-5 text-white shadow-xl md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="live-dot h-2 w-2 rounded-full bg-lime" /> المكالمة شغّالة · رجوع
          </span>
          <span dir="ltr" className="font-mono text-sm text-mist">{timer}</span>
        </button>
      )}
    </div>
  );
}

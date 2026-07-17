import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock, Sun, Moon, Cloud, MapPin, BookOpen, Sparkles,
  CalendarDays, Star, Award, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getLandingStats } from "@/lib/landing.functions";

/* -------------------------- static fallback data -------------------------- */

const FALLBACK_VERSES = [
  { text: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِلْمُؤْمِنِينَ", surah: "الإسراء", ayah: 82 },
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", surah: "الشرح", ayah: 6 },
  { text: "وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا", surah: "الطلاق", ayah: 2 },
  { text: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ", surah: "البقرة", ayah: 152 },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", surah: "البقرة", ayah: 153 },
  { text: "وَبَشِّرِ الصَّابِرِينَ", surah: "البقرة", ayah: 155 },
  { text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", surah: "البقرة", ayah: 201 },
];

const DHIKR = [
  "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
  "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ",
  "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ وَأَتُوبُ إِلَيْهِ",
  "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
  "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
  "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
];

const HADITHS = [
  { text: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى", src: "متفق عليه" },
  { text: "من حسن إسلام المرء تركه ما لا يعنيه", src: "الترمذي" },
  { text: "الدين النصيحة", src: "مسلم" },
  { text: "المسلم من سلم المسلمون من لسانه ويده", src: "متفق عليه" },
  { text: "من لا يرحم لا يُرحم", src: "متفق عليه" },
  { text: "خيركم من تعلم القرآن وعلمه", src: "البخاري" },
  { text: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها", src: "الترمذي" },
];

const NAMES = [
  { ar: "الرَّحْمَنُ", en: "The Most Gracious" },
  { ar: "الرَّحِيمُ", en: "The Most Merciful" },
  { ar: "الْمَلِكُ", en: "The King" },
  { ar: "الْقُدُّوسُ", en: "The Most Holy" },
  { ar: "السَّلَامُ", en: "The Source of Peace" },
  { ar: "الْمُؤْمِنُ", en: "The Guardian of Faith" },
  { ar: "الْعَزِيزُ", en: "The Almighty" },
  { ar: "الْغَفَّارُ", en: "The Ever-Forgiving" },
  { ar: "الْوَهَّابُ", en: "The Bestower" },
  { ar: "الرَّزَّاقُ", en: "The Provider" },
  { ar: "اللَّطِيفُ", en: "The Subtle One" },
  { ar: "الْحَكِيمُ", en: "The All-Wise" },
  { ar: "الْوَدُودُ", en: "The Most Loving" },
  { ar: "الْحَيُّ", en: "The Ever-Living" },
  { ar: "الْقَيُّومُ", en: "The Self-Subsisting" },
];

const BATNA = { lat: 35.5559, lng: 6.1741, name: "باتنة، الجزائر" };

/* --------------------------------- helpers -------------------------------- */

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

function pickDaily<T>(arr: T[]): T {
  return arr[dayOfYear(new Date()) % arr.length];
}

function fmtHM(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return { h, m, s };
}

function hijriDate(d: Date) {
  try {
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
      day: "numeric", month: "long", year: "numeric",
    }).format(d);
  } catch { return ""; }
}

function hijriParts(d: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
      day: "numeric", month: "numeric", year: "numeric",
    }).formatToParts(d);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
    return { day: get("day"), month: get("month"), year: get("year") };
  } catch { return { day: 0, month: 0, year: 0 }; }
}

function greeting(d: Date, lang: "ar") {
  const h = d.getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء الخير";
}

type Prayers = {
  Fajr: string; Sunrise: string; Dhuhr: string; Asr: string; Maghrib: string; Isha: string;
};

async function fetchPrayers(lat: number, lng: number): Promise<Prayers | null> {
  try {
    const d = new Date();
    const url = `https://api.aladhan.com/v1/timings/${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}?latitude=${lat}&longitude=${lng}&method=3`;
    const r = await fetch(url);
    const j = await r.json();
    return j?.data?.timings ?? null;
  } catch { return null; }
}

async function fetchWeather(lat: number, lng: number) {
  try {
    const r = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`,
    );
    const j = await r.json();
    return { temp: Math.round(j?.current?.temperature_2m ?? 0), code: j?.current?.weather_code ?? 0 };
  } catch { return null; }
}

function useGeolocation() {
  const [pos, setPos] = useState<{ lat: number; lng: number; label: string }>({
    lat: BATNA.lat, lng: BATNA.lng, label: BATNA.name,
  });
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, label: "موقعك" }),
      () => {},
      { timeout: 4000 },
    );
  }, []);
  return pos;
}

function parsePrayerTime(t: string, base: Date) {
  const clean = t.split(" ")[0];
  const [h, m] = clean.split(":").map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function nextPrayer(p: Prayers, now: Date) {
  const order: (keyof Prayers)[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  for (const k of order) {
    const d = parsePrayerTime(p[k], now);
    if (d.getTime() > now.getTime()) return { name: k, at: d };
  }
  const fajr = parsePrayerTime(p.Fajr, now);
  fajr.setDate(fajr.getDate() + 1);
  return { name: "Fajr" as const, at: fajr };
}

const PRAYER_AR: Record<keyof Prayers, string> = {
  Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء",
};

function countdown(from: Date, to: Date) {
  const ms = Math.max(0, to.getTime() - from.getTime());
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* --------------------------------- widget --------------------------------- */

export function IslamicDashboardCard() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setNow(new Date()); }, []);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const geo = useGeolocation();
  const statsFn = useServerFn(getLandingStats);

  const { data: stats } = useQuery({
    queryKey: ["islamic-widget", "stats"],
    queryFn: () => statsFn(),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: prayers } = useQuery({
    queryKey: ["islamic-widget", "prayers", geo.lat.toFixed(2), geo.lng.toFixed(2), new Date().toDateString()],
    queryFn: () => fetchPrayers(geo.lat, geo.lng),
    staleTime: 60 * 60 * 1000,
  });

  const { data: weather } = useQuery({
    queryKey: ["islamic-widget", "weather", geo.lat.toFixed(2), geo.lng.toFixed(2)],
    queryFn: () => fetchWeather(geo.lat, geo.lng),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: dailyVerse } = useQuery({
    queryKey: ["islamic-widget", "verse", new Date().toDateString()],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("quran_daily" as never)
          .select("*")
          .limit(50);
        const rows = (data as unknown as Array<{ verse?: string; text?: string; surah?: string; ayah?: number | string }>) ?? [];
        if (rows.length) {
          const r = rows[dayOfYear(new Date()) % rows.length];
          return {
            text: r.verse ?? r.text ?? "",
            surah: r.surah ?? "",
            ayah: Number(r.ayah ?? 0),
          };
        }
      } catch { /* table may not exist — fall through */ }
      return pickDaily(FALLBACK_VERSES);
    },
  });

  const verse = dailyVerse ?? pickDaily(FALLBACK_VERSES);
  const dhikr = useMemo(() => pickDaily(DHIKR), []);
  const hadith = useMemo(() => pickDaily(HADITHS), []);
  const name = useMemo(() => pickDaily(NAMES), []);

  const { h, m, s } = fmtHM(now);
  const isFriday = now.getDay() === 5;
  const hp = hijriParts(now);
  const isRamadan = hp.month === 9;

  const next = prayers ? nextPrayer(prayers, now) : null;
  const nextName = next ? PRAYER_AR[next.name] : "";
  const nextIn = next ? countdown(now, next.at) : "";

  const gregorian = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now);

  return (
    <section aria-label="لوحة إسلامية" dir="rtl" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="relative rounded-[2rem] overflow-hidden border border-gold/30 bg-gradient-to-br from-primary/95 via-primary to-secondary/90 text-primary-foreground shadow-[0_30px_80px_-30px_rgba(94,75,123,0.6)]">
        {/* ornaments */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.09]" aria-hidden>
          <svg className="w-full h-full">
            <defs>
              <pattern id="isl-orn" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#D4AF37" strokeWidth="0.7" />
                <circle cx="30" cy="30" r="4" fill="none" stroke="#D4AF37" strokeWidth="0.7" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#isl-orn)" />
          </svg>
        </div>
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold/25 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" aria-hidden />

        <div className="relative p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CLOCK + GREETING */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="lg:col-span-5 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
              <Clock className="w-4 h-4" aria-hidden /> الوقت الآن
            </div>
            <div
              dir="ltr"
              className="mt-3 flex items-baseline gap-2 font-mono font-black leading-none"
              style={{ unicodeBidi: "isolate", fontVariantNumeric: "tabular-nums" }}
              suppressHydrationWarning
            >
              <span className="text-6xl md:text-7xl bg-gradient-to-b from-white to-gold/80 bg-clip-text text-transparent">{mounted ? h : "--"}</span>
              <span className="text-4xl md:text-5xl opacity-70">:</span>
              <span className="text-6xl md:text-7xl bg-gradient-to-b from-white to-gold/80 bg-clip-text text-transparent">{mounted ? m : "--"}</span>
              <span className="text-4xl md:text-5xl opacity-70">:</span>
              <span className="text-6xl md:text-7xl bg-gradient-to-b from-white to-gold/80 bg-clip-text text-transparent">{mounted ? s : "--"}</span>
            </div>
            <div className="mt-4 text-2xl font-bold text-gold" style={{ fontFamily: "var(--font-display-ar)" }}>
              {greeting(now, "ar")}
            </div>
            <div className="mt-2 text-sm opacity-90">{gregorian}</div>
            <div className="text-sm opacity-90 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gold" aria-hidden /> {hijriDate(now)}
            </div>
            {isFriday && (
              <div className="mt-4 p-3 rounded-2xl bg-gold/20 border border-gold/40 text-center text-sm font-semibold">
                اللهم صلِّ وسلِّم على نبينا محمد ﷺ
              </div>
            )}
          </motion.div>

          {/* PRAYER TIMES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
                <Sun className="w-4 h-4" aria-hidden /> مواقيت الصلاة
              </div>
              <div className="flex items-center gap-1 text-xs opacity-90">
                <MapPin className="w-3.5 h-3.5" aria-hidden /> {geo.label}
              </div>
            </div>
            {next && (
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-l from-gold/30 to-gold/10 border border-gold/40">
                <div className="text-xs opacity-90">الصلاة القادمة</div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-bold text-gold">{nextName}</div>
                  <div className="font-mono text-2xl font-bold">{nextIn}</div>
                </div>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {prayers
                ? (Object.keys(PRAYER_AR) as (keyof Prayers)[]).map((k) => {
                    const t = prayers[k]?.split(" ")[0] ?? "—";
                    const active = next?.name === k;
                    return (
                      <div
                        key={k}
                        className={`p-3 rounded-2xl text-center border ${
                          active
                            ? "bg-gold/25 border-gold/60 shadow-[0_0_24px_rgba(212,175,55,0.35)]"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="text-[11px] opacity-90">{PRAYER_AR[k]}</div>
                        <div className="font-mono font-bold mt-1">{t}</div>
                      </div>
                    );
                  })
                : (
                  <div className="col-span-full text-center opacity-80 text-sm py-4">جارٍ حساب المواقيت…</div>
                )}
            </div>
          </motion.div>

          {/* DAILY VERSE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-8 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
              <BookOpen className="w-4 h-4" aria-hidden /> آية اليوم
            </div>
            <p className="mt-4 text-2xl md:text-3xl leading-loose text-center" style={{ fontFamily: "var(--font-display-ar)" }}>
              ﴿ {verse.text} ﴾
            </p>
            {(verse.surah || verse.ayah) && (
              <div className="mt-3 text-center text-sm text-gold font-semibold">
                {verse.surah}{verse.ayah ? ` — الآية ${verse.ayah}` : ""}
              </div>
            )}
          </motion.div>

          {/* NAME OF ALLAH + WEATHER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-4 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 flex flex-col gap-4"
          >
            <div>
              <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="w-4 h-4" aria-hidden /> اسم اليوم
              </div>
              <div className="mt-2 text-3xl font-black text-gold text-center" style={{ fontFamily: "var(--font-display-ar)" }}>
                {name.ar}
              </div>
              <div className="text-center text-xs opacity-80 mt-1">{name.en}</div>
            </div>
            <div className="mt-auto p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Cloud className="w-4 h-4 text-gold" aria-hidden />
                <span>الطقس</span>
              </div>
              <div className="font-bold">
                {weather ? `${weather.temp}°C` : "—"}
              </div>
            </div>
          </motion.div>

          {/* RAMADAN MODE */}
          {isRamadan && prayers && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="lg:col-span-12 rounded-3xl p-5 bg-gradient-to-l from-gold/30 via-gold/15 to-transparent border border-gold/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 font-bold text-gold">
                  <Moon className="w-5 h-5" aria-hidden /> رمضان مبارك
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="opacity-80">إلى الإفطار: </span>
                    <span className="font-mono font-bold">{countdown(now, parsePrayerTime(prayers.Maghrib, now))}</span>
                  </div>
                  <div>
                    <span className="opacity-80">إلى السحور (الفجر): </span>
                    <span className="font-mono font-bold">{countdown(now, parsePrayerTime(prayers.Fajr, now))}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* DHIKR + HADITH */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="lg:col-span-6 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
              <Star className="w-4 h-4" aria-hidden /> ذكر اليوم
            </div>
            <p className="mt-3 text-lg md:text-xl text-center leading-loose" style={{ fontFamily: "var(--font-display-ar)" }}>
              {dhikr}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-6 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest">
              <Award className="w-4 h-4" aria-hidden /> حديث اليوم
            </div>
            <p className="mt-3 text-base md:text-lg text-center leading-loose" style={{ fontFamily: "var(--font-display-ar)" }}>
              «{hadith.text}»
            </p>
            <div className="mt-2 text-center text-xs text-gold font-semibold">{hadith.src}</div>
          </motion.div>

          {/* LIVE STATS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="lg:col-span-12 rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-widest mb-4">
              <TrendingUp className="w-4 h-4" aria-hidden /> الأكاديمية الآن
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "الطلاب", value: stats?.students ?? 0 },
                { label: "المعلمون", value: stats?.teachers ?? 0 },
                { label: "الحلقات", value: stats?.halaqas ?? 0 },
                { label: "ساعات البث", value: stats?.hours ?? 0 },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-black text-gold">{s.value}</div>
                  <div className="text-xs opacity-90 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default IslamicDashboardCard;
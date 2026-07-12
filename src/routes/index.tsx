import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, animate } from "framer-motion";
import {
  BookOpen, Mic, GraduationCap, CalendarCheck, BarChart3, Sparkles,
  UserPlus, ShieldCheck, Users, PlayCircle, Star, ChevronDown,
  Mail, Phone, Facebook, Instagram,
} from "lucide-react";
import logoAsset from "@/assets/rawa-logo.png.asset.json";
import { LogoPremium3D } from "@/components/LogoPremium3D";
import { useI18n, LangSwitcher } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getLandingStats,
  getLandingTeachers,
  getLandingTestimonials,
  getLandingHalaqas,
} from "@/lib/landing.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رواء — أكاديمية القرآن الكريم وعلومه | Rawa Quran Academy" },
      { name: "description", content: "منصة رواء لتعلّم القرآن الكريم عبر الإنترنت: حلقات حية، حفظ، تجويد، تصحيح تلاوة ومتون علمية بإشراف نخبة من المعلمين." },
      { name: "keywords", content: "Quran Academy, Online Quran Learning, Quran Memorization, Tajweed Classes, Islamic Education, أكاديمية القرآن, تعلم القرآن, حفظ القرآن, تجويد" },
      { property: "og:title", content: "رواء — أكاديمية القرآن الكريم وعلومه" },
      { property: "og:description", content: "رحلة متكاملة لحفظ القرآن الكريم، تصحيح التلاوة، التجويد والمتون العلمية بإشراف نخبة من المعلمين." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: logoAsset.url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: logoAsset.url },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const { dir } = useI18n();
  return (
    <div dir={dir} className="min-h-dvh bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <LiveHalaqas />
      <Stats />
      <Parents />
      <Teachers />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ============================== NAV ============================== */
function Nav() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-2xl bg-background/75 border-b border-border/60 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gold/40 blur-md animate-pulse" />
            <img src={logoAsset.url} alt={t("home.hero.logo_alt")} className="relative w-11 h-11 rounded-full" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>{t("app.name")}</div>
            <div className="text-[11px] text-muted-foreground">{t("home.hero.title2")}</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-primary transition">{t("home.nav.platform")}</a>
          <a href="#how" className="hover:text-primary transition">{t("home.nav.how")}</a>
          <a href="#halaqas" className="hover:text-primary transition">{t("home.nav.halaqas")}</a>
          <a href="#teachers" className="hover:text-primary transition">{t("home.nav.teachers")}</a>
          <a href="#faq" className="hover:text-primary transition">{t("home.nav.faq")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitcher />
          <Link to="/auth" className="text-sm px-4 py-2 rounded-full text-primary hover:bg-muted transition hidden sm:inline-block">{t("home.cta.signin")}</Link>
          <Link to="/auth" className="text-sm px-5 py-2.5 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(94,75,123,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(199,163,92,0.5)] hover:-translate-y-0.5 transition-all">
            {t("home.cta.register_now")}
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ============================== HERO ============================= */
function Hero() {
  const { t } = useI18n();
  const { scrollY } = useScroll();
  const patternY = useTransform(scrollY, [0, 800], [0, 200]);
  const statsFn = useServerFn(getLandingStats);
  const { data: heroStats } = useQuery({
    queryKey: ["landing", "stats"],
    queryFn: () => statsFn(),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <section className="relative overflow-hidden pt-8 md:pt-12 pb-24 md:pb-32">
      <motion.div style={{ y: patternY }} className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
        <IslamicPattern />
      </motion.div>
      <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-primary/25 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-20 left-1/4 w-[500px] h-[500px] bg-gold/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative order-2 lg:order-1 w-full max-w-[300px] sm:max-w-[420px] lg:max-w-[520px] mx-auto"
        >
          <div className="relative rounded-[2rem] lg:rounded-[2.5rem] p-3 sm:p-4 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl border border-white/50 shadow-[0_30px_80px_-20px_rgba(94,75,123,0.4)]">
            <div className="rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-gold/10">
              <div className="w-full aspect-square grid place-items-center p-3 sm:p-6">
                <LogoPremium3D size="xl" intro particles interactive className="w-full h-auto aspect-square object-contain max-w-[260px] sm:max-w-[380px] lg:max-w-[460px]" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute -bottom-3 right-3 sm:-bottom-4 sm:right-6 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-xl flex items-center gap-2 max-w-[calc(100%-1.5rem)]"
            >
              <ShieldCheck className="text-gold" />
              <div className="text-[11px] sm:text-xs min-w-0">
                <div className="font-bold text-primary">{t("home.hero.badge_teachers_count", { count: heroStats?.teachers ?? 0 })}</div>
                <div className="text-muted-foreground">{t("home.hero.badge_ijazat")}</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="absolute -top-3 left-3 sm:-top-4 sm:left-6 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-xl flex items-center gap-2 max-w-[calc(100%-1.5rem)]"
            >
              <Sparkles className="text-gold" />
              <div className="text-[11px] sm:text-xs min-w-0">
                <div className="font-bold text-primary">{t("home.hero.badge_live")}</div>
                <div className="text-muted-foreground">{t("home.hero.badge_join")}</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="order-1 lg:order-2 text-center lg:text-right space-y-6 lg:space-y-7">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-gradient-to-l from-gold/20 to-gold/5 text-dark border border-gold/40 backdrop-blur"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            {t("app.tagline")}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] bg-gradient-to-br from-primary via-secondary to-primary bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-display-ar)" }}
          >
            {t("app.name")}
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl sm:text-2xl md:text-4xl font-bold text-primary leading-tight"
          >
            {t("home.hero.title2")}<span className="text-gold">{t("home.hero.title2_suffix")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="text-sm sm:text-base md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            {t("home.hero.subtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start pt-2"
          >
            <Link
              to="/auth"
              className="group relative w-full sm:w-auto text-center px-8 py-4 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground font-bold shadow-[0_15px_40px_-10px_rgba(94,75,123,0.6)] hover:shadow-[0_20px_50px_-10px_rgba(199,163,92,0.6)] transition-all hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {t("home.cta.register_now")} <Sparkles className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/30 to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <a
              href="#halaqas"
              className="w-full sm:w-auto text-center px-8 py-4 rounded-full border-2 border-primary/30 text-primary font-bold hover:bg-primary/5 hover:border-primary/60 transition-all backdrop-blur"
            >
              {t("home.cta.explore_halaqas")}
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="flex flex-wrap gap-x-5 gap-y-3 pt-4 justify-center lg:justify-start text-xs sm:text-sm text-muted-foreground"
          >
            {[
              t("home.hero.chip.live_correction"),
              t("home.hero.chip.gender_separation"),
              t("home.hero.chip.parent_tracking"),
              t("home.hero.chip.ijazat"),
            ].map((chip) => (
              <div key={chip} className="flex items-center gap-2">
                <span className="text-gold text-base">✦</span> {chip}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground/60"
      >
        <ChevronDown className="w-6 h-6 animate-bounce" />
      </motion.div>
    </section>
  );
}

function IslamicPattern() {
  return (
    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="ip" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M40 0 L80 40 L40 80 L0 40 Z M40 10 L70 40 L40 70 L10 40 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <circle cx="40" cy="40" r="6" fill="none" stroke="currentColor" strokeWidth="1" className="text-gold" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#ip)" />
    </svg>
  );
}

function SectionHeader({ tag, title, desc }: { tag: string; title: string; desc?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="text-center max-w-2xl mx-auto mb-14"
    >
      <span className="text-sm text-gold font-semibold tracking-[0.3em]">{tag}</span>
      <h2 className="text-3xl md:text-5xl font-bold text-primary mt-4" style={{ fontFamily: "var(--font-display-ar)" }}>{title}</h2>
      {desc && <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{desc}</p>}
    </motion.div>
  );
}

/* ============================ FEATURES =========================== */
function Features() {
  const { t } = useI18n();
  const features = [
    { icon: PlayCircle, title: t("home.feat.live.title"), desc: t("home.feat.live.desc") },
    { icon: Mic, title: t("home.feat.correction.title"), desc: t("home.feat.correction.desc") },
    { icon: BookOpen, title: t("home.feat.memorize.title"), desc: t("home.feat.memorize.desc") },
    { icon: CalendarCheck, title: t("home.feat.attend.title"), desc: t("home.feat.attend.desc") },
    { icon: BarChart3, title: t("home.feat.reports.title"), desc: t("home.feat.reports.desc") },
    { icon: GraduationCap, title: t("home.feat.events.title"), desc: t("home.feat.events.desc") },
  ];
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative">
      <SectionHeader tag={t("home.features.tag")} title={t("home.features.title")} desc={t("home.features.desc")} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/70 to-white/30 backdrop-blur-xl border border-white/60 hover:border-gold/50 shadow-[0_10px_30px_-15px_rgba(94,75,123,0.2)] hover:shadow-[0_20px_50px_-15px_rgba(199,163,92,0.35)] transition-all duration-500 hover:-translate-y-2"
          >
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/0 to-gold/0 group-hover:from-primary/5 group-hover:to-gold/10 transition-all duration-500 pointer-events-none" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =========================== HOW IT WORKS ========================= */
function HowItWorks() {
  const { t } = useI18n();
  const steps = [
    { icon: UserPlus, title: t("home.how.s1.title"), desc: t("home.how.s1.desc") },
    { icon: ShieldCheck, title: t("home.how.s2.title"), desc: t("home.how.s2.desc") },
    { icon: Users, title: t("home.how.s3.title"), desc: t("home.how.s3.desc") },
    { icon: Sparkles, title: t("home.how.s4.title"), desc: t("home.how.s4.desc") },
  ];
  return (
    <section id="how" className="bg-gradient-to-b from-muted/30 via-background to-background py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"><IslamicPattern /></div>
      <div className="max-w-7xl mx-auto px-6 relative">
        <SectionHeader tag={t("home.how.tag")} title={t("home.how.title")} desc={t("home.how.desc")} />
        <div className="relative">
          <div className="hidden lg:block absolute top-12 right-0 left-0 h-0.5 bg-gradient-to-l from-transparent via-gold/40 to-transparent" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground mb-6 shadow-[0_15px_40px_-10px_rgba(94,75,123,0.5)]">
                  <s.icon className="w-9 h-9" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gold text-gold-foreground text-sm font-bold flex items-center justify-center shadow-lg">{i + 1}</span>
                  <span className="absolute inset-0 rounded-full bg-gold/20 blur-xl -z-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================== LIVE HALAQAS ========================= */
function LiveHalaqas() {
  const { t } = useI18n();
  const fn = useServerFn(getLandingHalaqas);
  const { data, isLoading } = useQuery({
    queryKey: ["landing", "halaqas"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const halaqas = (data ?? []).slice(0, 4);
  const formatTime = (t?: string | null) => (t ? t.slice(0, 5) : "");
  const scheduleLine = (h: (typeof halaqas)[number]) => {
    const days = (h.schedule_days ?? []).join(" · ");
    const time = h.start_time ? formatTime(h.start_time) : "";
    return [days, time].filter(Boolean).join(" · ") || h.schedule || "";
  };
  return (
    <section id="halaqas" className="max-w-7xl mx-auto px-6 py-24 md:py-32">
      <SectionHeader tag={t("p.home.halaqas.tag")} title={t("p.home.halaqas.title")} desc={t("p.home.halaqas.desc")} />
      {!isLoading && halaqas.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 rounded-3xl border border-dashed border-border bg-card/50 max-w-2xl mx-auto">
          {t("p.home.halaqas.empty")}
        </div>
      ) : (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {halaqas.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative p-6 rounded-3xl bg-card border border-border hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            {h.gender && (
              <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full bg-gold/20 text-dark border border-gold/30 font-semibold">
                {t(`f.halaqas.gender.${h.gender}`)}
              </span>
            )}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="font-bold text-primary text-lg mb-1">{h.name}</div>
            <div className="text-sm text-muted-foreground mb-4">
              {h.teacher_name ? `${h.teacher_name}${h.level ? " · " : ""}` : ""}
              {h.level ? t(`auth.level.${h.level}`) : ""}
            </div>
            <div className="flex items-center justify-between text-xs border-t border-border pt-3">
              <span className="text-muted-foreground">{scheduleLine(h)}</span>
              {h.seats != null && (
                <span className="font-bold text-gold">{h.seats} {t("p.home.halaqas.seats")}</span>
              )}
            </div>
            <Link to="/auth" className="mt-4 block text-center text-sm px-4 py-2.5 rounded-xl bg-primary/5 text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
              {t("p.home.halaqas.book")}
            </Link>
          </motion.div>
        ))}
      </div>
      )}
    </section>
  );
}

/* ============================== STATS ============================= */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 2, ease: "easeOut",
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{value.toLocaleString("ar-EG")}{suffix}</span>;
}

function Stats() {
  const { t } = useI18n();
  const fn = useServerFn(getLandingStats);
  const { data } = useQuery({
    queryKey: ["landing", "stats"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const stats = [
    { value: data?.students ?? 0, label: t("home.stats.students") },
    { value: data?.halaqas ?? 0, label: t("home.stats.halaqas") },
    { value: data?.teachers ?? 0, label: t("home.stats.teachers") },
    { value: data?.hours ?? 0, label: t("home.stats.hours") },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="relative rounded-[2.5rem] p-8 md:p-12 bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground overflow-hidden shadow-[0_30px_80px_-20px_rgba(94,75,123,0.6)]">
        <div className="absolute inset-0 opacity-10"><IslamicPattern /></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gold/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-gold/20 rounded-full blur-[100px]" />
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-gold to-[#F0D78C] bg-clip-text text-transparent" style={{ fontFamily: "var(--font-display-ar)" }}>
                <Counter to={s.value} />
              </div>
              <div className="text-sm md:text-base text-primary-foreground/90 mt-2">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ PARENTS ============================= */
function Parents() {
  const { t } = useI18n();
  const preview = useParentPreviewLines();
  const items = [
    { icon: CalendarCheck, title: t("p.home.parents.item1.title"), desc: t("p.home.parents.item1.desc") },
    { icon: BarChart3, title: t("p.home.parents.item2.title"), desc: t("p.home.parents.item2.desc") },
    { icon: BookOpen, title: t("p.home.parents.item3.title"), desc: t("p.home.parents.item3.desc") },
    { icon: Mail, title: t("p.home.parents.item4.title"), desc: t("p.home.parents.item4.desc") },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative rounded-[2.5rem] p-2 bg-gradient-to-br from-gold/40 to-primary/40 backdrop-blur-xl">
            <div className="rounded-[2.2rem] aspect-[4/5] bg-gradient-to-br from-primary via-secondary to-primary p-10 flex flex-col justify-end relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"><IslamicPattern /></div>
              <div className="absolute top-6 right-6 left-6 flex items-center gap-3">
                <img src={logoAsset.url} alt="" className="w-12 h-12 rounded-full" />
                <div className="text-primary-foreground">
                  <div className="font-bold">{preview.studentName ?? t("p.home.parents.card.title")}</div>
                  <div className="text-xs text-primary-foreground/70">{t("app.name")}</div>
                </div>
              </div>
              <div className="relative space-y-3">
                {preview.lines.map((line, i) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-primary-foreground text-sm"
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        <div className="space-y-6">
          <span className="text-sm text-gold font-semibold tracking-[0.3em]">{t("p.home.parents.tag")}</span>
          <h2 className="text-3xl md:text-5xl font-bold text-primary leading-tight" style={{ fontFamily: "var(--font-display-ar)" }}>
            {t("p.home.parents.title")}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("p.home.parents.desc")}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            {items.map((it, i) => (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-card/60 backdrop-blur border border-border hover:border-gold/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
                  <it.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-primary text-sm mb-1">{it.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{it.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ TEACHERS ============================ */
function Teachers() {
  const { t } = useI18n();
  const fn = useServerFn(getLandingTeachers);
  const { data: teachers } = useQuery({
    queryKey: ["landing", "teachers"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const list = teachers ?? [];
  return (
    <section id="teachers" className="bg-gradient-to-b from-background via-muted/30 to-background py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader tag={t("home.teachers.tag")} title={t("home.teachers.title")} desc={t("home.teachers.desc")} />
        {list.length === 0 ? (
          <div className="text-center text-muted-foreground py-10 rounded-3xl border border-dashed border-border bg-card/50">
            {t("home.teachers.empty")}
          </div>
        ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((tc, i) => (
            <motion.div
              key={tc.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group text-center p-6 rounded-3xl bg-card border border-border hover:border-gold/50 hover:shadow-xl transition-all hover:-translate-y-2"
            >
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-primary/30 blur-xl group-hover:blur-2xl transition-all" />
                {tc.avatar_url ? (
                  <img src={tc.avatar_url} alt={tc.full_name} className="relative w-full h-full rounded-full object-cover shadow-xl" />
                ) : (
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-xl" style={{ fontFamily: "var(--font-display-ar)" }}>
                    {(tc.full_name || "?").trim().charAt(0)}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-gold text-gold-foreground flex items-center justify-center text-xs shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="font-bold text-primary text-lg mb-1">{tc.full_name}</div>
              {tc.bio && <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{tc.bio}</div>}
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}

/* ========================== TESTIMONIALS ========================== */
function Testimonials() {
  const { t } = useI18n();
  const fn = useServerFn(getLandingTestimonials);
  const { data } = useQuery({
    queryKey: ["landing", "testimonials"],
    queryFn: () => fn(),
    staleTime: 5 * 60 * 1000,
  });
  const items = data ?? [];
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
      <SectionHeader tag={t("home.testimonials.tag")} title={t("home.testimonials.title")} />
      {items.length === 0 ? (
        <div className="text-center text-muted-foreground py-10 rounded-3xl border border-dashed border-border bg-card/50 max-w-2xl mx-auto">
          {t("home.testimonials.empty")}
        </div>
      ) : (
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.12 }}
            className="relative p-8 rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/60 shadow-sm hover:shadow-xl transition"
          >
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-4 h-4 text-gold fill-gold" />
              ))}
            </div>
            <p className="text-foreground/80 leading-relaxed mb-6">"{it.text}"</p>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center font-bold">
                {it.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-primary text-sm">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </section>
  );
}

/* ============================== FAQ =============================== */
function FAQ() {
  const { t } = useI18n();
  const items = [
    { q: t("p.home.faq.q1.q"), a: t("p.home.faq.q1.a") },
    { q: t("p.home.faq.q2.q"), a: t("p.home.faq.q2.a") },
    { q: t("p.home.faq.q3.q"), a: t("p.home.faq.q3.a") },
    { q: t("p.home.faq.q4.q"), a: t("p.home.faq.q4.a") },
    { q: t("p.home.faq.q5.q"), a: t("p.home.faq.q5.a") },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24 md:py-32">
      <SectionHeader tag={t("p.home.faq.tag")} title={t("p.home.faq.title")} />
      <div className="space-y-3">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-2xl bg-card border border-border overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-right px-6 py-5 flex items-center justify-between gap-4 hover:bg-muted/40 transition"
            >
              <span className="font-bold text-primary">{it.q}</span>
              <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            <motion.div
              initial={false}
              animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5 text-muted-foreground leading-relaxed">{it.a}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================ FINAL CTA =========================== */
function FinalCTA() {
  const { t } = useI18n();
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-secondary to-primary p-10 md:p-20 text-center shadow-[0_40px_100px_-20px_rgba(94,75,123,0.6)]"
      >
        <div className="absolute inset-0 opacity-15"><IslamicPattern /></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gold/30 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gold/20 rounded-full blur-[120px]" />
        <div className="relative">
          <motion.img
            src={logoAsset.url}
            alt=""
            initial={{ rotateY: 0 }}
            whileInView={{ rotateY: 360 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-24 h-24 mx-auto mb-8 rounded-full shadow-2xl"
            aria-hidden
          />
          <h2 className="text-3xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight" style={{ fontFamily: "var(--font-display-ar)" }}>
            {t("p.home.cta.title1")}<br />
            <span className="bg-gradient-to-l from-gold to-[#F0D78C] bg-clip-text text-transparent">{t("p.home.cta.title2")}</span>
          </h2>
          <p className="text-primary-foreground/85 text-lg max-w-xl mx-auto mb-10">
            {t("p.home.cta.desc")}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-br from-gold to-[#E0BC6E] text-gold-foreground font-bold text-lg shadow-[0_20px_50px_-10px_rgba(199,163,92,0.7)] hover:scale-105 transition-all"
          >
            {t("p.home.cta.button")} <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ============================== FOOTER ============================ */
function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-muted/30 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="w-12 h-12 rounded-full" />
            <div>
              <div className="font-bold text-primary text-xl" style={{ fontFamily: "var(--font-display-ar)" }}>{t("app.name")}</div>
              <div className="text-xs text-muted-foreground">{t("p.home.footer.tagline")}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            {t("p.home.footer.desc")}
          </p>
          <div className="flex justify-center md:justify-start gap-4 pt-2">
            {[
              { Icon: Facebook, label: "Facebook", href: "https://www.facebook.com/profile.php?id=61555009123201" },
              { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/rewa_merouana05/" },
            ].map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group relative w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full flex items-center justify-center text-white border-2 border-[#D4AF37] bg-gradient-to-br from-[#6A4C93] to-[#8D6BB3] shadow-soft transition-all duration-300 hover:scale-[1.12] hover:shadow-[0_0_24px_rgba(212,175,55,0.55)] backdrop-blur"
              >
                <Icon className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="font-bold text-primary mb-4">{t("p.home.footer.links_title")}</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-primary">{t("p.home.footer.link_platform")}</a></li>
            <li><a href="#halaqas" className="hover:text-primary">{t("p.home.footer.link_halaqas")}</a></li>
            <li><a href="#teachers" className="hover:text-primary">{t("p.home.footer.link_teachers")}</a></li>
            <li><a href="#faq" className="hover:text-primary">{t("p.home.footer.link_faq")}</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold text-primary mb-4">{t("p.home.footer.contact_title")}</div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-gold" /> info@rawa-academy.com</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gold" /> +966 50 000 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>{t("p.home.footer.rights", { year: new Date().getFullYear() })}</div>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-primary">{t("p.home.footer.privacy")}</a>
            <a href="/terms" className="hover:text-primary">{t("p.home.footer.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
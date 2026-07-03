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
  return (
    <div dir="rtl" className="min-h-dvh bg-background text-foreground overflow-x-hidden">
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
            <img src={logoAsset.url} alt="شعار رواء" className="relative w-11 h-11 rounded-full" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-lg text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>رواء</div>
            <div className="text-[11px] text-muted-foreground">أكاديمية القرآن الكريم</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-primary transition">المنصة</a>
          <a href="#how" className="hover:text-primary transition">كيف نعمل</a>
          <a href="#halaqas" className="hover:text-primary transition">الحلقات</a>
          <a href="#teachers" className="hover:text-primary transition">المعلمون</a>
          <a href="#faq" className="hover:text-primary transition">الأسئلة</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="text-sm px-4 py-2 rounded-full text-primary hover:bg-muted transition hidden sm:inline-block">تسجيل الدخول</Link>
          <Link to="/auth" className="text-sm px-5 py-2.5 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(94,75,123,0.6)] hover:shadow-[0_12px_32px_-8px_rgba(199,163,92,0.5)] hover:-translate-y-0.5 transition-all">
            سجل الآن
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

/* ============================== HERO ============================= */
function Hero() {
  const { scrollY } = useScroll();
  const patternY = useTransform(scrollY, [0, 800], [0, 200]);
  return (
    <section className="relative overflow-hidden pt-8 md:pt-12 pb-24 md:pb-32">
      <motion.div style={{ y: patternY }} className="absolute inset-0 opacity-[0.07] pointer-events-none" aria-hidden>
        <IslamicPattern />
      </motion.div>
      <div className="absolute -top-20 right-1/4 w-[500px] h-[500px] bg-primary/25 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-20 left-1/4 w-[500px] h-[500px] bg-gold/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative order-2 lg:order-1 max-w-[520px] mx-auto w-full"
        >
          <div className="relative rounded-[2.5rem] p-4 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl border border-white/50 shadow-[0_30px_80px_-20px_rgba(94,75,123,0.4)]">
            <div className="rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-gold/10">
              <div className="w-full aspect-square grid place-items-center p-4 sm:p-6">
                <LogoPremium3D size="xl" intro particles interactive className="w-full max-w-[460px] h-auto aspect-square" />
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
              className="absolute -bottom-4 right-6 px-4 py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-xl flex items-center gap-2"
            >
              <ShieldCheck className="text-gold" />
              <div className="text-xs">
                <div className="font-bold text-primary">+45 معلم معتمد</div>
                <div className="text-muted-foreground">إجازات شرعية</div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="absolute -top-4 left-6 px-4 py-2.5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-xl flex items-center gap-2"
            >
              <Sparkles className="text-gold" />
              <div className="text-xs">
                <div className="font-bold text-primary">حلقات حيّة الآن</div>
                <div className="text-muted-foreground">انضم اليوم</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="order-1 lg:order-2 text-center lg:text-right space-y-7">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-gradient-to-l from-gold/20 to-gold/5 text-dark border border-gold/40 backdrop-blur"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            منزِل الإتقان · لارتواء الجنان
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8 }}
            className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] bg-gradient-to-br from-primary via-secondary to-primary bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-display-ar)" }}
          >
            رواء
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-2xl md:text-4xl font-bold text-primary leading-tight"
          >
            أكاديمية القرآن الكريم<span className="text-gold"> وعلومه</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
            className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
          >
            رحلة متكاملة لحفظ القرآن الكريم، تصحيح التلاوة، دراسة التجويد والمتون العلمية بإشراف نخبة من المعلمين والمشرفين.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2"
          >
            <Link
              to="/auth"
              className="group relative px-8 py-4 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-primary-foreground font-bold shadow-[0_15px_40px_-10px_rgba(94,75,123,0.6)] hover:shadow-[0_20px_50px_-10px_rgba(199,163,92,0.6)] transition-all hover:-translate-y-1 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                سجل الآن <Sparkles className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/30 to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            <a
              href="#halaqas"
              className="px-8 py-4 rounded-full border-2 border-primary/30 text-primary font-bold hover:bg-primary/5 hover:border-primary/60 transition-all backdrop-blur"
            >
              استكشف الحلقات
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 1 }}
            className="flex flex-wrap gap-6 pt-4 justify-center lg:justify-start text-sm text-muted-foreground"
          >
            {["تصحيح مباشر", "فصل الجنسين", "متابعة وليّ الأمر", "إجازات معتمدة"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="text-gold text-base">✦</span> {t}
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
  const features = [
    { icon: PlayCircle, title: "حلقات قرآنية مباشرة", desc: "تعلم مع معلمين مؤهلين عبر حلقات إلكترونية تفاعلية." },
    { icon: Mic, title: "تصحيح التلاوة", desc: "متابعة فردية وتصحيح الأخطاء مباشرة." },
    { icon: BookOpen, title: "متابعة الحفظ", desc: "خطة حفظ ومراجعة لكل طالب." },
    { icon: CalendarCheck, title: "إدارة حضور ذكية", desc: "متابعة دقيقة للحضور والغياب." },
    { icon: BarChart3, title: "تقارير دورية", desc: "تقارير مفصلة للطالب وولي الأمر." },
    { icon: GraduationCap, title: "فعاليات ودورات", desc: "لقاءات مباشرة ودورات علمية دورية." },
  ];
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24 md:py-32 relative">
      <SectionHeader tag="المنصّة" title="منظومة قرآنية متكاملة" desc="كل ما يحتاجه الطالب والمعلم وإدارة الأكاديمية في مكان واحد." />
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
  const steps = [
    { icon: UserPlus, title: "التسجيل في المنصة", desc: "أنشئ حسابك خلال دقائق بمعلومات بسيطة." },
    { icon: ShieldCheck, title: "مراجعة الطلب من الإدارة", desc: "تتأكد الإدارة من بياناتك وملاءمتك." },
    { icon: Users, title: "إسناد الطالب للحلقة المناسبة", desc: "نختار لك حلقة تناسب مستواك وجدولك." },
    { icon: Sparkles, title: "بدء رحلة التعلم", desc: "ابدأ مسيرتك مع كتاب الله بصحبة معلميك." },
  ];
  return (
    <section id="how" className="bg-gradient-to-b from-muted/30 via-background to-background py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"><IslamicPattern /></div>
      <div className="max-w-7xl mx-auto px-6 relative">
        <SectionHeader tag="خطواتك معنا" title="رحلتك في رواء" desc="أربع خطوات بسيطة تفصلك عن بدء حلقتك القرآنية." />
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
  const halaqas = [
    { teacher: "الشيخ عبدالرحمن", level: "متقدم — حفص", time: "السبت · 18:00", seats: 3, gender: "ذكور" },
    { teacher: "الأستاذة فاطمة", level: "متوسط — تجويد", time: "الأحد · 16:00", seats: 5, gender: "إناث" },
    { teacher: "الشيخ يوسف", level: "حفظ المتون", time: "الإثنين · 20:00", seats: 2, gender: "ذكور" },
    { teacher: "الأستاذة مريم", level: "مبتدئ — تلاوة", time: "الثلاثاء · 17:00", seats: 7, gender: "إناث" },
  ];
  return (
    <section id="halaqas" className="max-w-7xl mx-auto px-6 py-24 md:py-32">
      <SectionHeader tag="حلقات قادمة" title="انضم لحلقة تناسبك" desc="حلقات حية أسبوعية بإشراف نخبة من المعلمين والمعلمات." />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {halaqas.map((h, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative p-6 rounded-3xl bg-card border border-border hover:border-primary/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <span className="absolute top-3 left-3 text-[10px] px-2 py-1 rounded-full bg-gold/20 text-dark border border-gold/30 font-semibold">{h.gender}</span>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="font-bold text-primary text-lg mb-1">{h.teacher}</div>
            <div className="text-sm text-muted-foreground mb-4">{h.level}</div>
            <div className="flex items-center justify-between text-xs border-t border-border pt-3">
              <span className="text-muted-foreground">{h.time}</span>
              <span className="font-bold text-gold">{h.seats} مقاعد</span>
            </div>
            <Link to="/auth" className="mt-4 block text-center text-sm px-4 py-2.5 rounded-xl bg-primary/5 text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
              احجز مقعدك
            </Link>
          </motion.div>
        ))}
      </div>
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
  const stats = [
    { value: 1200, suffix: "+", label: "طلاب مسجلون" },
    { value: 80, suffix: "+", label: "حلقات نشطة" },
    { value: 45, suffix: "+", label: "معلمون" },
    { value: 12000, suffix: "+", label: "ساعات تعليم" },
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
                <Counter to={s.value} suffix={s.suffix} />
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
  const items = [
    { icon: CalendarCheck, title: "متابعة الحضور", desc: "اطّلع على حضور وغياب أبنائك لحظة بلحظة." },
    { icon: BarChart3, title: "متابعة التقييمات", desc: "تقارير دورية لأداء الطالب والمعلم." },
    { icon: BookOpen, title: "متابعة الحفظ", desc: "خط سير الحفظ والمراجعة الأسبوعي." },
    { icon: Mail, title: "استقبال التنبيهات", desc: "إشعارات فورية بأي جديد يخص ابنك." },
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
                  <div className="font-bold">لوحة وليّ الأمر</div>
                  <div className="text-xs text-primary-foreground/70">رواء</div>
                </div>
              </div>
              <div className="relative space-y-3">
                {["الحفظ هذا الأسبوع: سورة الكهف", "الحضور: 98%", "آخر تقييم: ممتاز"].map((t, i) => (
                  <motion.div
                    key={t}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 text-primary-foreground text-sm"
                  >
                    {t}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
        <div className="space-y-6">
          <span className="text-sm text-gold font-semibold tracking-[0.3em]">لأولياء الأمور</span>
          <h2 className="text-3xl md:text-5xl font-bold text-primary leading-tight" style={{ fontFamily: "var(--font-display-ar)" }}>
            تابع رحلة أبنائك القرآنية
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            بوابة مخصّصة لولي الأمر تمنحك رؤية كاملة على تقدّم أبنائك في الحفظ والتجويد والحضور.
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
  const teachers = [
    { name: "الشيخ عبدالرحمن المصري", spec: "حفص عن عاصم · إجازة", exp: "15 سنة خبرة", initials: "ع" },
    { name: "الأستاذة فاطمة الزهراء", spec: "تجويد ومتون", exp: "10 سنوات خبرة", initials: "ف" },
    { name: "الشيخ يوسف القاسمي", spec: "قراءات عشر · إجازة", exp: "20 سنة خبرة", initials: "ي" },
    { name: "الأستاذة مريم الحسني", spec: "تحفيظ المبتدئين", exp: "8 سنوات خبرة", initials: "م" },
  ];
  return (
    <section id="teachers" className="bg-gradient-to-b from-background via-muted/30 to-background py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader tag="نخبة المعلمين" title="معلمون بإجازات معتمدة" desc="أساتذة وأستاذات ذوو خبرة طويلة في تعليم القرآن وعلومه." />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teachers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group text-center p-6 rounded-3xl bg-card border border-border hover:border-gold/50 hover:shadow-xl transition-all hover:-translate-y-2"
            >
              <div className="relative w-28 h-28 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-primary/30 blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-4xl font-bold shadow-xl" style={{ fontFamily: "var(--font-display-ar)" }}>
                  {t.initials}
                </div>
                <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-gold text-gold-foreground flex items-center justify-center text-xs shadow-md">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="font-bold text-primary text-lg mb-1">{t.name}</div>
              <div className="text-sm text-gold font-semibold mb-1">{t.spec}</div>
              <div className="text-xs text-muted-foreground">{t.exp}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================== TESTIMONIALS ========================== */
function Testimonials() {
  const items = [
    { name: "أم خالد", role: "وليّة أمر", text: "منصة رواء غيرت علاقة ابني بكتاب الله، أصبح متحمساً للحلقة كل يوم." },
    { name: "محمد، 17 سنة", role: "طالب", text: "تصحيح المعلم المباشر ساعدني أتقن أحكام التجويد بسرعة." },
    { name: "الشيخ أحمد", role: "معلم في رواء", text: "أدوات التقييم والمتابعة وفّرت عليّ وقتاً كبيراً وزادت تركيزي مع الطلاب." },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
      <SectionHeader tag="آراء طلابنا" title="كلمات من قلوب موصولة بالقرآن" />
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <motion.div
            key={it.name}
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
    </section>
  );
}

/* ============================== FAQ =============================== */
function FAQ() {
  const items = [
    { q: "هل المنصة مجانية؟", a: "نقدّم باقات مرنة، وبعض الحلقات تكون مجانية بدعم من المتبرعين." },
    { q: "ما الفئات العمرية المقبولة؟", a: "نستقبل الطلاب من سن 6 سنوات فما فوق، ذكوراً وإناثاً في حلقات منفصلة." },
    { q: "ما طريقة التواصل أثناء الحلقة؟", a: "نستخدم Google Meet ومنصات اجتماعات حيّة لضمان جودة التصحيح." },
    { q: "هل أحصل على شهادة في النهاية؟", a: "نعم، تُمنح إجازات للطلاب المتميزين وفق ضوابط شرعية معتمدة." },
    { q: "كيف يتم اختيار المعلم؟", a: "يتم اختيار المعلمين بناءً على إجازاتهم القرآنية وخبرتهم التدريسية." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24 md:py-32">
      <SectionHeader tag="الأسئلة الشائعة" title="ما يدور في ذهنك" />
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
            ابدأ رحلتك مع<br />
            <span className="bg-gradient-to-l from-gold to-[#F0D78C] bg-clip-text text-transparent">القرآن الكريم اليوم</span>
          </h2>
          <p className="text-primary-foreground/85 text-lg max-w-xl mx-auto mb-10">
            انضم لأكثر من 1200 طالب وطالبة في رحلة قرآنية مباركة.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-br from-gold to-[#E0BC6E] text-gold-foreground font-bold text-lg shadow-[0_20px_50px_-10px_rgba(199,163,92,0.7)] hover:scale-105 transition-all"
          >
            سجل الآن <Sparkles className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ============================== FOOTER ============================ */
function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-muted/30 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="w-12 h-12 rounded-full" />
            <div>
              <div className="font-bold text-primary text-xl" style={{ fontFamily: "var(--font-display-ar)" }}>رواء</div>
              <div className="text-xs text-muted-foreground">أكاديمية القرآن الكريم وعلومه</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
            منصة رواء للحلقات القرآنية الإلكترونية والتصحيح المباشر للتلاوة بإشراف نخبة من المعلمين.
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
          <div className="font-bold text-primary mb-4">روابط</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-primary">المنصة</a></li>
            <li><a href="#halaqas" className="hover:text-primary">الحلقات</a></li>
            <li><a href="#teachers" className="hover:text-primary">المعلمون</a></li>
            <li><a href="#faq" className="hover:text-primary">الأسئلة الشائعة</a></li>
          </ul>
        </div>
        <div>
          <div className="font-bold text-primary mb-4">تواصل معنا</div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-gold" /> info@rawa-academy.com</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gold" /> +966 50 000 0000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} رواء — جميع الحقوق محفوظة.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary">سياسة الخصوصية</a>
            <a href="#" className="hover:text-primary">الشروط والأحكام</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import logoAsset from "@/assets/rawa-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رواء — أكاديمية القرآن الكريم | Rawa Quran Academy" },
      { name: "description", content: "منصة رواء للحلقات القرآنية الإلكترونية: حفظ، تجويد، تصحيح مباشر، وحلقات حية بإشراف نخبة من المعلمين." },
      { property: "og:title", content: "رواء — أكاديمية القرآن الكريم" },
      { property: "og:description", content: "رحلة قرآنية تجمع بين الإتقان والتزكية." },
      { property: "og:image", content: logoAsset.url },
      { property: "twitter:image", content: logoAsset.url },
    ],
  }),
  component: Index,
});

function Index() {
  const features = [
    { icon: "📖", title: "حفظ القرآن الكريم", desc: "خطط حفظ مخصصة بإشراف معلمين متمكنين، مع متابعة يومية للأوراد." },
    { icon: "🎙️", title: "تصحيح مباشر للتلاوة", desc: "تلقَّ التصحيح الفوري لأحكام التجويد في حلقات حيّة وتفاعلية." },
    { icon: "🕌", title: "حلقات قرآنية حيّة", desc: "حلقات منفصلة للذكور والإناث، بإشراف معلمين ومشرفي حلقات." },
    { icon: "📊", title: "متابعة وتقييم", desc: "تقارير دورية للحضور والتقدم في الحفظ والتجويد، يطّلع عليها وليّ الأمر." },
    { icon: "🎓", title: "دورات ومتون", desc: "ورش وفعاليات مباشرة في علوم القرآن والتجويد والمتون العلمية." },
    { icon: "🛡️", title: "إدارة احترافية", desc: "نظام صلاحيات متكامل: طالب، معلم، مشرف، مدير المنصة." },
  ];

  const stats = [
    { value: "+1200", label: "طالب وطالبة" },
    { value: "+80", label: "حلقة أسبوعية" },
    { value: "+45", label: "معلم ومعلمة" },
    { value: "98%", label: "نسبة الالتزام" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="شعار رواء" className="w-11 h-11 rounded-full shadow-soft" />
            <div className="leading-tight">
              <div className="font-bold text-lg text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>رواء</div>
              <div className="text-[11px] text-muted-foreground">أكاديمية القرآن الكريم</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-primary transition">المنصة</a>
            <a href="#halaqas" className="hover:text-primary transition">الحلقات</a>
            <a href="#events" className="hover:text-primary transition">الفعاليات</a>
            <a href="#about" className="hover:text-primary transition">عن رواء</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="text-sm px-4 py-2 rounded-full text-primary hover:bg-muted transition">تسجيل الدخول</Link>
            <Link to="/auth" className="text-sm px-5 py-2 rounded-full bg-gradient-royal text-primary-foreground shadow-glow hover:opacity-95 transition">
              ابدأ التسجيل
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 islamic-pattern opacity-30 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center relative">
          <div className="space-y-7 text-center md:text-right">
            <span className="inline-flex items-center gap-2 text-xs px-4 py-1.5 rounded-full bg-gold/15 text-dark border border-gold/30">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-glow" />
              منزِل الإتقان · لارتواء الجنان
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.15] text-primary">
              رحلة قرآنية تجمع بين<br />
              <span className="bg-gradient-royal bg-clip-text text-transparent">الإتقان والتزكية</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto md:mx-0">
              منصة رواء للحلقات القرآنية الإلكترونية والتصحيح المباشر للتلاوة، بإشراف نخبة من المعلمين والمعلمات.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
              <Link to="/auth" className="px-7 py-3.5 rounded-full bg-gradient-royal text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition">
                ابدأ التسجيل
              </Link>
              <a href="#halaqas" className="px-7 py-3.5 rounded-full border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition">
                استكشف الحلقات
              </a>
            </div>
            <div className="flex flex-wrap gap-6 pt-6 justify-center md:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><span className="text-gold">✦</span> تصحيح مباشر</div>
              <div className="flex items-center gap-2"><span className="text-gold">✦</span> فصل الجنسين</div>
              <div className="flex items-center gap-2"><span className="text-gold">✦</span> متابعة وليّ الأمر</div>
            </div>
          </div>

          {/* Logo showcase */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[360px] h-[360px] rounded-full bg-gradient-royal opacity-30 blur-3xl animate-glow" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[420px] h-[420px] rounded-full border border-gold/30" />
              <div className="absolute w-[500px] h-[500px] rounded-full border border-primary/15" />
            </div>
            <img
              src={logoAsset.url}
              alt="شعار مشروع رواء — أكاديمية القرآن الكريم"
              className="relative w-[340px] md:w-[420px] drop-shadow-[0_25px_50px_rgba(94,75,123,0.45)] animate-float"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8 rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-soft">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-royal bg-clip-text text-transparent" style={{ fontFamily: "var(--font-display-ar)" }}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-sm text-gold font-semibold tracking-widest">المنصّة</span>
          <h2 className="text-3xl md:text-5xl font-bold text-primary mt-3">منظومة قرآنية متكاملة</h2>
          <p className="text-muted-foreground mt-4 text-lg">كل ما يحتاجه الطالب والمعلم وإدارة الأكاديمية في مكان واحد، بتصميم يليق بكتاب الله.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group p-7 rounded-2xl bg-card border border-border hover:border-gold/50 hover:shadow-gold transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-gradient-royal/10 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform">{f.icon}</div>
              <h3 className="text-xl font-bold text-primary mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section id="halaqas" className="bg-gradient-to-b from-muted/40 to-background py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-sm text-gold font-semibold tracking-widest">منظومة الأدوار</span>
            <h2 className="text-3xl md:text-5xl font-bold text-primary mt-3">لكل عضوٍ مكانته في رواء</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { t: "الطالب", d: "حلقاته، حضوره، تقييماته، وواجباته." },
              { t: "المعلم", d: "التسميع، التصحيح، الاختبارات والمتون." },
              { t: "مشرف الحلقة", d: "الحضور، تنظيم الدور، الملاحظات." },
              { t: "المشرف العام", d: "متابعة الحلقات والتقارير العامة." },
              { t: "مدير المنصّة", d: "صلاحيات كاملة وإدارة الأكاديمية." },
            ].map((r, i) => (
              <div key={r.t} className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:-translate-y-1 transition">
                <div className="text-xs text-gold font-semibold mb-2">0{i + 1}</div>
                <div className="font-bold text-primary text-lg mb-2">{r.t}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="events" className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-royal p-10 md:p-16 text-center shadow-glow">
          <div className="absolute inset-0 islamic-pattern opacity-20" />
          <div className="relative">
            <img src={logoAsset.url} alt="" className="w-20 h-20 mx-auto mb-6 rounded-full shadow-gold" aria-hidden />
            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4" style={{ fontFamily: "var(--font-display-ar)" }}>
              انضمّ إلى رحلة الإتقان
            </h2>
            <p className="text-primary-foreground/85 text-lg max-w-2xl mx-auto mb-8">
              سجّل اليوم وابدأ مع نخبة من المعلمين في حلقات قرآنية حيّة ومنظمة.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/auth" className="px-8 py-3.5 rounded-full bg-gold text-gold-foreground font-bold shadow-gold hover:scale-[1.03] transition">
                إنشاء حساب طالب
              </Link>
              <a href="#about" className="px-8 py-3.5 rounded-full border border-primary-foreground/40 text-primary-foreground font-semibold hover:bg-primary-foreground/10 transition">
                تعرّف على رواء
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logoAsset.url} alt="" className="w-10 h-10 rounded-full" />
            <div>
              <div className="font-bold text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>رواء</div>
              <div className="text-xs text-muted-foreground">منزِل الإتقان · لارتواء الجنان</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} مشروع رواء — جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — رواء | Privacy Policy" },
      { name: "description", content: "كيف تجمع منصة رواء وتستخدم وتحمي بيانات الطلاب وأولياء الأمور والمعلمين." },
      { property: "og:title", content: "Privacy Policy — Rawa Quran Academy" },
      { property: "og:description", content: "How Rawa collects, uses and protects student, parent, and teacher data." },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-hero px-4 py-12">
      <article className="mx-auto max-w-3xl prose prose-slate bg-card/80 backdrop-blur-xl rounded-3xl border border-border shadow-soft p-6 sm:p-10">
        <Link to="/" className="text-xs text-gold font-semibold">← رواء</Link>
        <h1 className="text-3xl font-black text-primary mt-2">سياسة الخصوصية</h1>
        <p className="text-sm text-muted-foreground">آخر تحديث: 2026</p>
        <h2 className="text-primary">المعلومات التي نجمعها</h2>
        <p>نجمع المعلومات اللازمة لتشغيل خدمة الحلقات القرآنية: الاسم، البريد الإلكتروني، الهاتف، الجنس، البلد، المستوى القرآني، وسجلات الحضور والتقييمات.</p>
        <h2 className="text-primary">كيف نستخدم البيانات</h2>
        <p>تُستخدم البيانات حصراً لإدارة الحلقات، الإشعارات، الفواتير، وتقارير الأداء لولي الأمر والإدارة. لا نبيع بياناتك لأي طرف ثالث.</p>
        <h2 className="text-primary">حقوقك</h2>
        <p>يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها بمراسلة الإدارة.</p>
      </article>
    </main>
  );
}
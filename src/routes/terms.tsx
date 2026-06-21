import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — رواء | Terms of Service" },
      { name: "description", content: "شروط استخدام منصة رواء لأكاديمية القرآن الكريم." },
      { property: "og:title", content: "Terms of Service — Rawa Quran Academy" },
      { property: "og:description", content: "Terms governing the use of Rawa Quran Academy platform." },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-dvh bg-hero px-4 py-12">
      <article className="mx-auto max-w-3xl prose prose-slate bg-card/80 backdrop-blur-xl rounded-3xl border border-border shadow-soft p-6 sm:p-10">
        <Link to="/" className="text-xs text-gold font-semibold">← رواء</Link>
        <h1 className="text-3xl font-black text-primary mt-2">الشروط والأحكام</h1>
        <p>باستخدامك منصة رواء فإنك توافق على الالتزام بآداب الحلقات القرآنية والاحترام المتبادل بين الطلاب والمعلمين والمشرفين.</p>
        <h2 className="text-primary">الحساب</h2>
        <p>يتم تفعيل الحساب بعد موافقة الإدارة. أنت مسؤول عن سرية بيانات الدخول.</p>
        <h2 className="text-primary">المحتوى والتسجيلات</h2>
        <p>تُحفظ تسجيلات الحلقات لأغراض المراجعة التربوية فقط، ولا يجوز إعادة نشرها بدون إذن خطي.</p>
      </article>
    </main>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "سياسة الاسترداد — رواء | Refund Policy" },
      { name: "description", content: "سياسة استرداد الاشتراكات في منصة رواء لأكاديمية القرآن الكريم." },
      { property: "og:title", content: "Refund Policy — Rawa Quran Academy" },
      { property: "og:description", content: "Subscription refund policy for Rawa Quran Academy." },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "/refund" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <main className="min-h-dvh bg-hero px-4 py-12">
      <article className="mx-auto max-w-3xl prose prose-slate bg-card/80 backdrop-blur-xl rounded-3xl border border-border shadow-soft p-6 sm:p-10">
        <Link to="/" className="text-xs text-gold font-semibold">← رواء</Link>
        <h1 className="text-3xl font-black text-primary mt-2">سياسة الاسترداد</h1>
        <p>يحق للمشترك طلب استرداد الرسوم خلال 7 أيام من بدء الاشتراك إن لم يستفد من أي جلسة. بعد ذلك، يُحسب الاسترداد بالتناسب مع الجلسات المتبقية.</p>
        <h2 className="text-primary">كيفية طلب الاسترداد</h2>
        <p>راسل الإدارة عبر صفحة الإعدادات مع تحديد رقم الفاتورة. تتم معالجة الطلبات خلال 5–7 أيام عمل.</p>
      </article>
    </main>
  );
}
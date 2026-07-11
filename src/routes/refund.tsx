import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <main className="min-h-dvh bg-hero px-4 py-12">
      <article className="mx-auto max-w-3xl prose prose-slate bg-card/80 backdrop-blur-xl rounded-3xl border border-border shadow-soft p-6 sm:p-10">
        <Link to="/" className="text-xs text-gold font-semibold">{t("p.refund.back")}</Link>
        <h1 className="text-3xl font-black text-primary mt-2">{t("p.refund.title")}</h1>
        <p>{t("p.refund.intro")}</p>
        <h2 className="text-primary">{t("p.refund.how_title")}</h2>
        <p>{t("p.refund.how_body")}</p>
      </article>
    </main>
  );
}

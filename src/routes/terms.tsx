import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <main className="min-h-dvh bg-hero px-4 py-12">
      <article className="mx-auto max-w-3xl prose prose-slate bg-card/80 backdrop-blur-xl rounded-3xl border border-border shadow-soft p-6 sm:p-10">
        <Link to="/" className="text-xs text-gold font-semibold">{t("p.terms.back")}</Link>
        <h1 className="text-3xl font-black text-primary mt-2">{t("p.terms.title")}</h1>
        <p>{t("p.terms.intro")}</p>
        <h2 className="text-primary">{t("p.terms.account_title")}</h2>
        <p>{t("p.terms.account_body")}</p>
        <h2 className="text-primary">{t("p.terms.content_title")}</h2>
        <p>{t("p.terms.content_body")}</p>
      </article>
    </main>
  );
}

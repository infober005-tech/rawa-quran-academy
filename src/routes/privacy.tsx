import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  return (
    <main className="min-h-dvh bg-hero px-4 py-12">
      <article className="mx-auto max-w-3xl prose prose-slate bg-card/80 backdrop-blur-xl rounded-3xl border border-border shadow-soft p-6 sm:p-10">
        <Link to="/" className="text-xs text-gold font-semibold">{t("p.privacy.back")}</Link>
        <h1 className="text-3xl font-black text-primary mt-2">{t("p.privacy.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("p.privacy.updated")}</p>
        <h2 className="text-primary">{t("p.privacy.info_title")}</h2>
        <p>{t("p.privacy.info_body")}</p>
        <h2 className="text-primary">{t("p.privacy.use_title")}</h2>
        <p>{t("p.privacy.use_body")}</p>
        <h2 className="text-primary">{t("p.privacy.rights_title")}</h2>
        <p>{t("p.privacy.rights_body")}</p>
      </article>
    </main>
  );
}

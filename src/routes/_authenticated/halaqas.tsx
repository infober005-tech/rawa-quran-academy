import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { BookOpen, User, Eye, CalendarDays, Play } from "lucide-react";
import { attachHalaqaPeople, auditEmbeddedHalaqaRelations, selectOrThrow } from "@/lib/halaqa-query-audit";

export const Route = createFileRoute("/_authenticated/halaqas")({
  component: HalaqasPage,
});

function HalaqasPage() {
  const { t } = useI18n();
  const { primaryRole } = useAuth();

  const { data, error, isLoading } = useQuery({
    queryKey: ["halaqas-all", primaryRole],
    queryFn: async () => {
      await auditEmbeddedHalaqaRelations(supabase, `halaqas-page:${primaryRole ?? "unknown"}`);
      const data = await selectOrThrow<any[]>(
        "halaqas-page",
        "halaqas",
        "*",
        supabase.from("halaqas").select("*").order("created_at", { ascending: false }),
        "order by created_at desc",
      );
      if (import.meta.env.DEV) console.info("[HalaqasPage] Applied filters", { role: primaryRole, frontendFilters: "none", count: data?.length ?? 0 });
      return await attachHalaqaPeople(supabase, "halaqas-page", data ?? []);
    },
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader
          title={t("nav.halaqas")}
          subtitle={t("f.halaqas.subtitle")}
          badge={t("f.halaqas.badge", { count: data?.length ?? 0 })}
        />
        <SubscriptionGate>
          {error && (
            <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {t("f.halaqas.load_error")}{(error as Error).message}
            </div>
          )}
          {isLoading && (
            <div className="text-center text-muted-foreground py-10">…</div>
          )}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.map((h: any) => (
              <article key={h.id} className="group relative overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-xl p-5 shadow-soft transition hover:border-gold/50 hover:shadow-glow">
                <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-gold/10 blur-2xl opacity-0 group-hover:opacity-100 transition" aria-hidden />
                <header className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-royal text-primary-foreground shadow-glow">
                      <BookOpen className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-primary truncate">{h.name}</h2>
                      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {h.level} · {h.gender === "male" ? t("f.halaqas.gender.male") : t("f.halaqas.gender.female")}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${h.status === "active" ? "bg-gold/20 text-gold border border-gold/40" : "bg-muted text-muted-foreground"}`}>
                    {h.status}
                  </span>
                </header>
                <dl className="mt-4 text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary/70" aria-hidden /><span className="truncate">{h.teacher?.full_name ?? "—"}</span></div>
                  <div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-primary/70" aria-hidden /><span className="truncate">{h.supervisor?.full_name ?? "—"}</span></div>
                  {h.schedule && <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-primary/70" aria-hidden /><span className="truncate">{h.schedule}</span></div>}
                </dl>
                {h.meeting_link && (
                  <a
                    href={h.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-royal text-primary-foreground text-xs font-semibold px-4 py-2 shadow-glow min-h-11"
                    aria-label={`${t("dash.join")} — ${h.name}`}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden /> {t("dash.join")}
                  </a>
                )}
              </article>
            ))}
            {(!data || data.length === 0) && (
              <div className="sm:col-span-2 xl:col-span-3">
                <EmptyState
                  variant="halaqas"
                  title={t("f.halaqas.empty_title")}
                  description={t("f.halaqas.empty_desc")}
                />
              </div>
            )}
          </div>
        </SubscriptionGate>
      </div>
    </DashboardShell>
  );
}
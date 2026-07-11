import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { RecordingsPanel } from "@/features/recordings/RecordingsPanel";
import { AIInsightsPanel } from "@/features/insights/AIInsightsPanel";
import { LogoPremium3D } from "@/components/LogoPremium3D";
import { attachHalaqaPeople, auditEmbeddedHalaqaRelations, selectOrThrow } from "@/lib/halaqa-query-audit";

type Child = {
  id: string;
  full_name: string | null;
  email: string | null;
  gender: string | null;
  avatar_url: string | null;
};

type HalaqaInfo = {
  id: string;
  name: string;
  level: string;
  schedule: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  meeting_provider: string | null;
  meeting_link: string | null;
  live_session_active: boolean | null;
  current_surah?: string | null;
  target_surah?: string | null;
  teacher: { full_name: string | null; avatar_url: string | null } | null;
  supervisor: { full_name: string | null } | null;
};

export function ParentDashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [activeChild, setActiveChild] = useState<string | null>(null);
  useRealtimeInvalidate(
    ["attendance", "evaluations", "halaqas"],
    ["parent-child-att", "parent-child-evals", "parent-child-halaqa"],
  );

  const { data: children } = useQuery({
    queryKey: ["parent-children", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("parent_links")
        .select(
          "student:profiles!parent_links_student_user_id_fkey(id, full_name, email, gender, avatar_url)",
        )
        .eq("parent_user_id", user!.id);
      return (data ?? []).map((r: { student: Child }) => r.student);
    },
  });

  const selectedId = activeChild ?? children?.[0]?.id ?? null;
  const selected = children?.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header / parent welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-primary/95 via-primary to-primary/80 p-6 md:p-8 shadow-xl">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.3em] text-gold/90">{t("d.parent.portal")}</div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white">
              {t("d.parent.welcome")}، {profile?.full_name} 👨‍👩‍👧
            </h1>
            <p className="mt-1 text-sm text-white/70">{t("d.parent.follow_journey")}</p>
          </div>
          {children && children.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveChild(c.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold backdrop-blur-md transition ${
                    selectedId === c.id
                      ? "bg-gold text-primary shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {c.full_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!children || children.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card border border-dashed border-gold/30 text-center">
          <div className="text-5xl mb-3">🔗</div>
          <h2 className="text-lg font-bold text-primary mb-1">{t("d.parent.no_child_linked")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("d.parent.no_child_linked_desc")}
          </p>
        </div>
      ) : (
        selected && <ChildPanel child={selected} parentName={profile?.full_name ?? ""} />
      )}
    </div>
  );
}

function ChildPanel({ child, parentName }: { child: Child; parentName: string }) {
  const { user } = useAuth();
  const { t } = useI18n();

  const { data: halaqa } = useQuery({
    queryKey: ["parent-child-halaqa", child.id],
    queryFn: async () => {
      await auditEmbeddedHalaqaRelations(supabase, "parent-child-halaqa");
      const membership = await selectOrThrow<{ halaqa_id: string } | null>(
        "parent-child-halaqa",
        "student_halaqas",
        "halaqa_id",
        supabase.from("student_halaqas").select("halaqa_id").eq("student_id", child.id).maybeSingle(),
        `where student_id = ${child.id}`,
      );
      if (!membership?.halaqa_id) return null;
      const halaqa = await selectOrThrow<any | null>(
        "parent-child-halaqa",
        "halaqas",
        "id, name, level, schedule, schedule_days, start_time, end_time, meeting_provider, meeting_link, live_session_active, current_surah, target_surah, teacher_id, supervisor_id",
        supabase
          .from("halaqas")
          .select("id, name, level, schedule, schedule_days, start_time, end_time, meeting_provider, meeting_link, live_session_active, current_surah, target_surah, teacher_id, supervisor_id")
          .eq("id", membership.halaqa_id)
          .maybeSingle(),
        `where id = ${membership.halaqa_id}`,
      );
      if (!halaqa) return null;
      const [withPeople] = await attachHalaqaPeople(supabase, "parent-child-halaqa", [halaqa]);
      return withPeople as HalaqaInfo;
    },
  });

  const { data: att } = useQuery({
    queryKey: ["parent-child-att", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", child.id)
        .order("date", { ascending: false })
        .limit(120);
      return data ?? [];
    },
  });

  const { data: evals } = useQuery({
    queryKey: ["parent-child-evals", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("evaluations")
        .select("*, teacher:profiles!evaluations_teacher_id_fkey(full_name)")
        .eq("student_id", child.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["parent-child-notes", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("supervisor_notes")
        .select("*")
        .eq("student_id", child.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["parent-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, description, date, category, event_type, cover_url")
        .eq("status", "published")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: notifs } = useQuery({
    queryKey: ["parent-notifs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  // ---- derived stats ----
  const stats = useMemo(() => {
    const total = att?.length ?? 0;
    const present = att?.filter((a) => a.status === "present").length ?? 0;
    const late = att?.filter((a) => a.status === "late").length ?? 0;
    const absent = att?.filter((a) => a.status === "absent").length ?? 0;
    const rate = total ? Math.round((present / total) * 100) : 0;

    const memScores = (evals ?? [])
      .map((e: { memorization_score: number | null }) => e.memorization_score ?? 0)
      .filter(Boolean);
    const memAvg = memScores.length
      ? Math.round(memScores.reduce((a: number, b: number) => a + b, 0) / memScores.length)
      : 0;

    const allScores = (evals ?? []).flatMap((e) =>
      [e.tajweed_score, e.memorization_score, e.fluency_score, e.participation_score].filter(
        (s): s is number => typeof s === "number",
      ),
    );
    const overall = allScores.length
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    return { rate, late, absent, present, memAvg, overall, totalSessions: total };
  }, [att, evals]);

  // monthly attendance (last 6 months)
  const monthly = useMemo(() => {
    const months: Record<string, { present: number; late: number; absent: number; label: string }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      months[k] = {
        present: 0,
        late: 0,
        absent: 0,
        label: d.toLocaleDateString("ar", { month: "short" }),
      };
    }
    (att ?? []).forEach((a) => {
      const d = new Date(a.date);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (months[k] && (a.status === "present" || a.status === "late" || a.status === "absent")) {
        months[k][a.status as "present" | "late" | "absent"]++;
      }
    });
    return Object.values(months);
  }, [att]);

  const maxMonthly = Math.max(1, ...monthly.map((m) => m.present + m.late + m.absent));

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-gold/10 px-5 py-4 shadow-soft">
        <div className="flex items-center gap-4 min-w-0">
          <LogoPremium3D size="sm" halo />
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-primary truncate">
              {parentName ? `أهلًا ${parentName}` : t("d.parent.dashboard_title")}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{t("d.academy_subtitle")}</p>
          </div>
        </div>
      </div>
      <PremiumHeroCard
        child={child}
        parentName={parentName}
        halaqa={halaqa}
        stats={stats}
        lastSessionDate={att?.[0]?.date ?? null}
        lastEval={evals?.[0] ?? null}
        lastNote={notes?.[0] ?? null}
      />

      {/* Memorization + Attendance chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-card to-card/40 backdrop-blur-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              📖 {t("d.parent.memorization_tracking")}
            </h3>
            <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold">
              {stats.memAvg}%
            </span>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("d.parent.current_surah")}
                </div>
                <div className="text-lg font-black text-primary mt-1">
                  {halaqa?.current_surah ?? t("d.parent.default_current_surah")}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gold/10 border border-gold/20">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("d.parent.target")}
                </div>
                <div className="text-lg font-black text-gold-foreground mt-1">
                  {halaqa?.target_surah ?? t("d.parent.default_target_surah")}
                </div>
              </div>
            </div>
            <Progress value={stats.memAvg} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {t("d.parent.memorization_avg_desc")}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              📊 {t("d.parent.monthly_attendance")}
            </h3>
            <div className="flex gap-3 text-[10px]">
              <LegendDot color="bg-emerald-500" label={t("common.present")} />
              <LegendDot color="bg-amber-500" label={t("common.late")} />
              <LegendDot color="bg-rose-500" label={t("common.absent")} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            {monthly.map((m, i) => {
              const total = m.present + m.late + m.absent;
              const h = (total / maxMonthly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg overflow-hidden flex flex-col justify-end bg-muted/40"
                    style={{ height: `${Math.max(h, 6)}%` }}
                  >
                    {m.absent > 0 && (
                      <div
                        className="bg-rose-500/80"
                        style={{ height: `${(m.absent / total) * 100}%` }}
                      />
                    )}
                    {m.late > 0 && (
                      <div
                        className="bg-amber-500/80"
                        style={{ height: `${(m.late / total) * 100}%` }}
                      />
                    )}
                    {m.present > 0 && (
                      <div
                        className="bg-emerald-500/80"
                        style={{ height: `${(m.present / total) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evaluations table + teacher notes */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6">
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-soft">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            ⭐ {t("d.parent.latest_evaluations")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-start py-2 font-semibold">{t("common.date")}</th>
                  <th className="text-start py-2 font-semibold">{t("common.teacher")}</th>
                  <th className="text-center py-2 font-semibold">{t("d.score.tajweed")}</th>
                  <th className="text-center py-2 font-semibold">{t("d.score.memorization")}</th>
                  <th className="text-start py-2 font-semibold">{t("common.notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(evals ?? []).slice(0, 6).map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleDateString("ar")}
                    </td>
                    <td className="py-2.5 text-xs">
                      {(e as { teacher?: { full_name: string | null } }).teacher?.full_name ?? "—"}
                    </td>
                    <td className="py-2.5 text-center">
                      <ScorePill v={e.tajweed_score} />
                    </td>
                    <td className="py-2.5 text-center">
                      <ScorePill v={e.memorization_score} />
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
                      {e.notes ?? "—"}
                    </td>
                  </tr>
                ))}
                {(!evals || evals.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                      {t("d.parent.no_evaluations")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/5 via-card to-card p-6 shadow-soft">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            📝 {t("d.parent.teacher_notes")}
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pe-1">
            {(notes ?? []).map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-2xl bg-background/60 border border-border/60 backdrop-blur"
              >
                <div className="text-[10px] text-muted-foreground mb-1">
                  {new Date(n.created_at).toLocaleDateString("ar")}
                </div>
                <p className="text-sm leading-relaxed">{n.note}</p>
              </div>
            ))}
            {(!notes || notes.length === 0) && (
              <>
                <NoteSample text={t("d.parent.sample_note1")} />
                <NoteSample text={t("d.parent.sample_note2")} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Events + Weekly goals */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-soft">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            🗓️ {t("d.upcoming_events")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {(events ?? []).map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-gold/5 border border-primary/10 hover:border-gold/40 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-gold font-bold">
                      {ev.event_type ?? ev.category ?? t("d.parent.event_default")}
                    </div>
                    <div className="font-bold text-primary truncate">{ev.title}</div>
                  </div>
                  <div className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                    {new Date(ev.date).toLocaleDateString("ar", { day: "numeric", month: "short" })}
                  </div>
                </div>
                {ev.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>
                )}
              </div>
            ))}
            {(!events || events.length === 0) && (
              <>
                <EventSample title={t("d.parent.sample_event1")} type={t("d.parent.sample_event1_type")} />
                <EventSample title={t("d.parent.sample_event2")} type={t("d.parent.sample_event2_type")} />
                <EventSample title={t("d.parent.sample_event3")} type={t("d.parent.sample_event3_type")} />
              </>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gold/30 bg-gradient-to-br from-primary/95 to-primary/80 p-6 shadow-xl text-white">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">🎯 {t("d.parent.weekly_goals")}</h3>
          <div className="space-y-3">
            <Goal label={t("d.parent.goal_memorization")} value={t("d.parent.goal_memorization_value")} pct={70} />
            <Goal label={t("d.parent.goal_review")} value={t("d.parent.goal_review_value")} pct={45} />
            <Goal label={t("d.parent.goal_texts")} value={t("d.parent.goal_texts_value")} pct={85} />
          </div>
        </div>
      </div>

      {/* Notifications + quick actions */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-soft">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            🔔 {t("d.parent.latest_notifications")}
          </h3>
          <div className="divide-y divide-border/60">
            {(notifs ?? []).map((n) => (
              <div key={n.id} className="py-3 flex items-start gap-3">
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    n.is_read ? "bg-muted-foreground/40" : "bg-gold animate-pulse"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">{n.title}</div>
                  {n.content && (
                    <div className="text-xs text-muted-foreground line-clamp-1">{n.content}</div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(n.created_at).toLocaleDateString("ar")}
                </div>
              </div>
            ))}
            {(!notifs || notifs.length === 0) && (
              <div className="py-6 text-center text-muted-foreground text-sm">{t("d.parent.no_notifications")}</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-soft">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            ⚡ {t("d.parent.quick_actions")}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon="⭐" label={t("d.parent.view_evaluations")} to="/dashboard" />
            <QuickAction icon="✅" label={t("d.parent.view_attendance")} to="/dashboard" />
            <QuickAction icon="✉️" label={t("d.parent.contact_admin")} to="/notifications" />
            <QuickAction icon="⬇️" label={t("d.parent.download_report")} to="/dashboard" />
          </div>
        </div>
      </div>

      <AIInsightsPanel studentId={child.id} studentName={child.full_name ?? undefined} />
      {halaqa?.id && <RecordingsPanel halaqaId={halaqa.id} />}
    </div>
  );
}

// ===== small subcomponents =====

function LiveStatus({ halaqa }: { halaqa: HalaqaInfo | null | undefined }) {
  const live = !!halaqa?.live_session_active;
  return (
    <div
      className={`rounded-2xl p-4 min-w-[200px] border ${
        live
          ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/40"
          : "bg-muted/30 border-border"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            live ? "bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-muted-foreground/50"
          }`}
        />
        <span className="text-xs font-bold">
          {live ? `🟢 ${t("d.parent.live_now_label")}` : `⚫ ${t("d.parent.no_live_now")}`}
        </span>
      </div>
      {live && halaqa?.meeting_link && (
        <Button asChild size="sm" className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 text-white">
          <a href={halaqa.meeting_link} target="_blank" rel="noreferrer">
            {t("d.parent.join_now")} ←
          </a>
        </Button>
      )}
    </div>
  );
}

function InfoChip({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="px-3 py-2.5 rounded-2xl bg-muted/40 border border-border min-w-0">
      <div className="text-base">{icon}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
      <div className="text-xs font-bold text-primary truncate">{value}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  ring,
  tone,
  trend,
}: {
  icon: string;
  label: string;
  value: string;
  ring: number;
  tone: "emerald" | "gold" | "violet" | "rose";
  trend?: number[];
}) {
  const toneMap = {
    emerald: "stroke-emerald-500",
    gold: "stroke-gold",
    violet: "stroke-primary",
    rose: "stroke-rose-500",
  } as const;
  const fillMap = {
    emerald: "fill-emerald-500/30 stroke-emerald-500",
    gold: "fill-gold/30 stroke-gold",
    violet: "fill-primary/30 stroke-primary",
    rose: "fill-rose-500/30 stroke-rose-500",
  } as const;
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, ring)) / 100) * c;
  const pts = (trend && trend.length > 1 ? trend : [0, 0]).slice(-8);
  const max = Math.max(1, ...pts);
  const w = 100, h = 28;
  const step = w / Math.max(1, pts.length - 1);
  const line = pts.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-5 shadow-soft hover:border-gold/40 transition">
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-gold/10 blur-2xl group-hover:bg-gold/20 transition" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="relative flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r={r} className="stroke-muted/40" strokeWidth="6" fill="none" />
            <circle
              cx="40"
              cy="40"
              r={r}
              className={toneMap[tone]}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-xl">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-black text-primary mt-1">{value}</div>
          <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="mt-1 h-6 w-full opacity-80">
            <polygon points={area} className={fillMap[tone]} strokeWidth="0" />
            <polyline points={line} className={fillMap[tone]} fill="none" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ScorePill({ v }: { v: number | null }) {
  if (v == null) return <span className="text-muted-foreground text-xs">—</span>;
  const tone =
    v >= 85
      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
      : v >= 65
        ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
        : "bg-rose-500/15 text-rose-600 border-rose-500/30";
  return (
    <span className={`inline-block min-w-[44px] px-2 py-1 rounded-full border text-xs font-bold ${tone}`}>
      {v}
    </span>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} /> {label}
    </span>
  );
}

function NoteSample({ text }: { text: string }) {
  return (
    <div className="p-3 rounded-2xl bg-background/60 border border-border/60 backdrop-blur">
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function EventSample({ title, type }: { title: string; type: string }) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-gold/5 border border-primary/10">
      <div className="text-xs text-gold font-bold">{type}</div>
      <div className="font-bold text-primary">{title}</div>
    </div>
  );
}

function Goal({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-xs font-bold text-gold">{pct}%</div>
      </div>
      <div className="text-sm font-semibold mb-2">{value}</div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold to-amber-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QuickAction({ icon, label, to }: { icon: string; label: string; to?: string }) {
  return (
    <Link
      to={to ?? "/dashboard"}
      className="group flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-gold/5 border border-primary/10 hover:border-gold/40 hover:shadow-md transition text-center"
    >
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-bold text-primary">{label}</span>
    </Link>
  );
}

// ===== Premium hero card =====

type Eval = {
  id: string;
  created_at: string;
  memorization_score: number | null;
  tajweed_score: number | null;
  fluency_score: number | null;
  participation_score: number | null;
  notes: string | null;
};

type NoteRow = { id: string; created_at: string; note: string | null };

function PremiumHeroCard({
  child,
  parentName,
  halaqa,
  stats,
  lastSessionDate,
  lastEval,
  lastNote,
}: {
  child: Child;
  parentName: string;
  halaqa: HalaqaInfo | null | undefined;
  stats: { rate: number; memAvg: number; overall: number; totalSessions: number };
  lastSessionDate: string | null;
  lastEval: Eval | null;
  lastNote: NoteRow | null;
}) {
  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("ar", { day: "numeric", month: "long" }) : "—";

  const lastEvalScore = lastEval
    ? Math.round(
        [
          lastEval.memorization_score,
          lastEval.tajweed_score,
          lastEval.fluency_score,
          lastEval.participation_score,
        ]
          .filter((s): s is number => typeof s === "number")
          .reduce((a, b, _, arr) => a + b / arr.length, 0),
      )
    : null;

  const ringR = 58;
  const ringC = 2 * Math.PI * ringR;
  const ringOff = ringC - (Math.min(100, Math.max(0, stats.memAvg)) / 100) * ringC;

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-gold/30 bg-gradient-to-br from-[#1a0b3d] via-primary to-[#2a1560] p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(80,40,180,0.55)]">
      {/* Gradient background orbs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-gold/10 blur-2xl animate-pulse" />

      {/* Islamic geometric pattern overlay */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="islamic-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M30 0 L60 30 L30 60 L0 30 Z M30 10 L50 30 L30 50 L10 30 Z"
              fill="none"
              stroke="#FFD27A"
              strokeWidth="0.8"
            />
            <circle cx="30" cy="30" r="3" fill="#FFD27A" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-grid)" />
      </svg>

      {/* Floating glow particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-full bg-gold/70 shadow-[0_0_12px_rgba(255,210,122,0.9)] animate-pulse"
            style={{
              top: `${15 + i * 13}%`,
              left: `${(i * 17 + 8) % 95}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2.5 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 space-y-6">
        {/* === Top: student info === */}
        <div className="grid gap-5 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-gold via-fuchsia-400 to-gold opacity-90 blur-md animate-pulse" />
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-gold to-amber-300" />
              {child.avatar_url ? (
                <img
                  src={child.avatar_url}
                  alt={child.full_name ?? ""}
                  className="relative h-24 w-24 md:h-28 md:w-28 rounded-full object-cover border-[3px] border-[#1a0b3d]"
                />
              ) : (
                <div className="relative h-24 w-24 md:h-28 md:w-28 rounded-full bg-gradient-to-br from-primary via-fuchsia-700 to-primary text-white grid place-items-center text-3xl font-black border-[3px] border-[#1a0b3d]">
                  {(child.full_name ?? "?").charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-gold text-primary grid place-items-center text-[11px] font-black shadow-lg border-2 border-[#1a0b3d]">
                ★
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold/90 font-bold">
                {t("d.parent.academy_student")}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white truncate mt-1 drop-shadow">
                {child.full_name}
              </h2>
              <div className="text-xs text-white/70 mt-1 truncate">
                {t("d.parent.guardian")}: <span className="text-gold font-semibold">{parentName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <HeroChip icon="🕌" label={t("dash.my_halaqa")} value={halaqa?.name ?? "—"} />
            <HeroChip icon="👤" label={t("common.teacher")} value={halaqa?.teacher?.full_name ?? "—"} />
            <HeroChip icon="🛡️" label={t("common.supervisor")} value={halaqa?.supervisor?.full_name ?? "—"} />
          </div>

          <LiveStatus halaqa={halaqa} />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* === Stats + Progress ring === */}
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <HeroStat icon="✅" label={t("sup.attendance_rate")} value={`${stats.rate}%`} accent="from-emerald-400 to-emerald-600" />
            <HeroStat icon="📖" label={t("d.parent.weekly_memorization")} value={`${stats.memAvg}%`} accent="from-gold to-amber-500" />
            <HeroStat icon="🕌" label={t("d.parent.sessions_count")} value={`${stats.totalSessions}`} accent="from-fuchsia-400 to-fuchsia-600" />
            <HeroStat
              icon="⭐"
              label={t("d.parent.last_evaluation")}
              value={lastEvalScore != null ? `${lastEvalScore}%` : "—"}
              accent="from-sky-400 to-indigo-500"
            />
          </div>

          <div className="flex items-center justify-center lg:border-s lg:border-gold/20 lg:ps-6">
            <div className="relative h-36 w-36">
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD27A" />
                    <stop offset="100%" stopColor="#E879F9" />
                  </linearGradient>
                </defs>
                <circle cx="70" cy="70" r={ringR} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
                <circle
                  cx="70"
                  cy="70"
                  r={ringR}
                  stroke="url(#ringGrad)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringOff}
                  style={{ transition: "stroke-dashoffset 1.2s ease", filter: "drop-shadow(0 0 8px rgba(255,210,122,0.6))" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-black text-white">{stats.memAvg}%</div>
                <div className="text-[10px] text-gold/90 font-bold tracking-wider mt-0.5">{t("d.parent.progress_in_memorization")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* === Timeline === */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <h4 className="text-sm font-bold text-gold mb-4 flex items-center gap-2">
            <span>🕰️</span> {t("d.parent.activity_timeline")}
          </h4>
          <div className="relative grid gap-4 md:grid-cols-3">
            <TimelineItem icon="📚" label={t("d.parent.last_session")} value={fmt(lastSessionDate)} dotClass="bg-emerald-400" />
            <TimelineItem
              icon="📝"
              label={t("d.parent.last_homework")}
              value={lastNote ? fmt(lastNote.created_at) : "—"}
              dotClass="bg-gold"
            />
            <TimelineItem
              icon="⭐"
              label={t("d.parent.last_evaluation")}
              value={lastEval ? fmt(lastEval.created_at) : "—"}
              dotClass="bg-fuchsia-400"
            />
          </div>
        </div>

        {/* === Quick actions === */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <HeroAction icon="✅" label={t("d.parent.track_attendance")} to="/dashboard" />
          <HeroAction icon="📊" label={t("sup.reports")} to="/dashboard" />
          <HeroAction icon="✉️" label={t("d.parent.contact_teacher")} to="/notifications" />
        </div>
      </div>
    </div>
  );
}

function HeroChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-gold/40 transition min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-gold/80 font-bold">{label}</span>
      </div>
      <div className="text-xs font-bold text-white truncate mt-1">{value}</div>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="group/stat relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,210,122,0.5)] transition-all duration-300">
      <div className={`absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl group-hover/stat:opacity-40 transition`} />
      <div className="relative">
        <div className={`inline-grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br ${accent} text-white text-base shadow-lg`}>
          {icon}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-white/60 font-bold mt-3">{label}</div>
        <div className="text-2xl font-black text-white mt-1">{value}</div>
      </div>
    </div>
  );
}

function TimelineItem({
  icon,
  label,
  value,
  dotClass,
}: {
  icon: string;
  label: string;
  value: string;
  dotClass: string;
}) {
  return (
    <div className="relative flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 transition">
      <div className={`mt-1 h-3 w-3 rounded-full ${dotClass} shadow-[0_0_10px_currentColor] shrink-0`} />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-white/60 font-bold flex items-center gap-1">
          <span>{icon}</span> {label}
        </div>
        <div className="text-sm font-bold text-white mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}

function HeroAction({ icon, label, to }: { icon: string; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="group/act relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-br from-gold via-amber-400 to-gold text-primary font-bold text-sm shadow-[0_8px_24px_-8px_rgba(255,210,122,0.7)] hover:shadow-[0_12px_32px_-8px_rgba(255,210,122,0.9)] hover:-translate-y-0.5 transition-all"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover/act:translate-x-full transition-transform duration-700" />
      <span className="relative text-lg">{icon}</span>
      <span className="relative">{label}</span>
    </Link>
  );
}
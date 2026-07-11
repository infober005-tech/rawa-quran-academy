import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { SubscriptionPanel } from "@/features/subscription/SubscriptionPanel";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { RecordingsPanel } from "@/features/recordings/RecordingsPanel";
import { AIInsightsPanel } from "@/features/insights/AIInsightsPanel";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState } from "@/components/EmptyState";
import { SubscriptionStatusBanner } from "@/components/SubscriptionStatusBanner";
import { attachHalaqaPeople, auditEmbeddedHalaqaRelations, selectOrThrow } from "@/lib/halaqa-query-audit";

export function StudentDashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  useRealtimeInvalidate(["attendance", "evaluations", "halaqas"], ["my-attendance", "my-evals", "my-halaqa"]);

  const { data: assignment } = useQuery({
    queryKey: ["my-halaqa", user?.id],
    enabled: !!user,
    queryFn: async () => {
      await auditEmbeddedHalaqaRelations(supabase, "student-my-halaqa");
      // Read halaqa through the assignment table (student_halaqas → halaqas).
      const { data: memberships, error: memErr } = await supabase
        .from("student_halaqas")
        .select("halaqa_id, joined_at")
        .eq("student_id", user!.id)
        .order("joined_at", { ascending: false });
      if (import.meta.env.DEV) {
        console.info("[student-assignment-audit]", {
          studentId: user!.id,
          rowsInStudentHalaqas: memberships?.length ?? 0,
          assignedHalaqaIds: (memberships ?? []).map((m) => m.halaqa_id),
          memErr,
        });
      }
      if (memErr) throw memErr;
      const halaqaId = memberships?.[0]?.halaqa_id;
      if (!halaqaId) {
        if (import.meta.env.DEV) console.warn("[student-assignment-audit] student_halaqas returned zero rows for", user!.id);
        return null;
      }
      const halaqa = await selectOrThrow<any | null>(
        "student-my-halaqa",
        "halaqas",
        "id, name, level, schedule, meeting_link, live_session_active, meeting_provider, teacher_id, supervisor_id",
        supabase
          .from("halaqas")
          .select("id, name, level, schedule, meeting_link, live_session_active, meeting_provider, teacher_id, supervisor_id")
          .eq("id", halaqaId)
          .maybeSingle(),
        `where id = ${halaqaId}`,
      );
      if (import.meta.env.DEV && !halaqa) {
        console.warn("[student-assignment-audit] halaqa lookup returned zero rows for", halaqaId);
      }
      if (!halaqa) return null;
      const [withPeople] = await attachHalaqaPeople(supabase, "student-my-halaqa", [halaqa]);
      return { halaqa: withPeople };
    },
  });

  const { data: att } = useQuery({
    queryKey: ["my-attendance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("status, date").eq("student_id", user!.id).order("date", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const { data: evals } = useQuery({
    queryKey: ["my-evals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("evaluations")
        .select(
          "id, student_id, teacher_id, halaqa_id, session_id, tajweed_score, memorization_score, behavior_score, fluency_score, participation_score, notes, created_at",
        )
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const { data: homework } = useQuery({
    queryKey: ["my-homework", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("assignments").select("*").or(`student_id.eq.${user!.id},halaqa_id.not.is.null`).order("due_date", { ascending: true }).limit(20);
      return data ?? [];
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["my-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").eq("status", "published").gte("date", new Date().toISOString()).order("date", { ascending: true }).limit(5);
      return data ?? [];
    },
  });

  const total = att?.length ?? 0;
  const present = att?.filter((a) => a.status === "present").length ?? 0;
  const rate = total ? Math.round((present / total) * 100) : 0;

  const halaqa = (assignment as any)?.halaqa;

  const mergedEvals = useMemo(() => {
    const rows = ((evals ?? []) as any[]).filter(Boolean);
    const scoreFields = [
      "tajweed_score",
      "memorization_score",
      "behavior_score",
      "fluency_score",
      "participation_score",
      "notes",
    ];
    const timestampOf = (row: any) => new Date(row.updated_at ?? row.created_at ?? 0).getTime();
    const dayOf = (row: any) => {
      const source = row.evaluation_date ?? row.created_at;
      const date = source ? new Date(source) : null;
      return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : "unknown";
    };
    const hasEvaluationContent = (row: any) =>
      scoreFields.some((field) => row[field] !== null && row[field] !== undefined && row[field] !== "");

    const groups = new Map<string, any[]>();
    for (const row of rows) {
      const evaluationDate = dayOf(row);
      const key = row.session_id
        ? `session:${row.session_id}`
        : `fallback:${row.halaqa_id ?? "none"}:${row.student_id ?? user?.id ?? "unknown"}:${evaluationDate}`;
      const group = groups.get(key) ?? [];
      group.push({ ...row, evaluation_date: evaluationDate });
      groups.set(key, group);
    }

    const merged = Array.from(groups.entries())
      .map(([groupKey, groupRows]) => {
        const sortedRows = [...groupRows].sort((a, b) => timestampOf(a) - timestampOf(b));
        const latest = sortedRows[sortedRows.length - 1];
        const mergedRow: any = { ...latest, evaluation_group_key: groupKey };

        for (const row of sortedRows) {
          for (const field of scoreFields) {
            if (row[field] !== null && row[field] !== undefined && row[field] !== "") {
              mergedRow[field] = row[field];
            }
          }
        }

        return mergedRow;
      })
      .filter(hasEvaluationContent)
      .sort((a, b) => timestampOf(b) - timestampOf(a));

    console.info(
      "[student-evaluations] groups:",
      Array.from(groups.entries()).map(([key, groupRows]) => ({
        key,
        count: groupRows.length,
        session_id: groupRows[0]?.session_id ?? null,
        halaqa_id: groupRows[0]?.halaqa_id ?? null,
        student_id: groupRows[0]?.student_id ?? null,
        evaluation_date: groupRows[0]?.evaluation_date ?? null,
        ids: groupRows.map((row) => row.id),
      })),
    );
    console.info("[student-evaluations] merged:", merged);
    console.info("[student-evaluations] duplicates removed:", Math.max(0, rows.length - merged.length));

    return merged;
  }, [evals, user?.id]);

  const chartData = mergedEvals.map((e: any, i: number) => ({
    name: `#${i + 1}`,
    tajweed: e.tajweed_score ?? 0,
    memorization: e.memorization_score ?? 0,
    fluency: e.fluency_score ?? 0,
  }));

  return (
    <div className="space-y-6">
      <DashboardHeader
        badge={t("d.student.badge")}
        title={t("d.welcome_comma", { name: profile?.full_name ?? "" })}
        subtitle={halaqa?.name ? `${halaqa.name} · ${halaqa.level ?? ""}` : t("d.academy_subtitle")}
        actions={
          halaqa?.live_session_active ? (
            <span className="px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 text-xs font-bold animate-pulse">● {t("d.live_now")}</span>
          ) : null
        }
      />

      <SubscriptionStatusBanner />

      <SubscriptionPanel />

      <div className="grid md:grid-cols-3 gap-4">
        <StatCard icon="🕌" label={t("dash.my_halaqa")} value={halaqa?.name ?? "—"} />
        <StatCard icon="✅" label={t("dash.attendance")} value={`${rate}%`} />
        <StatCard icon="⭐" label={t("dash.evaluations")} value={String(mergedEvals.length)} />
      </div>

      {halaqa ? (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">{t("dash.my_halaqa")} · {halaqa.name}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <Info label={t("common.teacher")} value={halaqa.teacher?.full_name ?? "—"} />
            <Info label={t("common.supervisor")} value={halaqa.supervisor?.full_name ?? "—"} />
            <Info label={t("common.level")} value={halaqa.level} />
            <Info label={t("auth.schedule")} value={halaqa.schedule ?? "—"} />
          </div>
          {halaqa.meeting_link && (
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              {halaqa.live_session_active && (
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-bold animate-pulse">● {t("d.live_now")}</span>
              )}
              <a
                href={halaqa.meeting_link}
                target="_blank"
                rel="noreferrer"
                className={`inline-block px-6 py-2.5 rounded-full font-semibold shadow-glow ${
                  halaqa.live_session_active
                    ? "bg-green-600 text-white"
                    : "bg-gradient-royal text-primary-foreground"
                }`}
              >
                ▶ {halaqa.live_session_active ? t("d.join_live_session") : t("dash.join")}
              </a>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          variant="halaqas"
          title={t("dash.no_halaqa")}
          description={t("d.student.no_halaqa_desc")}
        />
      )}

      {chartData.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">📈 {t("d.progress")}</h2>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="tajweed" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="memorization" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="fluency" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">📝 {t("d.homework")}</h2>
          <div className="divide-y divide-border">
            {homework?.map((h: any) => (
              <div key={h.id} className="py-2.5">
                <div className="font-semibold text-sm">{h.title}</div>
                {h.due_date && <div className="text-xs text-gold">{t("d.due")}: {h.due_date}</div>}
                {h.description && <div className="text-xs text-muted-foreground mt-1">{h.description}</div>}
              </div>
            ))}
            {(!homework || homework.length === 0) && (
              <EmptyState compact variant="homework" title={t("d.student.no_homework")} description={t("d.student.no_homework_desc")} />
            )}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">📅 {t("dash.upcoming")}</h2>
          <div className="divide-y divide-border">
            {upcoming?.map((e: any) => (
              <div key={e.id} className="py-2.5">
                <div className="font-semibold text-sm">{e.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</div>
              </div>
            ))}
            {(!upcoming || upcoming.length === 0) && (
              <EmptyState compact variant="events" title={t("d.no_upcoming_events")} description={t("d.no_upcoming_events_desc")} />
            )}
          </div>
        </div>
      </div>

      {att && att.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">✅ {t("d.attendance_history")}</h2>
          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            {att.slice(0, 40).map((a: any, i: number) => (
              <div key={i} className={`aspect-square rounded-md text-[10px] flex flex-col items-center justify-center font-semibold ${a.status === "present" ? "bg-green-500/20 text-green-600" : a.status === "late" ? "bg-amber-500/20 text-amber-600" : "bg-red-500/20 text-red-600"}`} title={`${a.date}: ${a.status}`}>
                <span>{new Date(a.date).getDate()}</span>
                <span>{a.status[0].toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user && <AIInsightsPanel studentId={user.id} studentName={profile?.full_name ?? undefined} />}
      {halaqa && <RecordingsPanel halaqaId={halaqa.id} />}

      {mergedEvals.length > 0 && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">{t("dash.evaluations")}</h2>
          <div className="space-y-3">
            {mergedEvals.map((e: any) => (
              <div key={e.id} className="p-3 rounded-xl bg-muted/40 text-sm grid grid-cols-2 md:grid-cols-6 gap-2">
                <div><span className="text-xs text-muted-foreground">{t("d.score.tajweed")}</span><div className="font-bold text-primary">{e.tajweed_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">{t("d.score.memorization")}</span><div className="font-bold text-primary">{e.memorization_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">{t("d.score.behavior")}</span><div className="font-bold text-primary">{e.behavior_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">{t("d.score.fluency")}</span><div className="font-bold text-primary">{e.fluency_score ?? "—"}</div></div>
                <div><span className="text-xs text-muted-foreground">{t("d.score.participation")}</span><div className="font-bold text-primary">{e.participation_score ?? "—"}</div></div>
                <div className="col-span-2 md:col-span-1 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</div>
                {e.notes && <div className="col-span-full text-xs text-muted-foreground">{e.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary mt-1">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/40">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  );
}
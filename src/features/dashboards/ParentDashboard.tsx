import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

type Child = { id: string; full_name: string | null; email: string | null; gender: string | null };

export function ParentDashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [activeChild, setActiveChild] = useState<string | null>(null);

  const { data: children } = useQuery({
    queryKey: ["parent-children", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("parent_links")
        .select("student:profiles!parent_links_student_user_id_fkey(id, full_name, email, gender)")
        .eq("parent_user_id", user!.id);
      return (links ?? []).map((r: { student: Child }) => r.student);
    },
  });

  const selectedId = activeChild ?? children?.[0]?.id ?? null;
  const selected = children?.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">
        {t("dash.welcome")}، {profile?.full_name} 👨‍👩‍👧
      </h1>

      {!children || children.length === 0 ? (
        <div className="p-10 rounded-2xl bg-card border border-dashed text-center text-muted-foreground">
          No linked students yet. Contact the academy director to link your child's account.
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveChild(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedId === c.id ? "bg-gradient-royal text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {c.full_name}
              </button>
            ))}
          </div>

          {selected && <ChildPanel child={selected} />}
        </>
      )}
    </div>
  );
}

function ChildPanel({ child }: { child: Child }) {
  const { t } = useI18n();

  const { data: halaqa } = useQuery({
    queryKey: ["parent-child-halaqa", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_halaqas")
        .select(
          "halaqa:halaqas(id, name, level, schedule, schedule_days, start_time, end_time, meeting_provider, meeting_link, live_session_active, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name))"
        )
        .eq("student_id", child.id)
        .maybeSingle();
      return (data as { halaqa: HalaqaInfo } | null)?.halaqa ?? null;
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
        .limit(60);
      return data ?? [];
    },
  });

  const { data: evals } = useQuery({
    queryKey: ["parent-child-evals", child.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("evaluations")
        .select("*")
        .eq("student_id", child.id)
        .order("created_at", { ascending: false })
        .limit(20);
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
        .limit(20);
      return data ?? [];
    },
  });

  const total = att?.length ?? 0;
  const present = att?.filter((a) => a.status === "present").length ?? 0;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const memScores = (evals ?? []).map((e: { memorization_score: number | null }) => e.memorization_score ?? 0).filter(Boolean);
  const avgMem = memScores.length ? Math.round(memScores.reduce((a: number, b: number) => a + b, 0) / memScores.length) : 0;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Stat icon="🕌" label={t("dash.my_halaqa")} value={halaqa?.name ?? "—"} />
        <Stat icon="✅" label={t("dash.attendance")} value={`${rate}%`} />
        <Stat icon="📖" label="Memorization avg" value={`${avgMem}%`} />
      </div>

      {halaqa && (
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-primary">{halaqa.name}</h2>
              <div className="text-xs text-muted-foreground mt-1">
                {halaqa.level} · {t("common.teacher")}: {halaqa.teacher?.full_name ?? "—"} ·{" "}
                {t("common.supervisor")}: {halaqa.supervisor?.full_name ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {halaqa.schedule_days?.join(", ") || halaqa.schedule || "—"}
                {halaqa.start_time && ` · ${halaqa.start_time}–${halaqa.end_time ?? "?"}`}
              </div>
            </div>
            {halaqa.live_session_active && (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-bold animate-pulse">
                ● LIVE NOW
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">✅ Attendance</h2>
          <div className="grid grid-cols-10 gap-1.5">
            {(att ?? []).slice(0, 40).map((a, i) => (
              <div
                key={i}
                title={`${a.date}: ${a.status}`}
                className={`aspect-square rounded-md text-[10px] flex flex-col items-center justify-center font-semibold ${
                  a.status === "present"
                    ? "bg-green-500/20 text-green-600"
                    : a.status === "late"
                    ? "bg-amber-500/20 text-amber-600"
                    : "bg-red-500/20 text-red-600"
                }`}
              >
                <span>{new Date(a.date).getDate()}</span>
                <span>{a.status[0].toUpperCase()}</span>
              </div>
            ))}
            {(!att || att.length === 0) && <div className="col-span-full text-xs text-muted-foreground py-4 text-center">—</div>}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <h2 className="text-xl font-bold text-primary mb-4">📝 Teacher notes</h2>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {(notes ?? []).map((n) => (
              <div key={n.id} className="py-2.5 text-sm">
                <div className="text-muted-foreground text-xs">{new Date(n.created_at).toLocaleDateString()}</div>
                <div className="mt-1">{n.note}</div>
              </div>
            ))}
            {(!notes || notes.length === 0) && (
              <div className="py-6 text-center text-muted-foreground text-sm">—</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
        <h2 className="text-xl font-bold text-primary mb-4">⭐ {t("dash.evaluations")}</h2>
        <div className="space-y-2">
          {(evals ?? []).map((e) => (
            <div key={e.id} className="p-3 rounded-xl bg-muted/40 text-sm grid grid-cols-2 md:grid-cols-5 gap-2">
              <Score label="Tajweed" v={e.tajweed_score} />
              <Score label="Memorization" v={e.memorization_score} />
              <Score label="Fluency" v={e.fluency_score} />
              <Score label="Participation" v={e.participation_score} />
              <div className="text-xs text-muted-foreground self-center">
                {new Date(e.created_at).toLocaleDateString()}
              </div>
              {e.notes && <div className="col-span-full text-xs text-muted-foreground">{e.notes}</div>}
            </div>
          ))}
          {(!evals || evals.length === 0) && (
            <div className="py-6 text-center text-muted-foreground text-sm">—</div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  teacher: { full_name: string | null } | null;
  supervisor: { full_name: string | null } | null;
};

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-primary mt-1">{value}</div>
    </div>
  );
}
function Score({ label, v }: { label: string; v: number | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-bold text-primary">{v ?? "—"}</div>
    </div>
  );
}
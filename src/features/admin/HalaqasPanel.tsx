import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ar as arLocale, fr as frLocale, enUS as enLocale } from "date-fns/locale";
import { Calendar as CalendarIcon, Search, Users2, Video, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { attachHalaqaPeople, auditEmbeddedHalaqaRelations, selectOrThrow } from "@/lib/halaqa-query-audit";

// Weekday tokens stored in schedule_days (existing convention)
const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const DAY_LABEL_KEYS: Record<string, string> = {
  Sat: "a.calendar.day.sat", Sun: "a.calendar.day.sun", Mon: "a.calendar.day.mon", Tue: "a.calendar.day.tue",
  Wed: "a.calendar.day.wed", Thu: "a.calendar.day.thu", Fri: "a.calendar.day.fri",
};
// JS getDay(): 0=Sun..6=Sat → weekday label key
const JS_DAY_KEYS = ["a.calendar.day.sun", "a.calendar.day.mon", "a.calendar.day.tue", "a.calendar.day.wed", "a.calendar.day.thu", "a.calendar.day.fri", "a.calendar.day.sat"];

const inputCls =
  "w-full min-h-11 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

type HalaqaStatus = "active" | "archived" | "inactive" | "draft" | "published";

type Halaqa = {
  id: string;
  name: string;
  description: string | null;
  gender: "male" | "female";
  level: "beginner" | "intermediate" | "advanced";
  teacher_id: string | null;
  supervisor_id: string | null;
  schedule: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  meeting_provider: string | null;
  meeting_link: string | null;
  max_students: number | null;
  status: HalaqaStatus;
  halaqa_date: string | null;
  halaqa_day: number | null;
  teacher?: { full_name: string } | null;
  supervisor?: { full_name: string } | null;
};

type FormState = Omit<Halaqa, "id" | "teacher" | "supervisor"> & {
  selectedStudentIds: string[];
};

const empty = (): FormState => ({
  name: "",
  description: "",
  gender: "male",
  level: "beginner",
  teacher_id: null,
  supervisor_id: null,
  schedule: "",
  schedule_days: [],
  start_time: "",
  end_time: "",
  meeting_provider: "google_meet",
  meeting_link: "",
  max_students: null,
  status: "draft",
  halaqa_date: null,
  halaqa_day: null,
  selectedStudentIds: [],
});

function useLocale() {
  const { lang } = useI18n();
  return lang === "ar" ? arLocale : lang === "fr" ? frLocale : enLocale;
}

function fmtDate(dateISO: string | null, locale: ReturnType<typeof useLocale>): string {
  if (!dateISO) return "—";
  try { return format(parseISO(dateISO), "d MMMM yyyy", { locale }); } catch { return dateISO; }
}
function displayStatus(s: HalaqaStatus): "published" | "draft" | "archived" {
  if (s === "draft") return "draft";
  if (s === "archived" || s === "inactive") return "archived";
  return "published"; // active + published
}

// ─────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────
export function HalaqasPanel() {
  const { t, dir } = useI18n();
  const qc = useQueryClient();
  const locale = useLocale();
  const [editing, setEditing] = useState<Halaqa | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [fName, setFName] = useState("");
  const [fTeacher, setFTeacher] = useState<string>("");
  const [fLevel, setFLevel] = useState<string>("");
  const [fDay, setFDay] = useState<string>("");
  const [fStatus, setFStatus] = useState<"all" | "draft" | "published">("all");
  const [fFrom, setFFrom] = useState<string>("");
  const [fTo, setFTo] = useState<string>("");

  const { data: halaqas } = useQuery({
    queryKey: ["admin-halaqas"],
    queryFn: async () => {
      await auditEmbeddedHalaqaRelations(supabase, "admin-halaqas");
      const data = await selectOrThrow<Halaqa[]>(
        "admin-halaqas",
        "halaqas",
        "*",
        supabase.from("halaqas").select("*").order("created_at", { ascending: false }),
        "order by created_at desc",
      );
      return await attachHalaqaPeople(supabase, "admin-halaqas", data ?? []) as Halaqa[];
    },
  });

  const { data: teacherOptions } = useQuery({
    queryKey: ["admin-teacher-options"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as { id: string; full_name: string }[];
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return (data ?? []) as { id: string; full_name: string }[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("halaqas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-halaqas"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: HalaqaStatus }) => {
      const { error } = await supabase.from("halaqas").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-halaqas"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const list = halaqas ?? [];
    const q = fName.trim().toLowerCase();
    return list.filter((h) => {
      if (q && !h.name.toLowerCase().includes(q)) return false;
      if (fTeacher && h.teacher_id !== fTeacher) return false;
      if (fLevel && h.level !== fLevel) return false;
      if (fDay && !(h.schedule_days ?? []).includes(fDay)) return false;
      if (fStatus === "draft" && h.status !== "draft") return false;
      if (fStatus === "published" && !(h.status === "published" || h.status === "active")) return false;
      if (fFrom && (!h.halaqa_date || h.halaqa_date < fFrom)) return false;
      if (fTo && (!h.halaqa_date || h.halaqa_date > fTo)) return false;
      return true;
    });
  }, [halaqas, fName, fTeacher, fLevel, fDay, fStatus, fFrom, fTo]);

  return (
    <div className="space-y-4" dir={dir}>
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <h2 className="text-xl font-bold text-primary">
          {t("dir.halaqas")} <span className="text-sm text-muted-foreground">({filtered.length}/{halaqas?.length ?? 0})</span>
        </h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="min-h-11 px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-sm font-semibold shadow-glow"
        >
          + {t("dir.new_halaqa")}
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-soft grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <Search className="absolute inset-y-0 my-auto ms-3 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            value={fName}
            onChange={(e) => setFName(e.target.value)}
            placeholder={t("a.halaqas.name_placeholder")}
            className={cn(inputCls, "ps-9")}
          />
        </label>
        <select value={fTeacher} onChange={(e) => setFTeacher(e.target.value)} className={inputCls}>
          <option value="">{t("a.halaqas.all_teachers")}</option>
          {teacherOptions?.map((tt) => <option key={tt.id} value={tt.id}>{tt.full_name}</option>)}
        </select>
        <select value={fLevel} onChange={(e) => setFLevel(e.target.value)} className={inputCls}>
          <option value="">{t("a.halaqas.all_levels")}</option>
          <option value="beginner">{t("a.halaqas.level.beginner")}</option>
          <option value="intermediate">{t("a.halaqas.level.intermediate")}</option>
          <option value="advanced">{t("a.halaqas.level.advanced")}</option>
        </select>
        <select value={fDay} onChange={(e) => setFDay(e.target.value)} className={inputCls}>
          <option value="">{t("a.halaqas.all_days")}</option>
          {DAYS.map((d) => <option key={d} value={d}>{t(DAY_LABEL_KEYS[d])}</option>)}
        </select>
        <div className="sm:col-span-2 lg:col-span-2 flex flex-wrap gap-1 p-1 rounded-xl bg-muted/50">
          {(["all", "published", "draft"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFStatus(k)}
              className={cn(
                "flex-1 min-h-10 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                fStatus === k ? "bg-gradient-royal text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-background/70",
              )}
            >
              {k === "all" ? t("a.halaqas.all") : k === "published" ? t("a.halaqas.published") : t("a.halaqas.draft")}
            </button>
          ))}
        </div>
        <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className={inputCls} placeholder={t("a.halaqas.from")} />
        <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className={inputCls} placeholder={t("a.halaqas.to")} />
      </div>

      {showForm && (
        <HalaqaForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />
      )}

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((h) => {
          const disp = displayStatus(h.status);
          return (
            <article key={h.id} className="p-5 rounded-2xl bg-card border border-border shadow-soft space-y-3">
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-primary truncate">{h.name}</h3>
                  <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{h.level === "beginner" ? t("a.halaqas.level.beginner") : h.level === "intermediate" ? t("a.halaqas.level.intermediate") : t("a.halaqas.level.advanced")}</span>
                    <span>·</span>
                    <span>{h.gender === "male" ? t("a.halaqas.gender.male") : t("a.halaqas.gender.female")}</span>
                  </div>
                </div>
                <Badge variant={disp === "published" ? "success" : disp === "draft" ? "warning" : "outline"}>
                  {disp === "published" ? t("a.halaqas.published") : disp === "draft" ? t("a.halaqas.draft") : t("a.halaqas.archived")}
                </Badge>
              </header>
              <dl className="text-xs text-muted-foreground grid grid-cols-1 gap-1.5">
                <div className="flex items-center gap-2"><span className="opacity-70">{t("a.halaqas.teacher_label")}</span><span className="truncate">{h.teacher?.full_name ?? "—"}</span></div>
                <div className="flex items-center gap-2"><span className="opacity-70">{t("a.halaqas.supervisor_label")}</span><span className="truncate">{h.supervisor?.full_name ?? "—"}</span></div>
                {h.max_students && <div className="flex items-center gap-2"><Users2 className="h-3.5 w-3.5" aria-hidden /><span>{t("a.halaqas.up_to_students", { count: h.max_students })}</span></div>}
                {h.halaqa_date && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" aria-hidden />
                    <span>{fmtDate(h.halaqa_date, locale)}</span>
                    {h.halaqa_day !== null && <span className="opacity-70">· {t(JS_DAY_KEYS[h.halaqa_day])}</span>}
                  </div>
                )}
                {(h.start_time || h.end_time) && (
                  <div className="opacity-80">🕐 {h.start_time ?? "?"} – {h.end_time ?? "?"}</div>
                )}
                {(h.schedule_days?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {h.schedule_days!.map((d) => (
                      <span key={d} className="px-2 py-0.5 rounded-full bg-muted text-[10px]">{DAY_LABEL_KEYS[d] ? t(DAY_LABEL_KEYS[d]) : d}</span>
                    ))}
                  </div>
                )}
              </dl>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {h.meeting_link && (h.status === "active" || h.status === "published") && (
                  <a
                    href={h.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-9 rounded-full bg-gold/20 text-gold-foreground text-[11px] font-semibold border border-gold/40"
                  >
                    <Video className="h-3.5 w-3.5" aria-hidden /> Meet
                  </a>
                )}
                <div className="ms-auto flex items-center gap-1">
                  <select
                    value={h.status}
                    onChange={(e) => setStatus.mutate({ id: h.id, status: e.target.value as HalaqaStatus })}
                    className="min-h-9 px-2 py-1 rounded-lg border border-input bg-background text-[11px]"
                    aria-label={t("a.halaqas.status_aria")}
                  >
                    <option value="draft">{t("a.halaqas.draft")}</option>
                    <option value="published">{t("a.halaqas.published")}</option>
                    <option value="active">{t("a.halaqas.active_old")}</option>
                    <option value="inactive">{t("a.halaqas.inactive")}</option>
                    <option value="archived">{t("a.halaqas.archived")}</option>
                  </select>
                  <button onClick={() => { setEditing(h); setShowForm(true); }} className="min-h-9 px-3 py-1 rounded-full text-xs bg-muted">{t("common.edit")}</button>
                  <button onClick={() => { if (confirm(t("a.confirm.delete"))) del.mutate(h.id); }} className="min-h-9 px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive">{t("common.delete")}</button>
                </div>
              </div>
              <HalaqaStudents halaqa={h} />
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3 p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Form
// ─────────────────────────────────────────────────────────────────
function HalaqaForm({ initial, onClose }: { initial: Halaqa | null; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const locale = useLocale();

  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          gender: initial.gender,
          level: initial.level,
          teacher_id: initial.teacher_id,
          supervisor_id: initial.supervisor_id,
          schedule: initial.schedule ?? "",
          schedule_days: initial.schedule_days ?? [],
          start_time: initial.start_time ?? "",
          end_time: initial.end_time ?? "",
          meeting_provider: initial.meeting_provider ?? "google_meet",
          meeting_link: initial.meeting_link ?? "",
          max_students: initial.max_students,
          status: initial.status,
          halaqa_date: initial.halaqa_date,
          halaqa_day: initial.halaqa_day,
          selectedStudentIds: [],
        }
      : empty(),
  );

  // Load current assigned students when editing
  useQuery({
    queryKey: ["halaqa-current-students", initial?.id],
    enabled: !!initial?.id,
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student_id").eq("halaqa_id", initial!.id);
      const ids = (data ?? []).map((r: { student_id: string }) => r.student_id);
      setForm((f) => ({ ...f, selectedStudentIds: ids }));
      return ids;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as { id: string; full_name: string; gender: string | null }[];
      const { data } = await supabase.from("profiles").select("id, full_name, gender").in("id", ids);
      return (data ?? []) as { id: string; full_name: string; gender: string | null }[];
    },
  });
  const { data: supervisors } = useQuery({
    queryKey: ["admin-supervisors"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "halaqa_supervisor");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as { id: string; full_name: string; gender: string | null }[];
      const { data } = await supabase.from("profiles").select("id, full_name, gender").in("id", ids);
      return (data ?? []) as { id: string; full_name: string; gender: string | null }[];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["form-students", form.gender],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as { id: string; full_name: string; quran_level: string | null }[];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, quran_level, gender, status")
        .in("id", ids)
        .eq("gender", form.gender)
        .eq("status", "approved");
      return (data ?? []) as { id: string; full_name: string; quran_level: string | null }[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      // Validation
      if (!form.name.trim()) throw new Error(t("a.halaqas.name_required"));
      if (!form.teacher_id) throw new Error(t("a.halaqas.teacher_required"));
      if (!form.gender) throw new Error(t("a.halaqas.gender_required"));
      if (!form.level) throw new Error(t("a.halaqas.level_required"));
      if (!form.max_students || form.max_students < 1) throw new Error(t("a.halaqas.max_students_required"));
      if (!form.halaqa_date) throw new Error(t("a.halaqas.date_required"));
      if (!form.start_time) throw new Error(t("a.halaqas.start_time_required"));
      if (!form.end_time) throw new Error(t("a.halaqas.end_time_required"));
      if (!form.meeting_link?.trim()) throw new Error(t("a.halaqas.meeting_link_required"));
      if (!form.status) throw new Error(t("a.halaqas.status_required"));
      if ((form.schedule_days?.length ?? 0) < 1) throw new Error(t("a.halaqas.choose_one_day"));
      if (form.selectedStudentIds.length < 1) throw new Error(t("a.halaqas.choose_one_student"));

      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        gender: form.gender,
        level: form.level,
        teacher_id: form.teacher_id,
        supervisor_id: form.supervisor_id,
        schedule: form.schedule || null,
        schedule_days: form.schedule_days,
        start_time: form.start_time,
        end_time: form.end_time,
        meeting_provider: form.meeting_provider,
        meeting_link: form.meeting_link.trim(),
        max_students: form.max_students,
        status: form.status,
        halaqa_date: form.halaqa_date,
        halaqa_day: form.halaqa_day,
      };

      let halaqaId = initial?.id;
      if (initial) {
        const { error } = await supabase.from("halaqas").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        if (import.meta.env.DEV) console.info("[HalaqasPanel] INSERT payload", payload);
        const { data, error, status } = await supabase.from("halaqas").insert(payload).select("id").single();
        if (import.meta.env.DEV) console.info("[HalaqasPanel] INSERT result", { data, error, status });
        if (error) throw new Error(t("a.halaqas.create_failed", { msg: error.message }));
        if (!data?.id) throw new Error(t("a.halaqas.read_after_create_failed"));
        halaqaId = data.id;
        // Read-after-write verification: confirm the row is visible under RLS
        const verify = await supabase.from("halaqas").select("id, status, teacher_id, supervisor_id").eq("id", halaqaId).maybeSingle();
        if (import.meta.env.DEV) console.info("[HalaqasPanel] VERIFY row", verify);
        if (verify.error) throw new Error(t("a.halaqas.created_unreadable", { msg: verify.error.message }));
        if (!verify.data) throw new Error(t("a.halaqas.created_hidden_rls"));
      }

      // Sync students
      if (halaqaId) {
        const { data: existing } = await supabase.from("student_halaqas").select("student_id").eq("halaqa_id", halaqaId);
        const existingIds = new Set((existing ?? []).map((r: { student_id: string }) => r.student_id));
        const nextIds = new Set(form.selectedStudentIds);
        const toAdd = [...nextIds].filter((id) => !existingIds.has(id));
        const toRemove = [...existingIds].filter((id) => !nextIds.has(id));
        if (toAdd.length) {
          const { error } = await supabase.from("student_halaqas").insert(toAdd.map((sid) => ({ halaqa_id: halaqaId!, student_id: sid })));
          if (error) throw error;
        }
        for (const sid of toRemove) {
          const { error } = await supabase.from("student_halaqas").delete().eq("halaqa_id", halaqaId).eq("student_id", sid);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      // Invalidate every list that shows halaqas so new rows appear everywhere
      qc.invalidateQueries({ queryKey: ["admin-halaqas"] });
      qc.invalidateQueries({ queryKey: ["halaqas-all"] });
      qc.invalidateQueries({ queryKey: ["teacher-halaqas"] });
      qc.invalidateQueries({ queryKey: ["supervisor-halaqas"] });
      qc.invalidateQueries({ queryKey: ["gs-halaqas"] });
      qc.invalidateQueries({ queryKey: ["dir-stats"] });
      qc.invalidateQueries({ queryKey: ["dir-analytics"] });
      qc.invalidateQueries({ queryKey: ["dir-live"] });
      // Student-side assignment views must refresh after a roster change.
      qc.invalidateQueries({ queryKey: ["my-halaqa"] });
      qc.invalidateQueries({ queryKey: ["student-halaqa"] });
      qc.invalidateQueries({ queryKey: ["student-dashboard"] });
      qc.invalidateQueries({ queryKey: ["student-progress"] });
      toast.success(t("a.halaqas.saved"));
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredTeachers = (teachers ?? []).filter((u) => !u.gender || u.gender === form.gender);
  const filteredSupervisors = (supervisors ?? []).filter((u) => !u.gender || u.gender === form.gender);

  const toggleDay = (d: string) =>
    setForm((f) => ({
      ...f,
      schedule_days: f.schedule_days?.includes(d)
        ? f.schedule_days.filter((x) => x !== d)
        : [...(f.schedule_days ?? []), d],
    }));

  const onPickDate = (date?: Date) => {
    if (!date) return setForm((f) => ({ ...f, halaqa_date: null, halaqa_day: null }));
    const iso = format(date, "yyyy-MM-dd");
    setForm((f) => ({ ...f, halaqa_date: iso, halaqa_day: date.getDay() }));
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="p-5 rounded-2xl bg-card border-2 border-primary/30 shadow-premium grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    >
      {/* Halaqa name */}
      <div className="lg:col-span-3">
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.name_label")}</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder={t("a.halaqas.name_example")}
          className={cn(inputCls, "mt-1")}
        />
      </div>

      {/* Gender / Level */}
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.gender_label")}</label>
        <select
          value={form.gender}
          onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as FormState["gender"], selectedStudentIds: [] }))}
          className={cn(inputCls, "mt-1")}
        >
          <option value="male">{t("auth.male")}</option>
          <option value="female">{t("auth.female")}</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.level_label")}</label>
        <select
          value={form.level}
          onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as FormState["level"] }))}
          className={cn(inputCls, "mt-1")}
        >
          <option value="beginner">{t("a.halaqas.level.beginner")}</option>
          <option value="intermediate">{t("a.halaqas.level.intermediate")}</option>
          <option value="advanced">{t("a.halaqas.level.advanced")}</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.max_students_label")}</label>
        <input
          required
          type="number"
          min={1}
          value={form.max_students ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, max_students: e.target.value ? Number(e.target.value) : null }))}
          className={cn(inputCls, "mt-1")}
          inputMode="numeric"
        />
      </div>

      {/* Teacher / Supervisor */}
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.teacher_field")}</label>
        <select
          required
          value={form.teacher_id ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value || null }))}
          className={cn(inputCls, "mt-1")}
        >
          <option value="">{t("a.halaqas.choose_teacher")}</option>
          {filteredTeachers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.supervisor_field")}</label>
        <select
          value={form.supervisor_id ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, supervisor_id: e.target.value || null }))}
          className={cn(inputCls, "mt-1")}
        >
          <option value="">{t("a.halaqas.choose_supervisor")}</option>
          {filteredSupervisors.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>

      {/* Date + auto day */}
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.date_label")}</label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(inputCls, "mt-1 flex items-center justify-between text-start")}
            >
              <span className={form.halaqa_date ? "" : "text-muted-foreground"}>
                {form.halaqa_date ? fmtDate(form.halaqa_date, locale) : t("a.halaqas.choose_date")}
              </span>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={form.halaqa_date ? parseISO(form.halaqa_date) : undefined}
              onSelect={onPickDate}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {form.halaqa_day !== null && (
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/15 text-gold-foreground text-[11px] font-semibold border border-gold/30">
            {t("a.halaqas.day")} {t(JS_DAY_KEYS[form.halaqa_day])}
          </div>
        )}
      </div>

      {/* Times */}
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.start_time_label")}</label>
        <input
          required
          type="time"
          value={form.start_time ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
          className={cn(inputCls, "mt-1")}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.end_time_label")}</label>
        <input
          required
          type="time"
          value={form.end_time ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
          className={cn(inputCls, "mt-1")}
        />
      </div>

      {/* Meeting */}
      <div className="lg:col-span-3 grid gap-3 md:grid-cols-[1fr_auto]">
        <div>
          <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.meeting_link_label")}</label>
          <input
            required
            value={form.meeting_link ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))}
            placeholder="https://meet.google.com/abc-defg-hij"
            className={cn(inputCls, "mt-1")}
            inputMode="url"
          />
        </div>
        <div className="flex items-end">
          <a
            href="https://meet.google.com/new"
            target="_blank"
            rel="noreferrer"
            className="min-h-11 px-4 rounded-xl bg-muted text-xs font-semibold whitespace-nowrap flex items-center"
          >
            {t("a.halaqas.new_link")}
          </a>
        </div>
      </div>

      {/* Weekdays */}
      <div className="lg:col-span-3">
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.weekdays_label")}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => toggleDay(d)}
              className={cn(
                "min-h-10 px-3 py-1 rounded-full text-xs font-semibold transition",
                form.schedule_days?.includes(d)
                  ? "bg-gradient-royal text-primary-foreground shadow-glow"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {t(DAY_LABEL_KEYS[d])}
            </button>
          ))}
        </div>
      </div>

      {/* Students multi-select */}
      <StudentMultiSelect
        students={students ?? []}
        selected={form.selectedStudentIds}
        onChange={(ids) => setForm((f) => ({ ...f, selectedStudentIds: ids }))}
      />

      {/* Description */}
      <textarea
        placeholder={t("common.description")}
        value={form.description ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        className={cn(inputCls, "lg:col-span-3")}
        rows={2}
      />

      {/* Status segmented */}
      <div className="lg:col-span-3">
        <label className="text-xs font-semibold text-primary/80">{t("a.halaqas.status_field")}</label>
        <div className="mt-2 grid grid-cols-2 gap-2 max-w-sm">
          {(
            [
              { v: "draft" as const, label: t("a.halaqas.draft") },
              { v: "published" as const, label: t("a.halaqas.published") },
            ]
          ).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: opt.v }))}
              className={cn(
                "min-h-12 px-4 py-2 rounded-xl text-sm font-semibold border transition",
                form.status === opt.v
                  ? "bg-gradient-royal text-primary-foreground border-transparent shadow-glow"
                  : "bg-background text-muted-foreground border-input hover:border-primary/40",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {form.status === "draft" && (
          <p className="mt-2 text-[11px] text-muted-foreground">{t("a.halaqas.draft_hint")}</p>
        )}
      </div>

      {/* Actions */}
      <div className="lg:col-span-3 flex flex-wrap gap-2 pt-2 border-t border-border">
        <button
          disabled={save.isPending}
          className="min-h-11 px-5 py-2 rounded-xl bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60 shadow-glow"
        >
          {t("common.save")}
        </button>
        <button type="button" onClick={onClose} className="min-h-11 px-5 py-2 rounded-xl bg-muted">
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// Student searchable multi-select grouped by level
// ─────────────────────────────────────────────────────────────────
function StudentMultiSelect({
  students,
  selected,
  onChange,
}: {
  students: { id: string; full_name: string; quran_level: string | null }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ beginner: true, intermediate: true, advanced: true });

  const groups: { key: string; label: string; icon: string; list: typeof students }[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: { full_name: string }) => !q || s.full_name.toLowerCase().includes(q);
    return [
      { key: "beginner", label: t("a.halaqas.level.beginner"), icon: "📗", list: students.filter((s) => (s.quran_level ?? "beginner") === "beginner" && match(s)) },
      { key: "intermediate", label: t("a.halaqas.level.intermediate"), icon: "📘", list: students.filter((s) => s.quran_level === "intermediate" && match(s)) },
      { key: "advanced", label: t("a.halaqas.level.advanced"), icon: "📕", list: students.filter((s) => s.quran_level === "advanced" && match(s)) },
    ];
  }, [students, query]);

  const allVisible = groups.flatMap((g) => g.list.map((s) => s.id));
  const allSelected = allVisible.length > 0 && allVisible.every((id) => selected.includes(id));

  const toggleOne = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  const selectAll = () => onChange(Array.from(new Set([...selected, ...allVisible])));
  const clearAll = () => onChange(selected.filter((id) => !allVisible.includes(id)));

  return (
    <div className="lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-primary/80">
          {t("a.halaqas.students_label")} <span className="text-muted-foreground">{t("a.halaqas.selected_count", { count: selected.length })}</span>
        </label>
        <div className="flex gap-1">
          <button type="button" onClick={selectAll} className="min-h-9 px-3 py-1 rounded-full text-[11px] bg-primary/10 text-primary font-semibold">{t("a.halaqas.select_all")}</button>
          <button type="button" onClick={clearAll} className="min-h-9 px-3 py-1 rounded-full text-[11px] bg-muted text-muted-foreground font-semibold">{t("a.halaqas.clear_all")}</button>
        </div>
      </div>

      <div className="mt-2 relative">
        <Search className="absolute inset-y-0 my-auto ms-3 h-4 w-4 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("a.halaqas.search_student")}
          className={cn(inputCls, "ps-9")}
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {groups.map((g) => (
          <div key={g.key} className="rounded-xl border border-border bg-background/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenSections((s) => ({ ...s, [g.key]: !s[g.key] }))}
              className="w-full min-h-11 px-3 py-2 flex items-center justify-between text-xs font-semibold bg-muted/40"
            >
              <span>{g.icon} {g.label} <span className="text-muted-foreground">({g.list.length})</span></span>
              {openSections[g.key] ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
            </button>
            {openSections[g.key] && (
              <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                {g.list.map((s) => {
                  const sel = selected.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleOne(s.id)}
                      className={cn(
                        "w-full min-h-10 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition",
                        sel ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted",
                      )}
                    >
                      <span className="truncate">{s.full_name}</span>
                      {sel ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span className="opacity-0"><Check className="h-3.5 w-3.5" /></span>}
                    </button>
                  );
                })}
                {g.list.length === 0 && <div className="text-[11px] text-muted-foreground text-center py-3">—</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      {allSelected && <p className="mt-1 text-[10px] text-muted-foreground">{t("a.halaqas.all_matched_selected")}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Small assigned-students preview under each card
// ─────────────────────────────────────────────────────────────────
function HalaqaStudents({ halaqa }: { halaqa: Halaqa }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const { data: assigned } = useQuery({
    queryKey: ["halaqa-students-admin", halaqa.id],
    enabled: open,
    queryFn: async () => {
      const data = await selectOrThrow<Array<{ student: { id: string; full_name: string } }>>(
        "admin-halaqa-students",
        "student_halaqas",
        "student:profiles(id, full_name)",
        supabase.from("student_halaqas").select("student:profiles(id, full_name)").eq("halaqa_id", halaqa.id),
        `where halaqa_id = ${halaqa.id}`,
      );
      return (data ?? []).map((r: { student: { id: string; full_name: string } }) => r.student);
    },
  });

  return (
    <div className="pt-2 border-t border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="min-h-9 w-full flex items-center justify-between px-3 py-1 rounded-lg text-[11px] font-semibold text-muted-foreground hover:bg-muted"
      >
        <span className="flex items-center gap-1.5"><Users2 className="h-3.5 w-3.5" aria-hidden /> {t("common.students")}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
      </button>
      {open && (
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
          {assigned?.map((s) => (
            <div key={s.id} className="px-3 py-1.5 rounded-lg bg-muted/40 text-xs">{s.full_name}</div>
          ))}
          {(!assigned || assigned.length === 0) && <div className="text-[11px] text-muted-foreground text-center py-2">—</div>}
        </div>
      )}
    </div>
  );
}

export default HalaqasPanel;
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const input = "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm";

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
  status: "active" | "archived" | "inactive";
  teacher?: { full_name: string } | null;
  supervisor?: { full_name: string } | null;
};

type FormState = Omit<Halaqa, "id" | "teacher" | "supervisor">;

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
  status: "active",
});

export function HalaqasPanel() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Halaqa | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: halaqas } = useQuery({
    queryKey: ["admin-halaqas"],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas")
        .select("*, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      return (data ?? []) as Halaqa[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("halaqas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-halaqas"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Halaqa["status"] }) => {
      const { error } = await supabase.from("halaqas").update({ status }).eq("id", id); if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-halaqas"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">{t("dir.halaqas")} <span className="text-sm text-muted-foreground">({halaqas?.length ?? 0})</span></h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-sm font-semibold">+ {t("dir.new_halaqa")}</button>
      </div>

      {showForm && <HalaqaForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}

      <div className="space-y-3">
        {halaqas?.map((h) => (
          <div key={h.id} className="p-5 rounded-2xl bg-card border border-border shadow-soft">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <div className="text-lg font-bold text-primary">{h.name}</div>
                <div className="text-xs text-muted-foreground">{h.level} · {h.gender} · {h.teacher?.full_name ?? "—"} / {h.supervisor?.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {h.schedule_days?.join(", ") || h.schedule || "—"} {h.start_time && `· ${h.start_time}–${h.end_time ?? "?"}`} {h.max_students && `· max ${h.max_students}`}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={h.status} onChange={(e) => setStatus.mutate({ id: h.id, status: e.target.value as Halaqa["status"] })} className="px-2 py-1 rounded-lg border border-input bg-background text-xs">
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="archived">archived</option>
                </select>
                <button onClick={() => { setEditing(h); setShowForm(true); }} className="px-3 py-1 rounded-full text-xs bg-muted">{t("common.edit")}</button>
                <button onClick={() => { if (confirm("Delete?")) del.mutate(h.id); }} className="px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive">{t("common.delete")}</button>
              </div>
            </div>
            <HalaqaStudents halaqa={h} />
          </div>
        ))}
        {(!halaqas || halaqas.length === 0) && <div className="p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>}
      </div>
    </div>
  );
}

function HalaqaForm({ initial, onClose }: { initial: Halaqa | null; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(initial ? {
    name: initial.name, description: initial.description ?? "", gender: initial.gender, level: initial.level,
    teacher_id: initial.teacher_id, supervisor_id: initial.supervisor_id, schedule: initial.schedule ?? "",
    schedule_days: initial.schedule_days ?? [], start_time: initial.start_time ?? "", end_time: initial.end_time ?? "",
    meeting_provider: initial.meeting_provider ?? "google_meet", meeting_link: initial.meeting_link ?? "",
    max_students: initial.max_students, status: initial.status,
  } : empty());

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

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        description: form.description || null,
        schedule: form.schedule || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        meeting_link: form.meeting_link || null,
        schedule_days: form.schedule_days?.length ? form.schedule_days : null,
        max_students: form.max_students || null,
      };
      if (initial) {
        const { error } = await supabase.from("halaqas").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("halaqas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-halaqas"] }); toast.success("✓"); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredTeachers = (teachers ?? []).filter((u) => !u.gender || u.gender === form.gender);
  const filteredSupervisors = (supervisors ?? []).filter((u) => !u.gender || u.gender === form.gender);

  const toggleDay = (d: string) => setForm((f) => ({ ...f, schedule_days: f.schedule_days?.includes(d) ? f.schedule_days.filter((x) => x !== d) : [...(f.schedule_days ?? []), d] }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="p-6 rounded-2xl bg-card border-2 border-primary/30 shadow-soft grid md:grid-cols-3 gap-3">
      <input required placeholder={t("common.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={input} />
      <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as FormState["gender"] }))} className={input}>
        <option value="male">{t("auth.male")}</option><option value="female">{t("auth.female")}</option>
      </select>
      <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as FormState["level"] }))} className={input}>
        <option value="beginner">{t("auth.level.beginner")}</option><option value="intermediate">{t("auth.level.intermediate")}</option><option value="advanced">{t("auth.level.advanced")}</option>
      </select>
      <select value={form.teacher_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value || null }))} className={input}>
        <option value="">— {t("common.teacher")} —</option>
        {filteredTeachers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
      </select>
      <select value={form.supervisor_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, supervisor_id: e.target.value || null }))} className={input}>
        <option value="">— {t("common.supervisor")} —</option>
        {filteredSupervisors.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
      </select>
      <input type="number" min={1} placeholder="Max students" value={form.max_students ?? ""} onChange={(e) => setForm((f) => ({ ...f, max_students: e.target.value ? Number(e.target.value) : null }))} className={input} />
      <input type="time" placeholder="Start" value={form.start_time ?? ""} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className={input} />
      <input type="time" placeholder="End" value={form.end_time ?? ""} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className={input} />
      <select value={form.meeting_provider ?? "google_meet"} onChange={(e) => setForm((f) => ({ ...f, meeting_provider: e.target.value }))} className={input}>
        <option value="google_meet">Google Meet</option>
        <option value="zoom">Zoom (coming soon)</option>
        <option value="jitsi">Jitsi</option>
        <option value="other">Other</option>
      </select>
      <div className="md:col-span-2 flex gap-2">
        <input placeholder="Meeting URL (e.g. https://meet.google.com/abc-defg-hij)" value={form.meeting_link ?? ""} onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))} className={input + " flex-1"} />
        {form.meeting_provider === "google_meet" && (
          <a href="https://meet.google.com/new" target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl bg-muted text-xs font-semibold whitespace-nowrap flex items-center">
            + New Meet
          </a>
        )}
      </div>
      <textarea placeholder={t("common.description")} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={input + " md:col-span-3"} rows={2} />
      <div className="md:col-span-3 flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button type="button" key={d} onClick={() => toggleDay(d)}
            className={`px-3 py-1 rounded-full text-xs ${form.schedule_days?.includes(d) ? "bg-gradient-royal text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {d}
          </button>
        ))}
      </div>
      <div className="md:col-span-3 flex gap-2">
        <button disabled={save.isPending} className="px-5 py-2 rounded-xl bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">{t("common.save")}</button>
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-muted">{t("common.cancel")}</button>
      </div>
    </form>
  );
}

function HalaqaStudents({ halaqa }: { halaqa: Halaqa }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const { data: assigned } = useQuery({
    queryKey: ["halaqa-students-admin", halaqa.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student:profiles(id, full_name, gender)").eq("halaqa_id", halaqa.id);
      return (data ?? []).map((r: { student: { id: string; full_name: string; gender: string | null } }) => r.student);
    },
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidate-students", halaqa.gender],
    enabled: open,
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as { id: string; full_name: string }[];
      const { data } = await supabase.from("profiles").select("id, full_name, gender, status").in("id", ids).eq("gender", halaqa.gender).eq("status", "approved");
      return (data ?? []) as { id: string; full_name: string }[];
    },
  });

  const add = useMutation({
    mutationFn: async (sid: string) => { const { error } = await supabase.from("student_halaqas").insert({ student_id: sid, halaqa_id: halaqa.id }); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["halaqa-students-admin", halaqa.id] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (sid: string) => { const { error } = await supabase.from("student_halaqas").delete().eq("student_id", sid).eq("halaqa_id", halaqa.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["halaqa-students-admin", halaqa.id] }),
  });

  const assignedIds = new Set((assigned ?? []).map((s) => s.id));
  const available = (candidates ?? []).filter((c) => !assignedIds.has(c.id));

  return (
    <div className="mt-3">
      <button onClick={() => setOpen((o) => !o)} className="px-3 py-1 rounded-full text-xs bg-muted">{open ? "↑" : "↓"} {t("common.students")}</button>
      {open && (
        <div className="mt-3 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">{t("common.students")} ({assigned?.length ?? 0})</div>
            <div className="space-y-1">
              {assigned?.map((s) => (
                <div key={s.id} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-muted/40 text-sm">
                  <span>{s.full_name}</span>
                  <button onClick={() => remove.mutate(s.id)} className="text-xs text-destructive">✕</button>
                </div>
              ))}
              {(!assigned || assigned.length === 0) && <div className="text-xs text-muted-foreground">—</div>}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">+ Add</div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {available.map((s) => (
                <button key={s.id} onClick={() => add.mutate(s.id)} className="w-full text-start px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted text-sm">+ {s.full_name}</button>
              ))}
              {available.length === 0 && <div className="text-xs text-muted-foreground">—</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
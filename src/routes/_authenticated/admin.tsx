import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

const ROLES: AppRole[] = ["student", "teacher", "halaqa_supervisor", "general_supervisor", "director"];

function AdminPage() {
  const { primaryRole, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"users" | "halaqas">("users");

  useEffect(() => {
    if (!loading && primaryRole !== "director") void navigate({ to: "/dashboard" });
  }, [loading, primaryRole, navigate]);

  if (primaryRole !== "director") return null;

  return (
    <DashboardShell>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <h1 className="text-3xl font-bold text-primary">{t("nav.admin")}</h1>
        <div className="flex gap-1 p-1 bg-muted rounded-full text-sm">
          <button onClick={() => setTab("users")} className={`px-4 py-1.5 rounded-full ${tab === "users" ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>{t("dir.users")}</button>
          <button onClick={() => setTab("halaqas")} className={`px-4 py-1.5 rounded-full ${tab === "halaqas" ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>{t("dir.halaqas")}</button>
        </div>
      </div>
      {tab === "users" ? <UsersPanel /> : <HalaqasPanel />}
    </DashboardShell>
  );
}

function UsersPanel() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const byUser: Record<string, AppRole[]> = {};
      (roles ?? []).forEach((r: any) => { (byUser[r.user_id] ??= []).push(r.role); });
      return (data ?? []).map((u: any) => ({ ...u, roles: byUser[u.id] ?? [] }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // Replace roles atomically: delete all then insert new
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (insErr) throw insErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("✓"); },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending_review" | "approved" | "rejected" | "suspended" }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("✓"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs">
          <tr><th className="p-3 text-start">{t("common.name")}</th><th className="p-3 text-start">{t("auth.email")}</th><th className="p-3 text-start">{t("auth.gender")}</th><th className="p-3 text-start">{t("common.status")}</th><th className="p-3 text-start">{t("dir.role")}</th></tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-primary">{u.full_name || "—"}</td>
              <td className="p-3 text-xs">{u.email}</td>
              <td className="p-3 text-xs">{u.gender ?? "—"}</td>
              <td className="p-3">
                <select value={u.status} onChange={(e) => setStatus.mutate({ id: u.id, status: e.target.value as any })} className="px-2 py-1 rounded-lg border border-input bg-background text-xs">
                  <option value="pending_review">pending_review</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="suspended">suspended</option>
                </select>
              </td>
              <td className="p-3">
                <select value={u.roles[0] ?? "student"} onChange={(e) => setRole.mutate({ userId: u.id, role: e.target.value as AppRole })} className="px-2 py-1 rounded-lg border border-input bg-background text-xs">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HalaqasPanel() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", gender: "male", level: "beginner", schedule: "", meeting_link: "", teacher_id: "", supervisor_id: "" });

  const { data: halaqas } = useQuery({
    queryKey: ["admin-halaqas"],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("*, teacher:profiles!halaqas_teacher_id_fkey(full_name), supervisor:profiles!halaqas_supervisor_id_fkey(full_name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, gender").in("id", ids);
      return data ?? [];
    },
  });
  const { data: supervisors } = useQuery({
    queryKey: ["admin-supervisors"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "halaqa_supervisor");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, gender").in("id", ids);
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload: any = { name: form.name, gender: form.gender, level: form.level, schedule: form.schedule || null, meeting_link: form.meeting_link || null };
      if (form.teacher_id) payload.teacher_id = form.teacher_id;
      if (form.supervisor_id) payload.supervisor_id = form.supervisor_id;
      const { error } = await supabase.from("halaqas").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-halaqas"] }); toast.success("✓"); setForm({ name: "", gender: "male", level: "beginner", schedule: "", meeting_link: "", teacher_id: "", supervisor_id: "" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredTeachers = (teachers ?? []).filter((u: any) => !u.gender || u.gender === form.gender);
  const filteredSupervisors = (supervisors ?? []).filter((u: any) => !u.gender || u.gender === form.gender);

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="p-6 rounded-2xl bg-card border border-border shadow-soft grid md:grid-cols-3 gap-3">
        <input required placeholder={t("common.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={input} />
        <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className={input}>
          <option value="male">{t("auth.male")}</option><option value="female">{t("auth.female")}</option>
        </select>
        <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={input}>
          <option value="beginner">{t("auth.level.beginner")}</option><option value="intermediate">{t("auth.level.intermediate")}</option><option value="advanced">{t("auth.level.advanced")}</option>
        </select>
        <select value={form.teacher_id} onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))} className={input}>
          <option value="">— {t("common.teacher")} —</option>
          {filteredTeachers.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
        <select value={form.supervisor_id} onChange={(e) => setForm((f) => ({ ...f, supervisor_id: e.target.value }))} className={input}>
          <option value="">— {t("common.supervisor")} —</option>
          {filteredSupervisors.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
        <input placeholder={t("auth.schedule")} value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} className={input} />
        <input placeholder="Meeting link (Google Meet)" value={form.meeting_link} onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))} className={input + " md:col-span-2"} />
        <button disabled={create.isPending} className="px-5 py-2 rounded-xl bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">+ {t("dir.new_halaqa")}</button>
      </form>

      <div className="space-y-3">
        {halaqas?.map((h: any) => <HalaqaRow key={h.id} h={h} />)}
      </div>
    </div>
  );
}

function HalaqaRow({ h }: { h: any }) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const { data: assigned } = useQuery({
    queryKey: ["halaqa-students-admin", h.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("student_halaqas").select("student:profiles(id, full_name, gender)").eq("halaqa_id", h.id);
      return (data ?? []).map((r: any) => r.student);
    },
  });

  const { data: candidates } = useQuery({
    queryKey: ["candidate-students", h.gender],
    enabled: open,
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name, gender, status").in("id", ids).eq("gender", h.gender).eq("status", "approved");
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (sid: string) => { const { error } = await supabase.from("student_halaqas").insert({ student_id: sid, halaqa_id: h.id }); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["halaqa-students-admin", h.id] }); toast.success("✓"); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (sid: string) => { const { error } = await supabase.from("student_halaqas").delete().eq("student_id", sid).eq("halaqa_id", h.id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["halaqa-students-admin", h.id] }),
  });

  const assignedIds = new Set((assigned ?? []).map((s: any) => s.id));
  const available = (candidates ?? []).filter((c: any) => !assignedIds.has(c.id));

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-soft">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div className="text-lg font-bold text-primary">{h.name}</div>
          <div className="text-xs text-muted-foreground">{h.level} · {h.gender} · {h.teacher?.full_name ?? "—"} / {h.supervisor?.full_name ?? "—"}</div>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="px-3 py-1.5 rounded-full text-xs bg-muted hover:bg-muted/70">{open ? "↑" : "↓"} {t("common.students")}</button>
      </div>
      {open && (
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">{t("common.students")} ({assigned?.length ?? 0})</div>
            <div className="space-y-1">
              {assigned?.map((s: any) => (
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
              {available.map((s: any) => (
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

const input = "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm";
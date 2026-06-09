import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";

const ROLES: AppRole[] = ["student", "teacher", "halaqa_supervisor", "general_supervisor", "director", "parent"];

export function UsersPanel() {
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const byUser: Record<string, AppRole[]> = {};
      (roles ?? []).forEach((r: { user_id: string; role: AppRole }) => { (byUser[r.user_id] ??= []).push(r.role); });
      type Row = { id: string; full_name: string | null; email: string | null; gender: string | null; status: string; roles: AppRole[] };
      return (data ?? []).map((u): Row => ({
        id: u.id, full_name: u.full_name, email: u.email, gender: u.gender, status: u.status,
        roles: byUser[u.id] ?? [],
      }));
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (insErr) throw insErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending_review" | "approved" | "rejected" | "suspended" }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
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
                <select value={u.status} onChange={(e) => setStatus.mutate({ id: u.id, status: e.target.value as "pending_review" | "approved" | "rejected" | "suspended" })} className="px-2 py-1 rounded-lg border border-input bg-background text-xs">
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { deleteUserAccount } from "@/lib/admin-users.functions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ROLES: AppRole[] = ["student", "teacher", "halaqa_supervisor", "general_supervisor", "director", "parent"];

export function UsersPanel() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const { user, hasRole } = useAuth();
  const canDelete = hasRole("director");
  const deleteFn = useServerFn(deleteUserAccount);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await deleteFn({ data: { userId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(t("admin.users.delete.success"));
      setPendingDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground text-xs">
          <tr><th className="p-3 text-start">{t("common.name")}</th><th className="p-3 text-start">{t("auth.email")}</th><th className="p-3 text-start">{t("auth.gender")}</th><th className="p-3 text-start">{t("common.status")}</th><th className="p-3 text-start">{t("dir.role")}</th><th className="p-3 text-start">{t("admin.users.actions")}</th></tr>
        </thead>
        <tbody>
          {users?.map((u) => (
            <tr key={u.id} className="border-t border-border align-top">
              <td className="p-3 font-semibold text-primary">{u.full_name || "—"}</td>
              <td className="p-3 text-xs">{u.email}</td>
              <td className="p-3 text-xs">{u.gender ?? "—"}</td>
              <td className="p-3">
                <select aria-label={`Status for ${u.full_name ?? u.email}`} value={u.status} onChange={(e) => setStatus.mutate({ id: u.id, status: e.target.value as "pending_review" | "approved" | "rejected" | "suspended" })} className="px-2 py-1.5 min-h-9 rounded-lg border border-input bg-background text-xs">
                  <option value="pending_review">pending_review</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                  <option value="suspended">suspended</option>
                </select>
              </td>
              <td className="p-3">
                <select aria-label={`Role for ${u.full_name ?? u.email}`} value={u.roles[0] ?? "student"} onChange={(e) => setRole.mutate({ userId: u.id, role: e.target.value as AppRole })} className="px-2 py-1.5 min-h-9 rounded-lg border border-input bg-background text-xs">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </td>
              <td className="p-3">
                <button
                  type="button"
                  disabled={!canDelete || u.id === user?.id}
                  onClick={() => setPendingDelete({ id: u.id, name: u.full_name || u.email || "" })}
                  aria-label={t("admin.users.delete.button")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-9 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("admin.users.delete.button")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">{t("admin.users.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.delete.message")}
              {pendingDelete?.name ? <><br /><span className="font-semibold text-foreground">{pendingDelete.name}</span></> : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t("admin.users.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
              }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending ? "…" : t("admin.users.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type Profile = { id: string; full_name: string | null; email: string | null };
type Link = { id: string; parent_user_id: string; student_user_id: string; parent: Profile; student: Profile };

export function ParentLinksPanel() {
  const qc = useQueryClient();
  const [parentId, setParentId] = useState("");
  const [studentId, setStudentId] = useState("");

  const { data: parents } = useQuery({
    queryKey: ["admin-parents"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "parent");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as Profile[];
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (data ?? []) as Profile[];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["admin-students-for-links"],
    queryFn: async () => {
      const { data: rs } = await supabase.from("user_roles").select("user_id").eq("role", "student");
      const ids = (rs ?? []).map((r) => r.user_id);
      if (!ids.length) return [] as Profile[];
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (data ?? []) as Profile[];
    },
  });

  const { data: links } = useQuery({
    queryKey: ["admin-parent-links"],
    queryFn: async () => {
      const { data } = await supabase
        .from("parent_links")
        .select(
          "id, parent_user_id, student_user_id, parent:profiles!parent_links_parent_user_id_fkey(id, full_name, email), student:profiles!parent_links_student_user_id_fkey(id, full_name, email)"
        )
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Link[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!parentId || !studentId) throw new Error("Choose parent and student");
      const { error } = await supabase.from("parent_links").insert({ parent_user_id: parentId, student_user_id: studentId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Linked");
      setParentId("");
      setStudentId("");
      qc.invalidateQueries({ queryKey: ["admin-parent-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parent_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["admin-parent-links"] });
    },
  });

  const input = "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary">Parent ↔ Student Links</h2>

      <div className="p-5 rounded-2xl bg-card border border-border shadow-soft grid md:grid-cols-3 gap-3">
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={input}>
          <option value="">— Parent —</option>
          {parents?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name} {p.email ? `(${p.email})` : ""}
            </option>
          ))}
        </select>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={input}>
          <option value="">— Student —</option>
          {students?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} {s.email ? `(${s.email})` : ""}
            </option>
          ))}
        </select>
        <button
          onClick={() => create.mutate()}
          disabled={create.isPending}
          className="px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-sm font-semibold"
        >
          + Link
        </button>
        {(!parents || parents.length === 0) && (
          <div className="md:col-span-3 text-xs text-muted-foreground">
            No users with role <span className="font-mono">parent</span> yet. Assign the parent role from the Users tab first.
          </div>
        )}
      </div>

      <div className="space-y-2">
        {links?.map((l) => (
          <div key={l.id} className="flex justify-between items-center p-4 rounded-xl bg-card border border-border">
            <div className="text-sm">
              <span className="font-semibold text-primary">{l.parent?.full_name ?? "?"}</span>
              <span className="mx-2 text-muted-foreground">→</span>
              <span className="font-semibold">{l.student?.full_name ?? "?"}</span>
            </div>
            <button onClick={() => remove.mutate(l.id)} className="text-xs text-destructive hover:underline">
              Remove
            </button>
          </div>
        ))}
        {(!links || links.length === 0) && (
          <div className="p-10 text-center text-muted-foreground border border-dashed rounded-2xl">
            No parent links yet.
          </div>
        )}
      </div>
    </div>
  );
}
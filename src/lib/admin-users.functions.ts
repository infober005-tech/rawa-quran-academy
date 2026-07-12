import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ userId: z.string().uuid() });

/**
 * Permanently delete a user account and all owned records.
 * Only directors can call this. Directors cannot delete themselves
 * or the last remaining director.
 */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }) => {
    const { userId: callerId } = context;
    const targetId = data.userId;

    if (callerId === targetId) {
      throw new Error("You cannot delete your own account.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Caller must be a director
    const { data: callerRoles, error: callerErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    if (callerErr) throw new Error(callerErr.message);
    const isDirector = (callerRoles ?? []).some((r) => r.role === "director");
    if (!isDirector) throw new Error("Only directors can delete accounts.");

    // Guard: don't delete the last remaining director
    const { data: targetRoles, error: tErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetId);
    if (tErr) throw new Error(tErr.message);
    const targetIsDirector = (targetRoles ?? []).some((r) => r.role === "director");
    if (targetIsDirector) {
      const { count, error: cErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "director");
      if (cErr) throw new Error(cErr.message);
      if ((count ?? 0) <= 1) {
        throw new Error("Cannot delete the last remaining director.");
      }
    }

    // Best-effort cleanup of owned/related records. Auth cascades cover most,
    // but we clear these explicitly to satisfy the requirement.
    const eqUser = async (table: string, col: string) => {
      // deno-lint-ignore no-explicit-any
      await (supabaseAdmin.from(table as never) as any).delete().eq(col, targetId);
    };

    await eqUser("notifications", "user_id");
    await eqUser("attendance", "student_id");
    await eqUser("evaluations", "student_id");
    await eqUser("event_registrations", "user_id");
    await eqUser("student_halaqas", "student_id");
    await eqUser("parent_links", "parent_user_id");
    await eqUser("parent_links", "student_user_id");
    await eqUser("subscriptions", "student_id");
    await eqUser("payments", "student_id");
    await eqUser("assignment_submissions", "student_id");
    await eqUser("supervisor_notes", "student_id");
    await eqUser("conversation_members", "user_id");
    await eqUser("messages", "sender_id");
    await eqUser("user_roles", "user_id");
    await eqUser("profiles", "id");

    // Finally, remove the auth user (service role only, server side).
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true };
  });
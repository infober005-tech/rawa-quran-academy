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

    const formatError = (error: unknown) => {
      if (!error) return "Unknown database error";
      if (error instanceof Error) return error.message;
      if (typeof error === "string") return error;
      if (typeof error === "object") {
        const details = error as { message?: string; code?: string; details?: string; hint?: string; name?: string };
        return [details.code, details.name, details.message, details.details, details.hint]
          .filter(Boolean)
          .join(" | ") || JSON.stringify(error);
      }
      return String(error);
    };

    const fail = (statement: string, error: unknown) => {
      const message = formatError(error);
      console.error(`[deleteUserAccount] ${statement} failed:`, error);
      return { success: false, error: `${statement}: ${message}` };
    };

    if (callerId === targetId) {
      return { success: false, error: "You cannot delete your own account." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Caller must be a director
    const { data: callerRoles, error: callerErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    if (callerErr) return fail("select user_roles for caller", callerErr);
    const isDirector = (callerRoles ?? []).some((r) => r.role === "director");
    if (!isDirector) return { success: false, error: "Only directors can delete accounts." };

    // Guard: don't delete the last remaining director
    const { data: targetRoles, error: tErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", targetId);
    if (tErr) return fail("select user_roles for target", tErr);
    const targetIsDirector = (targetRoles ?? []).some((r) => r.role === "director");
    if (targetIsDirector) {
      const { count, error: cErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "director");
      if (cErr) return fail("count director user_roles", cErr);
      if ((count ?? 0) <= 1) {
        return { success: false, error: "Cannot delete the last remaining director." };
      }
    }

    const deleteWhere = async (table: string, col: string) => {
      // deno-lint-ignore no-explicit-any
      const { error } = await (supabaseAdmin.from(table as never) as any).delete().eq(col, targetId);
      if (error) return fail(`delete from ${table} where ${col} = ${targetId}`, error);
      return null;
    };

    const clearReference = async (table: string, values: Record<string, null>, col: string) => {
      // deno-lint-ignore no-explicit-any
      const { error } = await (supabaseAdmin.from(table as never) as any).update(values).eq(col, targetId);
      if (error) return fail(`update ${table} set ${Object.keys(values).join(", ")} = null where ${col} = ${targetId}`, error);
      return null;
    };

    // Clear non-cascading references to auth.users before the final auth delete.
    // payments.reviewed_by has no ON DELETE action, so a director who reviewed
    // any payment would otherwise make auth.admin.deleteUser fail generically.
    let result = await clearReference("payments", { reviewed_by: null }, "reviewed_by");
    if (result) return result;

    // Delete in the requested FK-safe order using the service-role client only.
    result = await deleteWhere("notifications", "user_id");
    if (result) return result;
    result = await deleteWhere("attendance", "student_id");
    if (result) return result;
    result = await deleteWhere("evaluations", "student_id");
    if (result) return result;
    result = await deleteWhere("assignment_submissions", "student_id");
    if (result) return result;
    result = await deleteWhere("student_halaqas", "student_id");
    if (result) return result;
    result = await deleteWhere("parent_links", "parent_user_id");
    if (result) return result;
    result = await deleteWhere("parent_links", "student_user_id");
    if (result) return result;
    result = await deleteWhere("payments", "student_id");
    if (result) return result;
    result = await deleteWhere("subscriptions", "student_id");
    if (result) return result;
    result = await deleteWhere("user_roles", "user_id");
    if (result) return result;
    result = await deleteWhere("profiles", "id");
    if (result) return result;

    // Finally, remove the auth user (service role only, server side).
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (delErr) return fail(`supabase.auth.admin.deleteUser(${targetId})`, delErr);

    return { success: true };
  });
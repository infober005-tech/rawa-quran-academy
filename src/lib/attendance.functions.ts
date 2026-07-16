import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";

const StartInput = z.object({ halaqaId: z.string().uuid() });
const EndInput = z.object({ sessionId: z.string().uuid() });
const CheckinInput = z.object({
  token: z.string().min(16).max(128),
  device: z
    .object({
      userAgent: z.string().max(512).optional(),
      platform: z.string().max(128).optional(),
      language: z.string().max(32).optional(),
      screen: z.string().max(64).optional(),
      timezone: z.string().max(64).optional(),
      vendor: z.string().max(128).optional(),
    })
    .partial()
    .optional(),
  location: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    })
    .optional(),
});

const UpdateStatusInput = z.object({
  attendanceId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  halaqaId: z.string().uuid().optional(),
  date: z.string().optional(),
  status: z.enum(["present", "late", "absent"]),
  notes: z.string().max(500).optional(),
});

/** Teacher starts a QR attendance session (5-minute expiry). */
export const startAttendanceSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => StartInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: halaqa, error: hErr } = await supabase
      .from("halaqas")
      .select("id, teacher_id")
      .eq("id", data.halaqaId)
      .maybeSingle();
    if (hErr) throw new Error(hErr.message);
    if (!halaqa || halaqa.teacher_id !== userId) {
      throw new Error("Only the assigned teacher can start attendance for this halaqa.");
    }

    // Deactivate any prior active sessions for this halaqa by this teacher
    await supabase
      .from("attendance_sessions")
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq("halaqa_id", data.halaqaId)
      .eq("teacher_id", userId)
      .eq("active", true);

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data: session, error } = await supabase
      .from("attendance_sessions")
      .insert({
        halaqa_id: data.halaqaId,
        teacher_id: userId,
        token,
        active: true,
        expires_at: expiresAt,
      })
      .select("id, token, expires_at, halaqa_id")
      .single();
    if (error) throw new Error(error.message);
    return session;
  });

/** Teacher ends an attendance session. */
export const endAttendanceSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EndInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("attendance_sessions")
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("teacher_id", userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

/**
 * Student check-in via scanned QR token. Server verifies:
 * - token exists, session active, not expired
 * - student belongs to the session's halaqa
 * - no duplicate attendance for today
 */
export const checkInAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckinInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: session, error: sErr } = await supabase
      .from("attendance_sessions")
      .select("id, halaqa_id, teacher_id, active, expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!session) throw new Error("Invalid QR code.");
    if (!session.active) throw new Error("This attendance session has ended.");
    if (new Date(session.expires_at).getTime() < Date.now()) {
      throw new Error("This QR code has expired.");
    }

    const { data: membership, error: mErr } = await supabase
      .from("student_halaqas")
      .select("student_id")
      .eq("halaqa_id", session.halaqa_id)
      .eq("student_id", userId)
      .maybeSingle();
    if (mErr) throw new Error(mErr.message);
    if (!membership) throw new Error("You are not enrolled in this halaqa.");

    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("halaqa_id", session.halaqa_id)
      .eq("student_id", userId)
      .eq("date", today)
      .maybeSingle();
    if (existing) {
      return { success: true, alreadyMarked: true };
    }

    // Best-effort request metadata
    let ua = data.device?.userAgent ?? null;
    let ip: string | null = null;
    try {
      ua = ua || getRequestHeader("user-agent") || null;
      ip = getRequestIP({ xForwardedFor: true }) || null;
    } catch {
      // outside request scope
    }

    // Insert with service role: student self-insert is not allowed by RLS,
    // but the server has fully verified the token, session, and membership.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insErr } = await supabaseAdmin.from("attendance").insert({
      halaqa_id: session.halaqa_id,
      student_id: userId,
      status: "present",
      date: today,
      session_id: session.id,
      recorded_by: userId,
      checked_in_at: new Date().toISOString(),
      device_info: data.device ?? null,
      user_agent: ua,
      ip_address: ip,
      latitude: data.location?.latitude ?? null,
      longitude: data.location?.longitude ?? null,
      is_manual: false,
    } as never);
    if (insErr) throw new Error(insErr.message);

    return { success: true, alreadyMarked: false };
  });

/** Manual attendance correction / creation by authorized roles.
 *  RLS restricts updates/inserts to teachers-of-halaqa, supervisors, or director. */
export const upsertAttendanceRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateStatusInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.attendanceId) {
      const { error } = await supabase
        .from("attendance")
        .update({
          status: data.status,
          notes: data.notes ?? null,
          is_manual: true,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", data.attendanceId);
      if (error) throw new Error(error.message);
      return { success: true };
    }
    if (!data.studentId || !data.halaqaId) {
      throw new Error("studentId and halaqaId are required to create a record.");
    }
    const date = data.date ?? new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("attendance").upsert(
      {
        student_id: data.studentId,
        halaqa_id: data.halaqaId,
        date,
        status: data.status,
        notes: data.notes ?? null,
        is_manual: true,
        recorded_by: userId,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "student_id,halaqa_id,date" },
    );
    if (error) throw new Error(error.message);
    return { success: true };
  });
import { createServerFn } from "@tanstack/react-start";

export type LandingStats = {
  students: number;
  halaqas: number;
  teachers: number;
  hours: number;
};

export type LandingTeacher = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export type LandingHalaqa = {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | null;
  gender: "male" | "female" | null;
  schedule: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  max_students: number | null;
  enrolled: number;
  seats: number | null;
  teacher_name: string | null;
};

export const getLandingStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [studentsQ, halaqasQ, teachersQ] = await Promise.all([
      supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "student"),
      supabaseAdmin
        .from("halaqas")
        .select("id", { count: "exact", head: true })
        .in("status", ["active", "published"]),
      supabaseAdmin
        .from("user_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "teacher"),
    ]);
    return {
      students: studentsQ.count ?? 0,
      halaqas: halaqasQ.count ?? 0,
      teachers: teachersQ.count ?? 0,
      hours: 0,
    };
  },
);

export const getLandingTeachers = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingTeacher[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "teacher");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, bio, status")
      .in("id", ids)
      .eq("status", "approved");
    return (profs ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      bio: p.bio,
    }));
  },
);

export type LandingTestimonial = { id: string; name: string; role: string; text: string };

export const getLandingTestimonials = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingTestimonial[]> => {
    // No testimonials table exists in the schema; return empty list.
    return [];
  },
);

export const getLandingHalaqas = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingHalaqa[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: halaqas } = await supabaseAdmin
      .from("halaqas")
      .select("id, name, level, gender, schedule, schedule_days, start_time, end_time, max_students, teacher_id, status")
      .in("status", ["active", "published"])
      .order("created_at", { ascending: false })
      .limit(8);
    const rows = halaqas ?? [];
    const teacherIds = Array.from(new Set(rows.map((r) => r.teacher_id).filter(Boolean))) as string[];
    const idToName = new Map<string, string>();
    if (teacherIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);
      (profs ?? []).forEach((p) => idToName.set(p.id, p.full_name ?? ""));
    }
    const halaqaIds = rows.map((r) => r.id);
    const counts = new Map<string, number>();
    if (halaqaIds.length) {
      const { data: enrolls } = await supabaseAdmin
        .from("student_halaqas")
        .select("halaqa_id")
        .in("halaqa_id", halaqaIds);
      (enrolls ?? []).forEach((e) => counts.set(e.halaqa_id, (counts.get(e.halaqa_id) ?? 0) + 1));
    }
    return rows.map((r) => {
      const enrolled = counts.get(r.id) ?? 0;
      const seats = r.max_students != null ? Math.max(0, r.max_students - enrolled) : null;
      return {
        id: r.id,
        name: r.name,
        level: r.level,
        gender: r.gender,
        schedule: r.schedule,
        schedule_days: r.schedule_days,
        start_time: r.start_time,
        end_time: r.end_time,
        max_students: r.max_students,
        enrolled,
        seats,
        teacher_name: r.teacher_id ? idToName.get(r.teacher_id) ?? null : null,
      };
    });
  },
);
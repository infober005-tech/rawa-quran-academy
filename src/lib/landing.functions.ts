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
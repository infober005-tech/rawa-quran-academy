import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InsightsInput = z.object({ studentId: z.string().uuid() });

/**
 * Generate an AI-powered monthly insight report for a student.
 * Authorization: caller must be the student, a linked parent, the halaqa
 * teacher/supervisor, a general supervisor, or a director.
 */
export const generateStudentInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InsightsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authorization
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles }, { data: parentLink }, { data: ownHalaqas }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin
        .from("parent_links")
        .select("student_user_id")
        .eq("parent_user_id", userId)
        .eq("student_user_id", data.studentId)
        .maybeSingle(),
      supabase.from("halaqas").select("id").or(`teacher_id.eq.${userId},supervisor_id.eq.${userId}`),
      supabase.from("profiles").select("id, full_name").eq("id", data.studentId).maybeSingle(),
    ]);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const isDir = roleSet.has("director");
    const isGen = roleSet.has("general_supervisor");
    const isParent = !!parentLink;
    const isSelf = userId === data.studentId;
    let allowed = isDir || isGen || isParent || isSelf;
    if (!allowed && ownHalaqas?.length) {
      const { data: link } = await supabase
        .from("student_halaqas")
        .select("halaqa_id")
        .eq("student_id", data.studentId)
        .in("halaqa_id", ownHalaqas.map((h) => h.id));
      allowed = (link?.length ?? 0) > 0;
    }
    if (!allowed) throw new Error("Forbidden");

    const since = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    const [{ data: att }, { data: evals }] = await Promise.all([
      supabase.from("attendance").select("status, date").eq("student_id", data.studentId).gte("date", since).order("date", { ascending: true }),
      supabase.from("evaluations").select("tajweed_score, memorization_score, behavior_score, fluency_score, notes, created_at").eq("student_id", data.studentId).order("created_at", { ascending: true }).limit(60),
    ]);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const sys = `أنت محلل بيانات تعليمي لأكاديمية قرآن. حلل بيانات الطالب وأنتج تقريراً شهرياً موجزاً بالعربية الفصحى. أرجع JSON صالحاً فقط.`;
    const userPrompt = JSON.stringify({
      student: profile?.full_name ?? "طالب",
      attendance: att ?? [],
      evaluations: evals ?? [],
      instructions: {
        memorization_consistency: "نسبة 0-100 بناءً على ثبات درجات الحفظ",
        tajweed_trend: "up | down | stable مع تفسير قصير",
        behavior_evolution: "up | down | stable مع تفسير قصير",
        summary_ar: "ملخص لا يتجاوز 4 جمل",
        strengths_ar: "نقاط القوة (3 عناصر)",
        focus_areas_ar: "مجالات التحسين (3 عناصر)",
        recommendations_ar: "توصيات للمعلم وولي الأمر (3 عناصر)",
      },
      schema: {
        memorization_consistency: "number 0-100",
        tajweed_trend: { direction: "up|down|stable", note: "string" },
        behavior_evolution: { direction: "up|down|stable", note: "string" },
        attendance_rate: "number 0-100",
        summary_ar: "string",
        strengths_ar: ["string"],
        focus_areas_ar: ["string"],
        recommendations_ar: ["string"],
      },
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      return { report: JSON.parse(content), generatedAt: new Date().toISOString() };
    } catch {
      return { report: { summary_ar: content }, generatedAt: new Date().toISOString() };
    }
  });
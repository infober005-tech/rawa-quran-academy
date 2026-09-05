import { createServerFn } from "@tanstack/react-start";
import { detectMessageLanguage } from "@/lib/detect-language";
import { z } from "zod";

const ChatInput = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  lang: z.enum(["ar", "fr", "en"]).optional(),
  responseLanguage: z.enum(["ar", "fr", "en"]).optional(),
});

type PlatformSnapshot = {
  stats: {
    students: number;
    teachers: number;
    active_halaqas: number;
  };
  halaqas: Array<{
    name: string;
    level: string | null;
    gender: string | null;
    schedule: string | null;
    teacher: string | null;
  }>;
  teachers: Array<{ name: string; city: string | null; country: string | null }>;
  events: Array<{ title: string; date: string | null }>;
  announcements: Array<{ title: string; body: string | null; created_at: string }>;
};

async function fetchPlatformSnapshot(): Promise<PlatformSnapshot> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();

  const [halaqasRes, teachersRes, eventsRes, notifRes, roleCountsRes, studentCountRes] = await Promise.all([
    supabaseAdmin
      .from("halaqas")
      .select("id, name, level, gender, schedule, teacher_id, status")
      .eq("status", "active")
      .limit(30),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, city, country")
      .limit(30),
    supabaseAdmin
      .from("events")
      .select("title, date")
      .gte("date", nowIso.slice(0, 10))
      .order("date", { ascending: true })
      .limit(10),
    supabaseAdmin
      .from("notifications")
      .select("title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin.from("user_roles").select("user_id, role"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const halaqas = halaqasRes.data ?? [];
  const teacherIds = new Set((roleCountsRes.data ?? []).filter((r) => r.role === "teacher").map((r) => r.user_id));
  const teacherProfiles = (teachersRes.data ?? []).filter((p) => teacherIds.has(p.id));
  const teacherMap = new Map(teacherProfiles.map((t) => [t.id, t.full_name]));

  return {
    stats: {
      students: studentCountRes.count ?? 0,
      teachers: teacherIds.size,
      active_halaqas: halaqas.length,
    },
    halaqas: halaqas.map((h) => ({
      name: h.name,
      level: h.level ?? null,
      gender: h.gender ?? null,
      schedule: h.schedule ?? null,
      teacher: h.teacher_id ? (teacherMap.get(h.teacher_id) ?? null) : null,
    })),
    teachers: teacherProfiles.slice(0, 15).map((t) => ({
      name: t.full_name ?? "معلم",
      city: t.city ?? null,
      country: t.country ?? null,
    })),
    events: (eventsRes.data ?? []).map((e) => ({ title: e.title, date: e.date })),
    announcements: (notifRes.data ?? []).map((n) => ({
      title: n.title,
      body: n.content,
      created_at: n.created_at,
    })),
  };
}

const SYSTEM_PROMPT = `أنت "مساعد رواء"، مساعد ذكي رسمي لأكاديمية رواء للقرآن الكريم.

LANGUAGE POLICY:
Always answer in the same language as the user's latest message.
Detect the language automatically before generating the answer.
Supported languages are Arabic, French and English.
Algerian Darija counts as Arabic.
For mixed-language messages, use the dominant language.
Never answer in another language unless the user explicitly asks for translation or requests another language.
Never mix two or three languages in one answer. Quranic verses, hadith and adhkar stay in their original Arabic even inside a French or English answer.

قواعد صارمة:
- استخدم بيانات المنصة المُرفقة (PLATFORM_DATA) كمصدر وحيد للحقائق (الحلقات، المعلمون، الفعاليات، الإحصاءات، الإعلانات).
- إذا لم تجد الإجابة في البيانات المرفقة أو في الأسئلة الشائعة، قل بصراحة: "لا تتوفر لديّ هذه المعلومة حالياً، يرجى التواصل مع الدعم." ولا تخترع أي معلومة.
- لا تكشف أسماء طلاب أو تفاصيل حساسة إلا إذا كانت واردة صراحة في البيانات المرفقة.
- ركّز على مواضيع المنصة فقط: التسجيل، الحلقات، المعلمون، الاشتراكات، المدفوعات، الحضور (QR)، لوحة الطالب/المعلم/ولي الأمر، القرآن والحفظ والتجويد، الدعم الفني.
- استخدم فقرات قصيرة ونقاطاً واضحة عند الحاجة، وابدأ بالسلام عند أول رد فقط.

الأسئلة الشائعة (اعتمدها كإجابات موثوقة):
• التسجيل: من الصفحة الرئيسية اضغط "التسجيل"، املأ الاستمارة (الاسم، البريد، تاريخ الميلاد، الدولة، المستوى)، ثم فعّل حسابك عبر البريد.
• الدفع: من لوحة التحكم اذهب إلى "الاشتراك" واختر الباقة وطريقة الدفع (تحويل بنكي/ Baridi Mob…) ثم ارفع إيصال الدفع.
• الانضمام لحلقة: بعد تفعيل الاشتراك سيقوم المشرف بتوزيعك على حلقة مناسبة لمستواك وجنسك وتوقيتك.
• استرجاع كلمة المرور: من صفحة الدخول اضغط "نسيت كلمة المرور" وأدخل بريدك.
• حضور QR: يفتح المعلم جلسة، يعرض رمز QR لمدة 5 دقائق، ويمسحه الطالب من هاتفه بعد تسجيل الدخول ليُسجَّل حضوره تلقائياً.
• متابعة ولي الأمر: من لوحة ولي الأمر يرى الحلقة، الحضور، آخر تقييم، والواجبات الحالية.
• إدخال التقييمات: يفتح المعلم جلسة الحلقة ويُقيّم الطالب في التجويد، الحفظ، الطلاقة، السلوك، والمشاركة.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    // Language of the answer is driven by the CURRENT user message, never the UI language.
    const lastUserMessage = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const responseLanguage =
      data.responseLanguage ?? detectMessageLanguage(lastUserMessage, data.lang ?? "ar");

    let snapshot: PlatformSnapshot;
    try {
      snapshot = await fetchPlatformSnapshot();
    } catch {
      snapshot = {
        stats: { students: 0, teachers: 0, active_halaqas: 0 },
        halaqas: [],
        teachers: [],
        events: [],
        announcements: [],
      };
    }

    const platformContext = `PLATFORM_DATA (مصدر الحقائق):\n${JSON.stringify(snapshot, null, 2)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content: `response_language: ${responseLanguage}\n${
              responseLanguage === "fr"
                ? "The user's latest message is in French. Answer ONLY in professional, natural French. Do not use Arabic or English for the explanation, suggestions, follow-up questions or error notices (Quranic verses, hadith and adhkar stay in Arabic)."
                : responseLanguage === "en"
                  ? "The user's latest message is in English. Answer ONLY in professional, natural English. Do not use Arabic or French for the explanation, suggestions, follow-up questions or error notices (Quranic verses, hadith and adhkar stay in Arabic)."
                  : "رسالة المستخدم الأخيرة بالعربية (أو بالدارجة الجزائرية/العربيزي). أجب بالعربية فقط (يمكنك استخدام الدارجة الجزائرية إن كتب بها)، ولا تستخدم الفرنسية أو الإنجليزية في الشرح أو الاقتراحات أو أسئلة المتابعة."
            }`,
          },
          { role: "system", content: platformContext },
          ...data.messages,
        ],
      }),
    });

    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return {
      reply: content.trim() || "عذراً، لم أستطع توليد إجابة الآن. حاول مرة أخرى.",
      hasAnnouncement: snapshot.announcements.length > 0,
      latestAnnouncement: snapshot.announcements[0] ?? null,
    };
  });
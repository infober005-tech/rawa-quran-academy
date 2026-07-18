import type { AssistantSuggestion } from "@/types/assistant";

export const DEFAULT_SUGGESTIONS: AssistantSuggestion[] = [
  { id: "reg", emoji: "📚", label: "التسجيل", prompt: "كيف أسجل في منصة رواء؟" },
  { id: "halaqas", emoji: "📖", label: "الحلقات", prompt: "ما هي الحلقات المتاحة حالياً؟" },
  { id: "teachers", emoji: "👨‍🏫", label: "المعلمون", prompt: "من هم المعلمون في المنصة؟" },
  { id: "subs", emoji: "💳", label: "الاشتراكات", prompt: "ما باقات الاشتراك وكيف أدفع؟" },
  { id: "qr", emoji: "📱", label: "QR الحضور", prompt: "كيف يعمل نظام حضور QR؟" },
  { id: "parent", emoji: "👨‍👩‍👧", label: "ولي الأمر", prompt: "كيف أتابع ابني كولي أمر؟" },
  { id: "student", emoji: "🎓", label: "الطالب", prompt: "ماذا تحتوي لوحة الطالب؟" },
  { id: "events", emoji: "📅", label: "الفعاليات", prompt: "ما الفعاليات القادمة؟" },
  { id: "contact", emoji: "📞", label: "تواصل معنا", prompt: "كيف يمكنني التواصل مع الدعم؟" },
  { id: "faq", emoji: "❓", label: "الأسئلة الشائعة", prompt: "اعرض لي أهم الأسئلة الشائعة." },
];

export default function AssistantSuggestions({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {DEFAULT_SUGGESTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s.prompt)}
          className="text-xs px-3 py-1.5 rounded-full border border-primary/20 bg-white/60 dark:bg-white/5 backdrop-blur hover:bg-primary/10 hover:border-primary/40 transition disabled:opacity-50"
        >
          <span className="me-1">{s.emoji}</span>
          {s.label}
        </button>
      ))}
    </div>
  );
}
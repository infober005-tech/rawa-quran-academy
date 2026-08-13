import type { AssistantSuggestion } from "@/types/assistant";
import { useI18n } from "@/lib/i18n";

const SUGGESTION_IDS: Array<{ id: string; emoji: string }> = [
  { id: "reg", emoji: "📚" },
  { id: "halaqas", emoji: "📖" },
  { id: "teachers", emoji: "👨‍🏫" },
  { id: "subs", emoji: "💳" },
  { id: "qr", emoji: "📱" },
  { id: "parent", emoji: "👨‍👩‍👧" },
  { id: "student", emoji: "🎓" },
  { id: "events", emoji: "📅" },
  { id: "contact", emoji: "📞" },
  { id: "faq", emoji: "❓" },
];

export default function AssistantSuggestions({
  onPick,
  disabled,
}: {
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const suggestions: AssistantSuggestion[] = SUGGESTION_IDS.map((s) => ({
    id: s.id,
    emoji: s.emoji,
    label: t(`asst.sug.${s.id}`),
    prompt: t(`asst.sug.${s.id}.prompt`),
  }));
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {suggestions.map((s) => (
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
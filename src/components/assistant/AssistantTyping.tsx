export default function AssistantTyping() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur border border-primary/10 w-fit">
      <span className="sr-only">جارٍ الكتابة…</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-primary/70 animate-bounce"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}
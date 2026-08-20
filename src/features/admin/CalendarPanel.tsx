import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type CalItem = { id: string; title: string; date: Date; kind: "event" | "halaqa"; color: string };

export function CalendarPanel() {
  const { t } = useI18n();
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(() => new Date());

  const { data: events } = useQuery({
    queryKey: ["cal-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("id, title, date, event_type").eq("status", "published");
      return data ?? [];
    },
  });

  const { data: halaqas } = useQuery({
    queryKey: ["cal-halaqas"],
    queryFn: async () => {
      const { data } = await supabase.from("halaqas").select("id, name, schedule_days, start_time, status").eq("status", "active");
      return data ?? [];
    },
  });

  const items = useMemo<CalItem[]>(() => {
    const out: CalItem[] = [];
    (events ?? []).forEach((e: { id: string; title: string; date: string; event_type: string | null }) => {
      out.push({ id: e.id, title: e.title, date: new Date(e.date), kind: "event", color: e.event_type === "competition" ? "bg-red-500/20 text-red-700" : "bg-gold/20 text-gold" });
    });
    // Expand halaqa schedule_days for the visible month
    const DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    (halaqas ?? []).forEach((h: { id: string; name: string; schedule_days: string[] | null; start_time: string | null }) => {
      if (!h.schedule_days?.length) return;
      const wanted = new Set(h.schedule_days.map((d) => DAY_MAP[d]).filter((x) => x !== undefined));
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (wanted.has(d.getDay())) {
          const [hh = "00", mm = "00"] = (h.start_time ?? "00:00").split(":");
          const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Number(hh), Number(mm));
          out.push({ id: `${h.id}-${date.toISOString()}`, title: `🕌 ${h.name}`, date, kind: "halaqa", color: "bg-primary/15 text-primary" });
        }
      }
    });
    return out;
  }, [events, halaqas, cursor]);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return cells;
  }, [cursor]);

  const weekDays = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h2 className="text-xl font-bold text-primary">{t("dir.calendar")}</h2>
        <div className="flex gap-2 items-center">
          <button onClick={() => setCursor((c) => view === "month" ? new Date(c.getFullYear(), c.getMonth() - 1, 1) : new Date(c.getTime() - 7 * 86400000))} className="px-3 py-1 rounded-full bg-muted text-xs">‹</button>
          <div className="text-sm font-semibold">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
          <button onClick={() => setCursor((c) => view === "month" ? new Date(c.getFullYear(), c.getMonth() + 1, 1) : new Date(c.getTime() + 7 * 86400000))} className="px-3 py-1 rounded-full bg-muted text-xs">›</button>
          <div className="flex gap-1 p-0.5 bg-muted rounded-full text-xs ml-2">
            <button onClick={() => setView("month")} className={`px-3 py-1 rounded-full ${view === "month" ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>{t("dir.month")}</button>
            <button onClick={() => setView("week")} className={`px-3 py-1 rounded-full ${view === "week" ? "bg-gradient-royal text-primary-foreground" : "text-muted-foreground"}`}>{t("dir.week")}</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground">
        {[t("a.calendar.day.sun"), t("a.calendar.day.mon"), t("a.calendar.day.tue"), t("a.calendar.day.wed"), t("a.calendar.day.thu"), t("a.calendar.day.fri"), t("a.calendar.day.sat")].map((d) => <div key={d} className="p-1">{d}</div>)}
      </div>

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((d, i) => (
            <div key={i} className={`min-h-24 p-1.5 rounded-lg border ${d ? "bg-card border-border" : "bg-transparent border-transparent"}`}>
              {d && <>
                <div className="text-xs font-semibold text-muted-foreground">{d.getDate()}</div>
                <div className="space-y-0.5 mt-1">
                  {items.filter((it) => sameDay(it.date, d)).slice(0, 3).map((it) => (
                    <div key={it.id} className={`truncate px-1.5 py-0.5 rounded text-[10px] ${it.color}`}>{it.title}</div>
                  ))}
                </div>
              </>}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d) => (
            <div key={d.toISOString()} className="p-2 rounded-xl bg-card border border-border min-h-40">
              <div className="text-xs font-semibold text-primary">{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</div>
              <div className="space-y-1 mt-2">
                {items.filter((it) => sameDay(it.date, d)).map((it) => (
                  <div key={it.id} className={`px-2 py-1 rounded text-[11px] ${it.color}`}>
                    <div className="font-semibold truncate">{it.title}</div>
                    <div className="opacity-70">{it.date.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
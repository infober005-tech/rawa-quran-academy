import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const input = "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  speaker: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  meeting_provider: string | null;
  meeting_link: string | null;
  cover_url: string | null;
  registration_required: boolean;
  max_participants: number | null;
  status: "draft" | "published" | "cancelled" | "completed";
};

type FormState = Omit<EventRow, "id">;

const empty = (): FormState => ({
  title: "", description: "", event_type: "course", speaker: "",
  date: new Date().toISOString().slice(0, 10), start_time: "", end_time: "",
  meeting_provider: "google_meet", meeting_link: "", cover_url: "",
  registration_required: false, max_participants: null, status: "draft",
});

export function EventsPanel() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: events } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      return (data ?? []) as EventRow[];
    },
  });

  const { data: regs } = useQuery({
    queryKey: ["admin-event-regs"],
    queryFn: async () => {
      const { data } = await supabase.from("event_registrations").select("event_id");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((r: { event_id: string }) => { counts[r.event_id] = (counts[r.event_id] ?? 0) + 1; });
      return counts;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EventRow["status"] }) => {
      const { error } = await supabase.from("events").update({ status }).eq("id", id); if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success("✓"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const now = new Date();
  const upcoming = (events ?? []).filter((e) => new Date(e.date) > now && e.status === "published");
  const active = (events ?? []).filter((e) => {
    const d = new Date(e.date); return d.toDateString() === now.toDateString() && e.status === "published";
  });
  const completed = (events ?? []).filter((e) => new Date(e.date) < now || e.status === "completed");

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Stat icon="📅" label={t("ev.upcoming")} value={upcoming.length} />
        <Stat icon="🔴" label={t("ev.active")} value={active.length} />
        <Stat icon="✓" label={t("ev.completed")} value={completed.length} />
        <Stat icon="🎟️" label={t("ev.registered")} value={Object.values(regs ?? {}).reduce((a, b) => a + b, 0)} />
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">{t("dir.events")} <span className="text-sm text-muted-foreground">({events?.length ?? 0})</span></h2>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-sm font-semibold">+ {t("dir.new_event")}</button>
      </div>

      {showForm && <EventForm initial={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}

      <div className="space-y-3">
        {events?.map((e) => (
          <div key={e.id} className="p-5 rounded-2xl bg-card border border-border shadow-soft">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="min-w-0">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${e.status === "published" ? "bg-green-500/20 text-green-600" : e.status === "cancelled" ? "bg-red-500/20 text-red-600" : "bg-muted text-muted-foreground"}`}>{e.status}</span>
                  {e.event_type && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-gold">{e.event_type}</span>}
                </div>
                <div className="text-lg font-bold text-primary mt-1">{e.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()} {e.start_time && `· ${e.start_time}–${e.end_time ?? ""}`} {e.speaker && `· 🎤 ${e.speaker}`}</div>
                {e.registration_required && <div className="text-xs text-gold mt-1">🎟️ {regs?.[e.id] ?? 0}{e.max_participants ? ` / ${e.max_participants}` : ""}</div>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select aria-label={`Status for ${e.title}`} value={e.status} onChange={(ev) => setStatus.mutate({ id: e.id, status: ev.target.value as EventRow["status"] })} className="px-2 py-1.5 min-h-9 rounded-lg border border-input bg-background text-xs">
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="cancelled">cancelled</option>
                  <option value="completed">completed</option>
                </select>
                <button aria-label={`${t("common.edit")} ${e.title}`} onClick={() => { setEditing(e); setShowForm(true); }} className="px-3 py-1.5 min-h-9 rounded-full text-xs bg-muted hover:bg-muted/70">{t("common.edit")}</button>
                <button aria-label={`${t("common.delete")} ${e.title}`} onClick={() => { if (confirm("Delete?")) del.mutate(e.id); }} className="px-3 py-1.5 min-h-9 rounded-full text-xs bg-destructive/10 text-destructive hover:bg-destructive/20">{t("common.delete")}</button>
              </div>
            </div>
          </div>
        ))}
        {(!events || events.length === 0) && <div className="p-10 text-center text-muted-foreground border border-dashed rounded-2xl">—</div>}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return <div className="p-4 rounded-2xl bg-card border border-border shadow-soft"><div className="text-2xl">{icon}</div><div className="text-xs text-muted-foreground mt-1">{label}</div><div className="text-2xl font-bold text-primary">{value}</div></div>;
}

function EventForm({ initial, onClose }: { initial: EventRow | null; onClose: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(initial ? {
    title: initial.title, description: initial.description ?? "", event_type: initial.event_type ?? "course",
    speaker: initial.speaker ?? "", date: initial.date.slice(0, 10), start_time: initial.start_time ?? "",
    end_time: initial.end_time ?? "", meeting_provider: initial.meeting_provider ?? "google_meet",
    meeting_link: initial.meeting_link ?? "", cover_url: initial.cover_url ?? "",
    registration_required: initial.registration_required, max_participants: initial.max_participants, status: initial.status,
  } : empty());

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        description: form.description || null,
        speaker: form.speaker || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        meeting_link: form.meeting_link || null,
        cover_url: form.cover_url || null,
        max_participants: form.max_participants || null,
        date: new Date(`${form.date}T${form.start_time || "00:00"}:00`).toISOString(),
      };
      if (initial) {
        const { error } = await supabase.from("events").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success("✓"); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="p-6 rounded-2xl bg-card border-2 border-primary/30 shadow-soft grid md:grid-cols-3 gap-3">
      <input required placeholder={t("ev.title")} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={input + " md:col-span-2"} />
      <select value={form.event_type ?? ""} onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))} className={input}>
        <option value="course">{t("ev.type.course")}</option>
        <option value="workshop">{t("ev.type.workshop")}</option>
        <option value="lecture">{t("ev.type.lecture")}</option>
        <option value="competition">{t("ev.type.competition")}</option>
        <option value="live">{t("ev.type.live")}</option>
      </select>
      <input placeholder={t("ev.speaker")} value={form.speaker ?? ""} onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))} className={input} />
      <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={input} />
      <input type="time" value={form.start_time ?? ""} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} className={input} />
      <input type="time" value={form.end_time ?? ""} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} className={input} />
      <select value={form.meeting_provider ?? "google_meet"} onChange={(e) => setForm((f) => ({ ...f, meeting_provider: e.target.value }))} className={input}>
        <option value="google_meet">Google Meet</option><option value="zoom">Zoom</option>
      </select>
      <input placeholder="Meeting link" value={form.meeting_link ?? ""} onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))} className={input + " md:col-span-3"} />
      <input placeholder="Cover image URL" value={form.cover_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))} className={input + " md:col-span-2"} />
      <input type="number" min={1} placeholder="Max participants" value={form.max_participants ?? ""} onChange={(e) => setForm((f) => ({ ...f, max_participants: e.target.value ? Number(e.target.value) : null }))} className={input} />
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" checked={form.registration_required} onChange={(e) => setForm((f) => ({ ...f, registration_required: e.target.checked }))} />
        {t("ev.registration_required")}
      </label>
      <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as FormState["status"] }))} className={input}>
        <option value="draft">draft</option>
        <option value="published">published</option>
      </select>
      <textarea placeholder={t("common.description")} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={input + " md:col-span-3"} rows={3} />
      <div className="md:col-span-3 flex gap-2">
        <button disabled={save.isPending} className="px-5 py-2 rounded-xl bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">{t("common.save")}</button>
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-muted">{t("common.cancel")}</button>
      </div>
    </form>
  );
}
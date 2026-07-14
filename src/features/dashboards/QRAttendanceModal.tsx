import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import QRCode from "qrcode";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startAttendanceSession, endAttendanceSession } from "@/lib/attendance.functions";

type ActiveSession = { id: string; token: string; expires_at: string; halaqa_id: string };

/**
 * Teacher-only QR attendance modal. Creates a 5-minute session token,
 * renders a QR pointing at /attendance/checkin?token=..., and shows a
 * realtime count of check-ins for the current session.
 */
export function QRAttendanceModal({
  halaqaId,
  halaqaName,
  onClose,
}: { halaqaId: string; halaqaName: string; onClose: () => void }) {
  const qc = useQueryClient();
  const start = useServerFn(startAttendanceSession);
  const end = useServerFn(endAttendanceSession);

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  const startMut = useMutation({
    mutationFn: () => start({ data: { halaqaId } }),
    onSuccess: (data: any) => setSession(data as ActiveSession),
    onError: (e: Error) => toast.error(e.message),
  });

  const endMut = useMutation({
    mutationFn: (id: string) => end({ data: { sessionId: id } }),
    onSuccess: () => { setSession(null); setQrDataUrl(null); toast.success("Attendance session ended"); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkinUrl = useMemo(() => {
    if (!session) return null;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/attendance/checkin?token=${session.token}`;
  }, [session]);

  useEffect(() => {
    if (!checkinUrl) { setQrDataUrl(null); return; }
    QRCode.toDataURL(checkinUrl, { width: 320, margin: 2 }).then(setQrDataUrl).catch(() => {});
  }, [checkinUrl]);

  // Countdown
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000));
      setSecondsLeft(s);
      if (s === 0) endMut.mutate(session.id);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Realtime check-in count for this session
  const today = new Date().toISOString().slice(0, 10);
  const { data: count = 0, refetch } = useQuery({
    queryKey: ["qr-attendance-count", halaqaId, session?.id],
    enabled: !!session,
    queryFn: async () => {
      const { count } = await supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("halaqa_id", halaqaId)
        .eq("date", today)
        .eq("status", "present");
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`att-count-${session.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance", filter: `halaqa_id=eq.${halaqaId}` }, () => { refetch(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, halaqaId, refetch]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl border border-border max-w-md w-full shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="font-bold text-primary">QR Attendance</h2>
            <p className="text-xs text-muted-foreground mt-1">{halaqaName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-6 space-y-4 text-center">
          {!session ? (
            <>
              <p className="text-sm text-muted-foreground">
                Start a 5-minute check-in window. Students in this halaqa can scan the QR from their phone to mark attendance.
              </p>
              <button
                onClick={() => startMut.mutate()}
                disabled={startMut.isPending}
                className="px-6 py-3 rounded-full bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-50"
              >
                {startMut.isPending ? "Starting…" : "▶ Start Attendance"}
              </button>
            </>
          ) : (
            <>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="Attendance QR" className="mx-auto rounded-2xl border border-border bg-white p-2" />
              )}
              <div className="flex items-center justify-center gap-3">
                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-bold animate-pulse">● Live</span>
                <span className="text-xs text-muted-foreground">Expires in <span className="font-mono font-bold text-primary">{mm}:{ss}</span></span>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Checked-in today</div>
                <div className="text-3xl font-black text-primary mt-1">{count}</div>
              </div>
              <button
                onClick={() => endMut.mutate(session.id)}
                disabled={endMut.isPending}
                className="w-full px-4 py-2 rounded-full bg-destructive/10 text-destructive font-semibold"
              >
                End Attendance
              </button>
              {checkinUrl && (
                <div className="text-[10px] text-muted-foreground break-all font-mono">{checkinUrl}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
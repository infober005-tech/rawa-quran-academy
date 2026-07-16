import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { checkInAttendance } from "@/lib/attendance.functions";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/DashboardShell";

const Search = z.object({ token: z.string().min(8).max(128).optional() });

export const Route = createFileRoute("/_authenticated/attendance/checkin")({
  validateSearch: (s) => Search.parse(s),
  component: CheckinPage,
  errorComponent: ({ error }) => (
    <DashboardShell>
      <div className="max-w-md mx-auto mt-16 p-8 rounded-3xl bg-card border border-border text-center">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-destructive font-semibold">{error?.message ?? "Something went wrong"}</p>
      </div>
    </DashboardShell>
  ),
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
});

function CheckinPage() {
  const { token } = useSearch({ from: "/_authenticated/attendance/checkin" });
  const checkIn = useServerFn(checkInAttendance);
  const qc = useQueryClient();
  const [state, setState] = useState<"pending" | "success" | "already" | "error">("pending");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("error"); setMessage("Missing QR token."); return; }
    let cancelled = false;
    (async () => {
      const device = {
        userAgent: navigator.userAgent,
        platform: (navigator as Navigator & { platform?: string }).platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        vendor: (navigator as Navigator & { vendor?: string }).vendor,
      };
      const location = await new Promise<{ latitude: number; longitude: number; accuracy: number } | undefined>((resolve) => {
        if (!("geolocation" in navigator)) return resolve(undefined);
        const t = setTimeout(() => resolve(undefined), 4000);
        navigator.geolocation.getCurrentPosition(
          (pos) => { clearTimeout(t); resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }); },
          () => { clearTimeout(t); resolve(undefined); },
          { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 },
        );
      });
      try {
        const res: any = await checkIn({ data: { token, device, location } });
        if (cancelled) return;
        if (res?.alreadyMarked) { setState("already"); setMessage("You have already checked in today."); }
        else { setState("success"); setMessage("Attendance recorded. May Allah reward your effort."); }
        qc.invalidateQueries();
      } catch (e: any) {
        if (cancelled) return;
        setState("error");
        setMessage(e?.message ?? "Check-in failed.");
      }
    })();
    return () => { cancelled = true; };
  }, [token, checkIn, qc]);

  const icon = state === "success" ? "✅" : state === "already" ? "ℹ️" : state === "error" ? "⚠️" : "⏳";
  const tone = state === "success" ? "text-green-600" : state === "already" ? "text-primary" : state === "error" ? "text-destructive" : "text-muted-foreground";

  return (
    <DashboardShell>
      <div className="max-w-md mx-auto mt-16 p-10 rounded-3xl bg-card border border-border shadow-soft text-center space-y-4">
        <div className="text-6xl">{icon}</div>
        <h1 className="text-xl font-bold text-primary">QR Attendance</h1>
        <p className={`text-sm ${tone}`}>{state === "pending" ? "Verifying your check-in…" : message}</p>
        <Link to="/dashboard" className="inline-block mt-4 px-6 py-2 rounded-full bg-gradient-royal text-primary-foreground text-sm font-semibold">Go to dashboard</Link>
      </div>
    </DashboardShell>
  );
}
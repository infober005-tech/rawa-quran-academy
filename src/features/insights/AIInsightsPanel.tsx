import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateStudentInsights } from "@/lib/insights.functions";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

type Report = {
  memorization_consistency?: number;
  attendance_rate?: number;
  tajweed_trend?: { direction?: string; note?: string };
  behavior_evolution?: { direction?: string; note?: string };
  summary_ar?: string;
  strengths_ar?: string[];
  focus_areas_ar?: string[];
  recommendations_ar?: string[];
};

export function AIInsightsPanel({ studentId, studentName }: { studentId: string; studentName?: string }) {
  const { t } = useI18n();
  const run = useServerFn(generateStudentInsights);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const go = async () => {
    setLoading(true);
    try {
      const r = await run({ data: { studentId } });
      setReport(r.report as Report);
      setGeneratedAt(r.generatedAt);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI error";
      if (msg === "RATE_LIMITED") toast.error(t("f.insights.error.rate_limited"));
      else if (msg === "CREDITS_EXHAUSTED") toast.error(t("f.insights.error.credits_exhausted"));
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const trendLabel = (d?: string) =>
    d === "up" ? t("f.insights.trend.up") : d === "down" ? t("f.insights.trend.down") : d === "stable" ? t("f.insights.trend.stable") : t("f.insights.trend.na");
  const fmtPct = (v?: number) => (typeof v === "number" ? `${Math.round(v)}%` : t("f.insights.trend.na"));

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-card to-gold/5 border border-gold/30 shadow-soft">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-gold">AI Insights</div>
          <h2 className="text-xl font-bold text-primary">{t("f.insights.title", { name: studentName ?? t("f.insights.student_fallback") })}</h2>
        </div>
        <button onClick={go} disabled={loading} className="px-4 py-2 rounded-full bg-gradient-royal text-primary-foreground text-xs font-bold disabled:opacity-60">
          {loading ? t("f.insights.generating") : report ? t("f.insights.regenerate") : t("f.insights.generate_btn")}
        </button>
      </div>
      {!report && (
        <p className="text-sm text-muted-foreground">{t("f.insights.hint")}</p>
      )}
      {report && (
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <Stat label={t("f.insights.stat.memorization")} value={fmtPct(report.memorization_consistency)} />
            <Stat label={t("f.insights.stat.attendance")} value={fmtPct(report.attendance_rate)} />
            <Stat label={t("f.insights.stat.tajweed_trend")} value={trendLabel(report.tajweed_trend?.direction)} />
            <Stat label={t("f.insights.stat.behavior_trend")} value={trendLabel(report.behavior_evolution?.direction)} />
          </div>
          {report.summary_ar && (
            <div className="p-4 rounded-2xl bg-muted/40 text-sm leading-relaxed">{report.summary_ar}</div>
          )}
          <div className="grid md:grid-cols-3 gap-3">
            <Section title={t("f.insights.section.strengths")} tone="green" items={report.strengths_ar} />
            <Section title={t("f.insights.section.focus_areas")} tone="amber" items={report.focus_areas_ar} />
            <Section title={t("f.insights.section.recommendations")} tone="primary" items={report.recommendations_ar} />
          </div>
          {generatedAt && (
            <div className="text-[10px] text-muted-foreground text-end">{t("f.insights.last_update", { date: new Date(generatedAt).toLocaleString() })}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-2xl bg-card border border-border">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-primary mt-1">{value}</div>
    </div>
  );
}
function Section({ title, items, tone }: { title: string; items?: string[]; tone: "green" | "amber" | "primary" }) {
  const bg = tone === "green" ? "bg-green-500/10" : tone === "amber" ? "bg-amber-500/10" : "bg-primary/10";
  return (
    <div className={`p-4 rounded-2xl ${bg} border border-border`}>
      <div className="text-xs font-bold text-primary mb-2">{title}</div>
      <ul className="space-y-1 text-xs">
        {(items ?? []).map((s, i) => <li key={i}>• {s}</li>)}
        {(!items || items.length === 0) && <li className="text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}

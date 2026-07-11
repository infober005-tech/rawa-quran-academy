import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

type Status = "pending" | "approved" | "rejected" | null;

export function StatusTracker({ status }: { status: Status }) {
  const { t } = useI18n();
  const steps = status === "rejected"
    ? [
        { label: t("s.step.submitted"), done: true },
        { label: t("s.step.under_review"), done: true },
        { label: t("s.step.rejected"), done: true, danger: true },
      ]
    : [
        { label: t("s.step.submitted"), done: true },
        { label: t("s.step.under_review"), done: status === "pending" || status === "approved" },
        { label: t("s.step.approved"), done: status === "approved" },
        { label: t("s.step.activated"), done: status === "approved" },
      ];
  return (
    <div className="p-6 rounded-3xl bg-card border border-border shadow-soft">
      <h3 className="font-bold text-primary mb-5">{t("s.request_status")}</h3>
      <div className="relative flex justify-between items-start">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
        {steps.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="relative flex flex-col items-center gap-2 w-1/4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
              s.done && (s as { danger?: boolean }).danger ? "bg-red-500 border-red-500 text-white" :
              s.done ? "bg-green-500 border-green-500 text-white" :
              "bg-card border-border text-muted-foreground"
            }`}>{i + 1}</div>
            <span className="text-[11px] text-center font-medium text-foreground leading-tight">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

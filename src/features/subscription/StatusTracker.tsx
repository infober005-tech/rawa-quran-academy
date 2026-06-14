import { motion } from "framer-motion";

type Status = "pending" | "approved" | "rejected" | null;

export function StatusTracker({ status }: { status: Status }) {
  const steps = status === "rejected"
    ? [
        { label: "تم إرسال الطلب", done: true },
        { label: "قيد المراجعة", done: true },
        { label: "تم رفض الطلب", done: true, danger: true },
      ]
    : [
        { label: "تم إرسال الطلب", done: true },
        { label: "قيد المراجعة", done: status === "pending" || status === "approved" },
        { label: "تمت الموافقة", done: status === "approved" },
        { label: "تم تفعيل الاشتراك", done: status === "approved" },
      ];
  return (
    <div className="p-6 rounded-3xl bg-card border border-border shadow-soft">
      <h3 className="font-bold text-primary mb-5">حالة الطلب</h3>
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
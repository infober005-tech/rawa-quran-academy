import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { usePaymentSettings, useMyPayments, useSubscription } from "@/hooks/use-subscription";
import { StatusTracker } from "./StatusTracker";
import { ReceiptUpload } from "./ReceiptUpload";

const STEPS = [
  "ادفع قيمة الاشتراك عبر البطاقة الذهبية أو بريدي موب.",
  "احتفظ بوصل الدفع.",
  "أدخل رقم العملية.",
  "قم برفع صورة الوصل.",
  "انتظر مراجعة الإدارة.",
];

export function PaymentPage() {
  const { data: settings } = usePaymentSettings();
  const { data: payments } = useMyPayments();
  const { isActive, subscription } = useSubscription();
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lastPayment = payments?.[0];
  const showStatus = !!lastPayment && (!isActive || lastPayment.status !== "approved");

  const qrText = settings
    ? `RAWA QURAN ACADEMY\nCCP: ${settings.ccp_number}${settings.ccp_key ? " · Clé " + settings.ccp_key : ""}\nName: ${settings.account_holder}\nAmount: ${settings.price_dzd} ${settings.currency}`
    : "";

  useEffect(() => {
    if (canvasRef.current && qrText) {
      QRCode.toCanvas(canvasRef.current, qrText, { width: 220, margin: 1, color: { dark: "#3b1d6e", light: "#ffffff" } });
    }
  }, [qrText]);

  const copy = (text: string, msg = "تم نسخ المعلومات بنجاح") => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const copyAll = () => {
    if (!settings) return;
    copy(`اشتراك رواء\nCCP: ${settings.ccp_number}\nاسم المستفيد: ${settings.account_holder}\nالمبلغ: ${settings.price_dzd} ${settings.currency}`);
  };

  if (submitted) return <SuccessView />;

  return (
    <div dir="rtl" className="relative min-h-[80vh]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-gold/5" />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-block px-4 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold tracking-wider">RAWA · رواء</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">إتمام الاشتراك</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">أكمل عملية الدفع لتفعيل اشتراكك والاستفادة من جميع خدمات منصة رواء.</p>
        </motion.div>

        {isActive && (
          <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 text-center font-semibold">
            ✓ اشتراكك مفعّل حتى {new Date(subscription!.end_date).toLocaleDateString("ar")}
          </div>
        )}

        {showStatus && <StatusTracker status={lastPayment.status as "pending" | "approved" | "rejected"} />}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Plan + CCP card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground p-7 shadow-glow">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-gold/30 blur-3xl rounded-full" />
            <div className="relative space-y-5">
              <div>
                <div className="text-xs uppercase opacity-70 tracking-wider">الخطة</div>
                <div className="text-2xl font-bold mt-1">{settings?.subscription_name_ar ?? "اشتراك رواء"}</div>
                <div className="text-5xl font-black mt-3 text-gold">{settings?.price_dzd ?? "—"} <span className="text-base font-normal text-primary-foreground/80">{settings?.currency ?? "DZD"}</span></div>
              </div>
              <p className="text-sm opacity-90">{settings?.description_ar}</p>
              <ul className="space-y-1.5 text-sm">
                {((settings?.benefits_ar as string[]) ?? []).map((b, i) => (
                  <li key={i} className="flex items-center gap-2"><span className="text-gold">✦</span>{b}</li>
                ))}
              </ul>

              <div className="rounded-2xl bg-white/10 backdrop-blur p-4 space-y-3">
                <Row label="رقم CCP" value={settings?.ccp_number ?? ""} onCopy={() => copy(settings!.ccp_number)} />
                {settings?.ccp_key && <Row label="المفتاح" value={settings.ccp_key} onCopy={() => copy(settings.ccp_key!)} />}
                <Row label="اسم المستفيد" value={settings?.account_holder ?? ""} onCopy={() => copy(settings!.account_holder)} />
                <button onClick={copyAll} className="w-full mt-1 py-2.5 rounded-full bg-gold text-primary font-bold text-sm hover:scale-[1.02] transition">📋 نسخ جميع المعلومات</button>
              </div>
            </div>
          </motion.div>

          {/* QR + Steps */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-6">
            <div className="p-6 rounded-3xl bg-card border border-border shadow-soft text-center">
              <h3 className="font-bold text-primary mb-3">امسح رمز QR</h3>
              <p className="text-xs text-muted-foreground mb-4">امسح رمز QR باستعمال هاتفك لنسخ معلومات الدفع بسهولة.</p>
              <div className="inline-block p-3 rounded-2xl bg-white border-2 border-gold/40 shadow-glow">
                <canvas ref={canvasRef} />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-card border border-border shadow-soft">
              <h3 className="font-bold text-primary mb-4">خطوات الدفع</h3>
              <ol className="space-y-3">
                {STEPS.map((s, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-gradient-royal text-primary-foreground font-bold flex items-center justify-center text-xs">{i + 1}</span>
                    <span className="text-foreground/90 pt-1">{s}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          </motion.div>
        </div>

        {/* Upload */}
        {!isActive && lastPayment?.status !== "pending" && (
          <ReceiptUpload onSubmitted={() => setSubmitted(true)} />
        )}
        {lastPayment?.status === "pending" && (
          <div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center">
            <div className="text-4xl mb-2">⏳</div>
            <div className="font-bold text-amber-700 dark:text-amber-400">طلبك قيد المراجعة من قِبل الإدارة.</div>
            <p className="text-sm text-muted-foreground mt-2">سيتم إشعارك فور تفعيل اشتراكك.</p>
          </div>
        )}

        {/* Sticky mobile */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-primary-foreground p-3 flex items-center justify-between gap-2 shadow-2xl">
          <div>
            <div className="text-[10px] opacity-70">السعر</div>
            <div className="font-bold text-gold">{settings?.price_dzd ?? "—"} {settings?.currency ?? "DZD"}</div>
          </div>
          <button onClick={copyAll} className="px-4 py-2 rounded-full bg-gold text-primary text-xs font-bold">📋 نسخ CCP</button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase opacity-70 tracking-wide">{label}</div>
        <div className="font-mono text-sm truncate">{value}</div>
      </div>
      <button onClick={onCopy} className="shrink-0 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold">نسخ</button>
    </div>
  );
}

function SuccessView() {
  return (
    <div dir="rtl" className="max-w-xl mx-auto mt-20 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 rounded-3xl bg-card border border-gold/40 shadow-glow">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-primary mb-3">تم استلام طلب الاشتراك بنجاح</h2>
        <p className="text-muted-foreground mb-6">سيتم مراجعة العملية من طرف الإدارة وإشعارك فور تفعيل اشتراكك.</p>
        <Link to="/dashboard" className="inline-block px-6 py-3 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow">العودة إلى لوحة التحكم</Link>
      </motion.div>
    </div>
  );
}
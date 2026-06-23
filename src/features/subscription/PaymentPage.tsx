import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { usePaymentSettings, useMyPayments, useSubscription, PAYMENT_METHODS } from "@/hooks/use-subscription";
import { ReceiptUpload } from "./ReceiptUpload";
import { downloadPaymentInstructionsPDF } from "@/lib/payment-pdf";
import { useAuth } from "@/hooks/use-auth";
import { buildPaymentRef, buildQrToken, type QrPayload } from "@/lib/qr-payment";

const STEP_LABELS = [
  "تفاصيل الاشتراك",
  "تعليمات الدفع",
  "رفع الوصل",
  "مراجعة الحالة",
  "تفعيل الاشتراك",
];

export function PaymentPage() {
  const { data: settings } = usePaymentSettings();
  const { data: payments } = useMyPayments();
  const { isActive, subscription } = useSubscription();
  const { user } = useAuth();
  const [manualStep, setManualStep] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const lastPayment = payments?.[0];

  // Per-attempt signed QR payload — unique reference + random token, 30-min expiry.
  const qrPayload = useMemo<QrPayload | null>(() => {
    if (!settings || !user) return null;
    return {
      v: 1,
      ref: buildPaymentRef(user.id),
      token: buildQrToken(),
      studentId: user.id,
      amount: Number(settings.price_dzd),
      currency: settings.currency,
      ccp: settings.ccp_number,
      ccpKey: settings.ccp_key,
      holder: settings.account_holder,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }, [settings, user]);
  const qrText = qrPayload ? JSON.stringify(qrPayload) : "";

  useEffect(() => {
    if (!qrText) return;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrText, { width: 220, margin: 1, color: { dark: "#5A436F", light: "#ffffff" } });
    }
    QRCode.toDataURL(qrText, { width: 480, margin: 1, color: { dark: "#5A436F", light: "#ffffff" } }).then(setQrDataUrl).catch(() => {});
  }, [qrText]);

  const copy = (text: string, msg = "تم نسخ المعلومات بنجاح") => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  const copyAll = () => {
    if (!settings) return;
    copy(
      `اشتراك رواء\nCCP: ${settings.ccp_number}${settings.ccp_key ? " · المفتاح: " + settings.ccp_key : ""}\nاسم المستفيد: ${settings.account_holder}\nالمبلغ: ${settings.price_dzd} ${settings.currency}\nطرق الدفع المقبولة: Edahabia / BaridiMob\nمرجع المعاملة: ${qrPayload?.ref ?? "—"}`
    );
  };

  // Derive current step from real state
  const derivedStep = useMemo<number>(() => {
    if (isActive) return 5;
    if (lastPayment?.status === "approved") return 5;
    if (lastPayment?.status === "pending") return 4;
    if (lastPayment?.status === "rejected") return 3;
    return 1;
  }, [isActive, lastPayment]);
  const step = manualStep ?? derivedStep;
  const goto = (n: number) => setManualStep(Math.max(1, Math.min(5, n)));

  return (
    <div dir="rtl" className="relative min-h-[80vh]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-gold/5" />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 pb-28 lg:pb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-block px-4 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold tracking-wider">RAWA · رواء</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">إتمام الاشتراك</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">اتبع الخطوات الخمس لإتمام الاشتراك بطريقة آمنة وسهلة.</p>
        </motion.div>

        {/* Stepper */}
        <Stepper current={step} onJump={(n) => { if (n <= derivedStep) goto(n); }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <StepDetails settings={settings} onNext={() => goto(2)} />}
            {step === 2 && (
              <StepInstructions
                settings={settings}
                canvasRef={canvasRef}
                qrDataUrl={qrDataUrl}
                paymentRef={qrPayload?.ref ?? ""}
                onCopy={copy}
                onCopyAll={copyAll}
                onNext={() => goto(3)}
                onBack={() => goto(1)}
              />
            )}
            {step === 3 && (
              <StepUpload
                hasPending={lastPayment?.status === "pending"}
                rejected={lastPayment?.status === "rejected" ? lastPayment.admin_notes ?? null : null}
                qrPayload={qrPayload}
                onSubmitted={() => { setManualStep(null); goto(4); }}
                onBack={() => goto(2)}
              />
            )}
            {step === 4 && <StepReview status={lastPayment?.status ?? "pending"} notes={lastPayment?.admin_notes ?? null} onRetry={() => { setManualStep(null); goto(3); }} />}
            {step === 5 && <StepActivated endDate={subscription?.end_date ?? null} />}
          </motion.div>
        </AnimatePresence>

        {/* Sticky mobile bar */}
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

function Stepper({ current, onJump }: { current: number; onJump: (n: number) => void }) {
  return (
    <div className="relative">
      <div className="absolute top-5 inset-x-6 h-0.5 bg-border" />
      <div className="absolute top-5 right-6 h-0.5 bg-gradient-to-l from-gold to-primary" style={{ width: `calc(${((current - 1) / (STEP_LABELS.length - 1)) * 100}% - 1.5rem)` }} />
      <ol className="relative grid grid-cols-5 gap-2">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          return (
            <li key={label}>
              <button onClick={() => onJump(n)} className="w-full flex flex-col items-center gap-1.5 text-center">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                  active ? "bg-gradient-royal text-primary-foreground border-gold shadow-glow scale-110" :
                  done ? "bg-green-500 text-white border-green-500" :
                  "bg-card text-muted-foreground border-border"
                }`}>{done ? "✓" : n}</span>
                <span className={`text-[10px] sm:text-xs font-medium leading-tight ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type Settings = ReturnType<typeof usePaymentSettings>["data"];

function StepDetails({ settings, onNext }: { settings: Settings; onNext: () => void }) {
  return (
    <motion.div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground p-8 shadow-glow">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-gold/30 blur-3xl rounded-full" />
      <div className="relative grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="text-xs uppercase opacity-70 tracking-wider">الخطة</div>
          <div className="text-3xl font-bold">{settings?.subscription_name_ar ?? "اشتراك رواء"}</div>
          <div className="text-6xl font-black text-gold leading-none">{settings?.price_dzd ?? "—"} <span className="text-lg font-normal text-primary-foreground/80">{settings?.currency ?? "DZD"}</span></div>
          <p className="text-sm opacity-90">{settings?.description_ar}</p>
          <div className="text-xs opacity-80">مدة الاشتراك: {settings?.subscription_duration_days ?? 30} يومًا</div>
        </div>
        <div className="space-y-3">
          <div className="text-xs uppercase opacity-70 tracking-wider mb-1">المزايا</div>
          <ul className="space-y-2 text-sm">
            {((settings?.benefits_ar as string[]) ?? []).map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2"><span className="text-gold">✦</span>{b}</motion.li>
            ))}
          </ul>
          <div className="pt-3">
            <button onClick={onNext} className="w-full py-3 rounded-full bg-gold text-primary font-bold shadow-glow hover:scale-[1.02] transition">متابعة إلى تعليمات الدفع ←</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StepInstructions({ settings, canvasRef, qrDataUrl, paymentRef, onCopy, onCopyAll, onNext, onBack }: {
  settings: Settings;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  qrDataUrl: string;
  paymentRef: string;
  onCopy: (t: string) => void;
  onCopyAll: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="p-7 rounded-3xl bg-card border border-border shadow-soft space-y-4">
        <h3 className="font-bold text-primary text-lg">معلومات الدفع</h3>
        <p className="text-xs text-muted-foreground">طرق الدفع المقبولة فقط: <strong className="text-primary">Edahabia</strong> أو <strong className="text-primary">BaridiMob</strong>.</p>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <div key={m.id} className="p-3 rounded-2xl border border-gold/30 bg-gold/5">
              <div className="flex items-center gap-2 font-bold text-sm text-primary"><span className="text-xl">{m.icon}</span>{m.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{m.hint}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-muted/40 p-4 space-y-3">
          <Row label="رقم CCP" value={settings?.ccp_number ?? ""} onCopy={() => onCopy(settings!.ccp_number!)} />
          {settings?.ccp_key && <Row label="المفتاح" value={settings.ccp_key} onCopy={() => onCopy(settings.ccp_key!)} />}
          <Row label="اسم المستفيد" value={settings?.account_holder ?? ""} onCopy={() => onCopy(settings!.account_holder!)} />
          <Row label="مرجع المعاملة" value={paymentRef || "—"} onCopy={() => paymentRef && onCopy(paymentRef)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onCopyAll} className="flex-1 min-w-[160px] py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-bold text-sm">📋 نسخ كل المعلومات</button>
          <button onClick={() => settings && downloadPaymentInstructionsPDF(settings, qrDataUrl)} className="flex-1 min-w-[160px] py-2.5 rounded-full border-2 border-gold text-primary font-bold text-sm hover:bg-gold/10 transition">⬇ تنزيل التعليمات PDF</button>
        </div>
      </div>

      <div className="p-7 rounded-3xl bg-card border border-border shadow-soft text-center space-y-3">
        <h3 className="font-bold text-primary text-lg">رمز QR الذكي</h3>
        <p className="text-xs text-muted-foreground">رمز فريد لهذه المحاولة · صالح 30 دقيقة · يحتوي على المرجع والمبلغ.</p>
        <div className="inline-block p-3 rounded-2xl bg-white border-2 border-gold/40 shadow-glow">
          <canvas ref={canvasRef} />
        </div>
        {paymentRef && <div className="font-mono text-[10px] text-muted-foreground break-all px-2">{paymentRef}</div>}
        <div className="flex gap-2 pt-2">
          <button onClick={onBack} className="flex-1 py-2.5 rounded-full bg-muted text-foreground text-sm font-semibold">→ رجوع</button>
          <button onClick={onNext} className="flex-1 py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-bold text-sm">متابعة ←</button>
        </div>
      </div>
    </div>
  );
}

function StepUpload({ hasPending, rejected, qrPayload, onSubmitted, onBack }: { hasPending: boolean; rejected: string | null; qrPayload: QrPayload | null; onSubmitted: () => void; onBack: () => void }) {
  if (hasPending) {
    return (
      <div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
        <div className="text-4xl">⏳</div>
        <div className="font-bold text-amber-700 dark:text-amber-400">لديك طلب قيد المراجعة</div>
        <p className="text-sm text-muted-foreground">يرجى انتظار قرار الإدارة قبل إرسال طلب جديد.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {rejected && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-sm text-red-700 dark:text-red-400">
          <strong>تم رفض الطلب السابق:</strong> {rejected}
        </div>
      )}
      <ReceiptUpload qrPayload={qrPayload} onSubmitted={onSubmitted} />
      <button onClick={onBack} className="text-sm text-muted-foreground underline">→ رجوع إلى التعليمات</button>
    </div>
  );
}

function StepReview({ status, notes, onRetry }: { status: string; notes: string | null; onRetry: () => void }) {
  if (status === "rejected") {
    return (
      <div className="p-10 rounded-3xl border border-red-500/30 bg-red-500/5 text-center space-y-4">
        <div className="text-5xl">❌</div>
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">تم رفض طلب الدفع</h2>
        {notes && <p className="text-sm text-muted-foreground max-w-md mx-auto">{notes}</p>}
        <button onClick={onRetry} className="px-6 py-3 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow">إعادة رفع وصل جديد</button>
      </div>
    );
  }
  return (
    <div className="p-10 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl">⏳</motion.div>
      <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">طلبك قيد المراجعة</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">سيتم إشعارك فور موافقة الإدارة على طلب الدفع وتفعيل اشتراكك (عادة خلال 24 ساعة).</p>
    </div>
  );
}

function StepActivated({ endDate }: { endDate: string | null }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 rounded-3xl bg-card border border-gold/40 shadow-glow text-center space-y-4 max-w-xl mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="inline-flex w-20 h-20 rounded-full bg-green-500/15 text-green-600 items-center justify-center text-4xl">✓</motion.div>
      <h2 className="text-2xl font-bold text-primary">تم تفعيل اشتراكك بنجاح</h2>
      {endDate && <p className="text-sm text-muted-foreground">اشتراكك صالح حتى <strong className="text-primary">{new Date(endDate).toLocaleDateString("ar")}</strong></p>}
      <Link to="/dashboard" className="inline-block px-6 py-3 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow">انتقل إلى لوحة التحكم ←</Link>
    </motion.div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase opacity-70 tracking-wide">{label}</div>
        <div className="font-mono text-sm truncate">{value}</div>
      </div>
      <button onClick={onCopy} className="shrink-0 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary">نسخ</button>
    </div>
  );
}
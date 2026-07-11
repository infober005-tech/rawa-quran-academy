import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { usePaymentSettings, useMyPayments, useSubscription, getPaymentMethods } from "@/hooks/use-subscription";
import { useI18n } from "@/lib/i18n";
import { ReceiptUpload } from "./ReceiptUpload";
import { downloadPaymentInstructionsPDF } from "@/lib/payment-pdf";
import { useAuth } from "@/hooks/use-auth";
import { buildPaymentRef, buildQrToken, type QrPayload } from "@/lib/qr-payment";

export function PaymentPage() {
  const { t, lang, dir } = useI18n();
  const STEP_LABELS = [t("s.step1"), t("s.step2"), t("s.step3"), t("s.step4"), t("s.step5")];
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
      method: "Edahabia / BaridiMob",
      platform: "Rawa Quran Academy",
    };
  }, [settings, user]);
  const qrText = qrPayload ? JSON.stringify(qrPayload) : "";

  useEffect(() => {
    if (!qrText) return;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrText, { width: 320, margin: 1, color: { dark: "#5A436F", light: "#ffffff" } });
    }
    QRCode.toDataURL(qrText, { width: 480, margin: 1, color: { dark: "#5A436F", light: "#ffffff" } }).then(setQrDataUrl).catch(() => {});
  }, [qrText]);

  const copy = async (text: string, msg = t("s.copied_success")) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success(msg);
    } catch (err) {
      console.error("clipboard error", err);
      toast.error(t("s.copy_failed"));
    }
  };

  const copyAll = () => {
    if (!settings) return;
    const keyPart = settings.ccp_key ? t("s.copy_all_key_part", { key: settings.ccp_key }) : "";
    copy(
      t("s.copy_all_template", {
        ccp: settings.ccp_number ?? "",
        keyPart,
        holder: settings.account_holder ?? "",
        amount: settings.price_dzd ?? "",
        currency: settings.currency ?? "",
        ref: qrPayload?.ref ?? "—",
      })
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
    <div dir={dir} className="relative min-h-[80vh]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-gold/5" />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6 pb-28 lg:pb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-block px-4 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold tracking-wider">RAWA</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-primary">{t("s.complete_subscription")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("s.follow_steps")}</p>
        </motion.div>

        {/* Stepper */}
        <Stepper labels={STEP_LABELS} current={step} onJump={(n) => { if (n <= derivedStep) goto(n); }} />

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
            <div className="text-[10px] opacity-70">{t("s.price")}</div>
            <div className="font-bold text-gold">{settings?.price_dzd ?? "—"} {settings?.currency ?? "DZD"}</div>
          </div>
          <button onClick={copyAll} className="px-4 py-2 rounded-full bg-gold text-primary text-xs font-bold">{t("s.copy_ccp_short")}</button>
        </div>
      </div>
    </div>
  );
}

function Stepper({ labels, current, onJump }: { labels: string[]; current: number; onJump: (n: number) => void }) {
  return (
    <div className="relative">
      <div className="absolute top-5 inset-x-6 h-0.5 bg-border" />
      <div className="absolute top-5 right-6 h-0.5 bg-gradient-to-l from-gold to-primary" style={{ width: `calc(${((current - 1) / (labels.length - 1)) * 100}% - 1.5rem)` }} />
      <ol className="relative grid grid-cols-5 gap-2">
        {labels.map((label, i) => {
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
  const { t, lang } = useI18n();
  const nameField = lang === "fr" ? (settings as { subscription_name_fr?: string } | null | undefined)?.subscription_name_fr : lang === "en" ? (settings as { subscription_name_en?: string } | null | undefined)?.subscription_name_en : (settings as { subscription_name_ar?: string } | null | undefined)?.subscription_name_ar;
  const descField = lang === "fr" ? (settings as { description_fr?: string } | null | undefined)?.description_fr : lang === "en" ? (settings as { description_en?: string } | null | undefined)?.description_en : (settings as { description_ar?: string } | null | undefined)?.description_ar;
  const benefitsField = lang === "fr" ? (settings as { benefits_fr?: string[] } | null | undefined)?.benefits_fr : lang === "en" ? (settings as { benefits_en?: string[] } | null | undefined)?.benefits_en : (settings as { benefits_ar?: string[] } | null | undefined)?.benefits_ar;
  return (
    <motion.div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground p-8 shadow-glow">
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-gold/30 blur-3xl rounded-full" />
      <div className="relative grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="text-xs uppercase opacity-70 tracking-wider">{t("s.plan")}</div>
          <div className="text-3xl font-bold">{nameField ?? t("s.default_plan_name")}</div>
          <div className="text-6xl font-black text-gold leading-none">{settings?.price_dzd ?? "—"} <span className="text-lg font-normal text-primary-foreground/80">{settings?.currency ?? "DZD"}</span></div>
          <p className="text-sm opacity-90">{descField}</p>
          <div className="text-xs opacity-80">{t("s.subscription_duration", { days: settings?.subscription_duration_days ?? 30 })}</div>
        </div>
        <div className="space-y-3">
          <div className="text-xs uppercase opacity-70 tracking-wider mb-1">{t("s.benefits")}</div>
          <ul className="space-y-2 text-sm">
            {(benefitsField ?? []).map((b, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2"><span className="text-gold">✦</span>{b}</motion.li>
            ))}
          </ul>
          <div className="pt-3">
            <button onClick={onNext} className="w-full py-3 rounded-full bg-gold text-primary font-bold shadow-glow hover:scale-[1.02] transition">{t("s.continue_to_payment")}</button>
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
  const { t, lang } = useI18n();
  const PAYMENT_METHODS = getPaymentMethods(t);
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="p-7 rounded-3xl bg-card border border-border shadow-soft space-y-4">
        <h3 className="font-bold text-primary text-lg">{t("s.payment_info")}</h3>
        <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("s.accepted_methods_only", { m1: '<strong class="text-primary">Edahabia</strong>', m2: '<strong class="text-primary">BaridiMob</strong>' }) }} />
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <div key={m.id} className="p-3 rounded-2xl border border-gold/30 bg-gold/5">
              <div className="flex items-center gap-2 font-bold text-sm text-primary"><span className="text-xl">{m.icon}</span>{m.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">{m.hint}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-muted/40 p-4 space-y-3">
          <Row label={t("s.ccp_number")} value={settings?.ccp_number ?? ""} onCopy={() => onCopy(settings!.ccp_number!)} />
          {settings?.ccp_key && <Row label={t("s.key_label")} value={settings.ccp_key} onCopy={() => onCopy(settings.ccp_key!)} />}
          <Row label={t("s.account_holder_label")} value={settings?.account_holder ?? ""} onCopy={() => onCopy(settings!.account_holder!)} />
          <Row label={t("s.transaction_ref")} value={paymentRef || "—"} onCopy={() => paymentRef && onCopy(paymentRef)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onCopyAll} className="flex-1 min-w-[160px] py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-bold text-sm">{t("s.copy_all_info")}</button>
          <button
            type="button"
            onClick={async () => {
              if (!settings) return;
              try {
                await downloadPaymentInstructionsPDF(settings, qrDataUrl, paymentRef, t, lang);
                toast.success(t("s.pdf_success"));
              } catch (err) {
                console.error("pdf error", err);
                toast.error(t("s.pdf_failed"));
              }
            }}
            className="flex-1 min-w-[160px] py-2.5 rounded-full border-2 border-gold text-primary font-bold text-sm hover:bg-gold/10 transition"
          >{t("s.download_pdf")}</button>
        </div>
      </div>

      <div className="p-7 rounded-3xl bg-card border border-border shadow-soft text-center space-y-3">
        <h3 className="font-bold text-primary text-lg">{t("s.qr_smart")}</h3>
        <p className="text-xs text-muted-foreground">{t("s.qr_desc")}</p>
        <div className="inline-block p-3 rounded-2xl bg-white border-2 border-gold/40 shadow-glow">
          <canvas ref={canvasRef} className="block w-[220px] sm:w-[260px] md:w-[320px] h-auto max-w-full" />
        </div>
        {paymentRef && <div className="font-mono text-[10px] text-muted-foreground break-all px-2">{paymentRef}</div>}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 stack-actions">
          <button onClick={onBack} className="flex-1 py-2.5 rounded-full bg-muted text-foreground text-sm font-semibold">{t("s.back_arrow")}</button>
          <button onClick={onNext} className="flex-1 py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-bold text-sm">{t("s.continue")}</button>
        </div>
      </div>
    </div>
  );
}

function StepUpload({ hasPending, rejected, qrPayload, onSubmitted, onBack }: { hasPending: boolean; rejected: string | null; qrPayload: QrPayload | null; onSubmitted: () => void; onBack: () => void }) {
  const { t } = useI18n();
  if (hasPending) {
    return (
      <div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
        <div className="text-4xl">⏳</div>
        <div className="font-bold text-amber-700 dark:text-amber-400">{t("s.pending_request_title")}</div>
        <p className="text-sm text-muted-foreground">{t("s.pending_request_desc")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {rejected && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-sm text-red-700 dark:text-red-400">
          <strong>{t("s.previous_rejected")}</strong> {rejected}
        </div>
      )}
      <ReceiptUpload qrPayload={qrPayload} onSubmitted={onSubmitted} />
      <button onClick={onBack} className="text-sm text-muted-foreground underline">{t("s.back_to_instructions")}</button>
    </div>
  );
}

function StepReview({ status, notes, onRetry }: { status: string; notes: string | null; onRetry: () => void }) {
  const { t } = useI18n();
  if (status === "rejected") {
    return (
      <div className="p-10 rounded-3xl border border-red-500/30 bg-red-500/5 text-center space-y-4">
        <div className="text-5xl">❌</div>
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">{t("s.rejected_title")}</h2>
        {notes && <p className="text-sm text-muted-foreground max-w-md mx-auto">{notes}</p>}
        <button onClick={onRetry} className="px-6 py-3 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow">{t("s.reupload_receipt")}</button>
      </div>
    );
  }
  return (
    <div className="p-10 rounded-3xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl">⏳</motion.div>
      <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">{t("s.under_review_title")}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{t("s.under_review_desc")}</p>
    </div>
  );
}

function StepActivated({ endDate }: { endDate: string | null }) {
  const { t, lang } = useI18n();
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 rounded-3xl bg-card border border-gold/40 shadow-glow text-center space-y-4 max-w-xl mx-auto">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="inline-flex w-20 h-20 rounded-full bg-green-500/15 text-green-600 items-center justify-center text-4xl">✓</motion.div>
      <h2 className="text-2xl font-bold text-primary">{t("s.activated_title")}</h2>
      {endDate && <p className="text-sm text-muted-foreground">{t("s.valid_until")} <strong className="text-primary">{new Date(endDate).toLocaleDateString(lang === "ar" ? "ar" : lang)}</strong></p>}
      <Link to="/dashboard" className="inline-block px-6 py-3 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow">{t("s.go_to_dashboard")}</Link>
    </motion.div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[10px] uppercase opacity-70 tracking-wide">{label}</div>
        <div className="font-mono text-sm truncate">{value}</div>
      </div>
      <button onClick={onCopy} className="shrink-0 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-semibold text-primary">{t("s.copy")}</button>
    </div>
  );
}
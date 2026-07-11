import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentSettings } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function PaymentSettingsPanel() {
  const { t } = useI18n();
  const { data: settings } = usePaymentSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [benefits, setBenefits] = useState("");

  useEffect(() => {
    if (settings) {
      setForm({
        subscription_name_ar: settings.subscription_name_ar,
        description_ar: settings.description_ar,
        price_dzd: settings.price_dzd,
        currency: settings.currency,
        ccp_number: settings.ccp_number,
        ccp_key: settings.ccp_key ?? "",
        account_holder: settings.account_holder,
        rip_number: settings.rip_number ?? "",
        subscription_duration_days: settings.subscription_duration_days,
      });
      setBenefits(((settings.benefits_ar as string[]) ?? []).join("\n"));
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const payload = {
        subscription_name_ar: String(form.subscription_name_ar ?? ""),
        description_ar: String(form.description_ar ?? ""),
        price_dzd: Number(form.price_dzd ?? 0),
        currency: String(form.currency ?? "DZD"),
        ccp_number: String(form.ccp_number ?? ""),
        ccp_key: form.ccp_key ? String(form.ccp_key) : null,
        account_holder: String(form.account_holder ?? ""),
        rip_number: form.rip_number ? String(form.rip_number) : null,
        subscription_duration_days: Number(form.subscription_duration_days ?? 30),
        benefits_ar: benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      const { error } = await supabase.from("payment_settings").update(payload).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t("a.pay_settings.saved")); qc.invalidateQueries({ queryKey: ["payment-settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!settings) return <div className="text-muted-foreground">…</div>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold text-primary">{t("a.pay_settings.title")}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label={t("a.pay_settings.plan_name")} value={String(form.subscription_name_ar ?? "")} onChange={(v) => setForm({ ...form, subscription_name_ar: v })} />
        <Field label={t("a.pay_settings.price")} type="number" value={String(form.price_dzd ?? "")} onChange={(v) => setForm({ ...form, price_dzd: Number(v) })} />
        <Field label={t("a.pay_settings.currency")} value={String(form.currency ?? "")} onChange={(v) => setForm({ ...form, currency: v })} />
        <Field label={t("a.pay_settings.duration_days")} type="number" value={String(form.subscription_duration_days ?? "")} onChange={(v) => setForm({ ...form, subscription_duration_days: Number(v) })} />
        <Field label={t("a.pay_settings.ccp_number")} value={String(form.ccp_number ?? "")} onChange={(v) => setForm({ ...form, ccp_number: v })} />
        <Field label={t("a.pay_settings.ccp_key")} value={String(form.ccp_key ?? "")} onChange={(v) => setForm({ ...form, ccp_key: v })} />
        <Field label={t("a.pay_settings.account_holder")} value={String(form.account_holder ?? "")} onChange={(v) => setForm({ ...form, account_holder: v })} />
        <Field label={t("a.pay_settings.rip_number")} value={String(form.rip_number ?? "")} onChange={(v) => setForm({ ...form, rip_number: v })} />
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">{t("a.pay_settings.description")}</span>
        <textarea rows={2} value={String(form.description_ar ?? "")} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">{t("a.pay_settings.benefits")}</span>
        <textarea rows={7} value={benefits} onChange={(e) => setBenefits(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono" />
      </label>
      <button disabled={save.isPending} className="px-6 py-2.5 rounded-full bg-gradient-royal text-primary-foreground font-bold shadow-glow">
        {save.isPending ? t("a.pay_settings.saving") : t("a.pay_settings.save")}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="space-y-1 block">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
    </label>
  );
}
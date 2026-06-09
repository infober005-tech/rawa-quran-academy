import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LangSwitcher } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, refresh } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState({ full_name: "", phone: "", country: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name ?? "", phone: profile.phone ?? "", country: (profile as any).country ?? "", city: (profile as any).city ?? "" });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", profile!.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("✓"); await refresh(); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("Min 8 characters");
    if (pw.next !== pw.confirm) return toast.error("Passwords don't match");
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    setPwBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("✓"); setPw({ next: "", confirm: "" }); }
  };

  return (
    <DashboardShell>
      <h1 className="text-3xl font-bold text-primary mb-6">{t("nav.settings")}</h1>
      <div className="max-w-2xl space-y-6">
        <div className="p-6 rounded-2xl bg-card border border-border shadow-soft">
          <div className="text-sm text-muted-foreground mb-2">{t("nav.settings")} · Language</div>
          <LangSwitcher />
        </div>
        <form onSubmit={save} className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-3">
          <Field label={t("auth.full_name")}><input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={input} /></Field>
          <Field label={t("auth.phone")}><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={input} /></Field>
          <Field label={t("auth.country")}><input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className={input} /></Field>
          <Field label={t("auth.city")}><input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={input} /></Field>
          <button disabled={busy} className="px-6 py-2 rounded-full bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">{busy ? t("common.loading") : t("common.save")}</button>
        </form>
        <form onSubmit={changePassword} className="p-6 rounded-2xl bg-card border border-border shadow-soft space-y-3">
          <div className="text-sm font-semibold text-primary mb-1">🔒 Password</div>
          <Field label="New password"><input type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={input} autoComplete="new-password" /></Field>
          <Field label="Confirm password"><input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={input} autoComplete="new-password" /></Field>
          <button disabled={pwBusy} className="px-6 py-2 rounded-full bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">{pwBusy ? t("common.loading") : t("common.save")}</button>
        </form>
      </div>
    </DashboardShell>
  );
}

const input = "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs text-muted-foreground mb-1 block">{label}</span>{children}</label>;
}
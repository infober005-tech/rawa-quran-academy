import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LangSwitcher } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Globe, User, Lock } from "lucide-react";

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
      <div className="space-y-6">
        <DashboardHeader title={t("nav.settings")} subtitle={t("auth.full_name")} badge="Profile" />
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
          <section className="rounded-3xl bg-card/70 backdrop-blur-xl border border-border shadow-soft p-6 space-y-4">
            <header className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gold" aria-hidden />
              <h2 className="text-base font-bold text-primary">Language</h2>
            </header>
            <LangSwitcher />
          </section>
          <form onSubmit={save} aria-label="Profile information" className="rounded-3xl bg-card/70 backdrop-blur-xl border border-border shadow-soft p-6 space-y-4 lg:row-span-2">
            <header className="flex items-center gap-2">
              <User className="h-4 w-4 text-gold" aria-hidden />
              <h2 className="text-base font-bold text-primary">{t("auth.full_name")}</h2>
            </header>
            <Field label={t("auth.full_name")} id="s-name"><input id="s-name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={input} /></Field>
            <Field label={t("auth.phone")} id="s-phone"><input id="s-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={input} inputMode="tel" /></Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t("auth.country")} id="s-country"><input id="s-country" value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className={input} /></Field>
              <Field label={t("auth.city")} id="s-city"><input id="s-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={input} /></Field>
            </div>
            <button disabled={busy} className="px-6 py-2.5 min-h-11 rounded-full bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60 shadow-glow">{busy ? t("common.loading") : t("common.save")}</button>
          </form>
          <form onSubmit={changePassword} aria-label="Change password" className="rounded-3xl bg-card/70 backdrop-blur-xl border border-border shadow-soft p-6 space-y-4">
            <header className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" aria-hidden />
              <h2 className="text-base font-bold text-primary">Password</h2>
            </header>
            <Field label="New password" id="s-pw1"><input id="s-pw1" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} className={input} autoComplete="new-password" /></Field>
            <Field label="Confirm password" id="s-pw2"><input id="s-pw2" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} className={input} autoComplete="new-password" /></Field>
            <button disabled={pwBusy} className="px-6 py-2.5 min-h-11 rounded-full bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60 shadow-glow">{pwBusy ? t("common.loading") : t("common.save")}</button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}

const input = "w-full px-3 py-2.5 min-h-11 rounded-xl border border-input bg-background/70 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
function Field({ label, children, id }: { label: string; children: React.ReactNode; id?: string }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-xs font-semibold text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
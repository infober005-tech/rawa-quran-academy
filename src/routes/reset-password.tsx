import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import logoAsset from "@/assets/rawa-logo.png.asset.json";
import { toast } from "sonner";

const WEAK_PWD_PATTERNS = /pwned|leaked|compromis|breach|weak[_ ]?password|haveibeenpwned/i;

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t, dir } = useI18n();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Min 8 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const weak = WEAK_PWD_PATTERNS.test(error.message);
      toast.error(weak ? t("auth.weak_password") : error.message);
      return;
    }
    toast.success("✓");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div dir={dir} className="min-h-screen bg-hero islamic-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-soft">
        <Link to="/" className="flex items-center justify-center gap-3 mb-6">
          <img src={logoAsset.url} alt="" className="w-12 h-12 rounded-full" />
          <span className="font-bold text-primary text-lg">{t("app.name")}</span>
        </Link>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground mb-1 block">{t("auth.new_password")}</span>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm" />
          </label>
          <button disabled={busy} className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">
            {busy ? t("common.loading") : t("auth.update_password")}
          </button>
        </form>
      </div>
    </div>
  );
}
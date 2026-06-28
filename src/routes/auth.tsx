import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { LogoPremium3D } from "@/components/LogoPremium3D";

const WEAK_PWD_PATTERNS = /pwned|leaked|compromis|breach|weak[_ ]?password|haveibeenpwned/i;
function isWeakPasswordError(msg: string | undefined) {
  return !!msg && WEAK_PWD_PATTERNS.test(msg);
}
const EMAIL_UNCONFIRMED_PATTERNS = /email not confirmed|email_not_confirmed|not confirmed|confirm your email/i;
function isEmailUnconfirmedError(msg: string | undefined) {
  return !!msg && EMAIL_UNCONFIRMED_PATTERNS.test(msg);
}
const RESEND_COOLDOWN_KEY = "rawa:resend_activation_at";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول · رواء" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t, dir } = useI18n();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register" | "forgot">("login");

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  return (
    <div dir={dir} className="min-h-screen bg-hero islamic-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex flex-col items-center justify-center gap-2 mb-6">
          <LogoPremium3D size="md" intro />
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" style={{ fontFamily: "var(--font-display-ar)" }}>{t("app.name")}</div>
            <div className="text-xs text-muted-foreground">{t("app.tagline")}</div>
          </div>
        </Link>
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-soft">
          <div className="flex gap-1 p-1 bg-muted rounded-full mb-6 text-sm">
            <button onClick={() => setTab("login")} className={`flex-1 py-2 rounded-full transition ${tab === "login" ? "bg-gradient-royal text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>{t("auth.login")}</button>
            <button onClick={() => setTab("register")} className={`flex-1 py-2 rounded-full transition ${tab === "register" ? "bg-gradient-royal text-primary-foreground shadow-glow" : "text-muted-foreground"}`}>{t("auth.register")}</button>
          </div>
          {tab === "login" && <LoginForm onForgot={() => setTab("forgot")} />}
          {tab === "register" && <RegisterForm onDone={() => setTab("login")} />}
          {tab === "forgot" && <ForgotForm onBack={() => setTab("login")} />}
        </div>
      </div>
    </div>
  );
}

function GoogleBtn() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
        if (r.error) {
          toast.error(r.error.message);
          setBusy(false);
        }
      }}
      className="w-full py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
    >
      <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.97 6.97 0 0 1 5.46 12c0-.73.13-1.43.36-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
      {t("auth.google")}
    </button>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      if (isEmailUnconfirmedError(error.message)) {
        toast.error(t("auth.email_not_confirmed"), { duration: 6000 });
        setShowResend(true);
      } else {
        toast.error(error.message);
      }
      return;
    }
    // Email confirmed → check approval status. If still pending, sign out and inform.
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (uid) {
        const { data: p } = await supabase.from("profiles").select("status").eq("id", uid).maybeSingle();
        const status = (p as { status?: string } | null)?.status;
        if (status && status !== "approved") {
          await supabase.auth.signOut();
          setBusy(false);
          toast.message(t("auth.email_confirmed_pending_admin"), { duration: 7000 });
          return;
        }
      }
    } catch (err) { console.warn("status check failed", err); }
    setBusy(false);
    // Persist or clear session based on Remember-me. Default Supabase config already persists;
    // when unchecked, drop the persisted session after the tab closes by switching storage.
    try {
      if (!remember && typeof window !== "undefined") {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Move tokens to sessionStorage so they don't survive tab close.
          const keys = Object.keys(window.localStorage).filter((k) => k.startsWith("sb-"));
          for (const k of keys) {
            const v = window.localStorage.getItem(k);
            if (v) { window.sessionStorage.setItem(k, v); window.localStorage.removeItem(k); }
          }
        }
      }
    } catch { /* ignore */ }
    // Give the browser a tick to offer password saving before navigating away.
    setTimeout(() => { void navigate({ to: "/dashboard" }); }, 50);
  };

  const resendActivation = async () => {
    if (!email) { toast.error(t("auth.email")); return; }
    const last = Number(window.localStorage.getItem(RESEND_COOLDOWN_KEY) ?? 0);
    if (last && Date.now() - last < 60_000) {
      toast.message(t("auth.resend_wait"));
      return;
    }
    setResendBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth` },
      });
      if (error) { toast.error(error.message); return; }
      window.localStorage.setItem(RESEND_COOLDOWN_KEY, String(Date.now()));
      toast.success(t("auth.resend_sent"));
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" method="post" action="#" autoComplete="on">
      <GoogleBtn />
      <div className="flex items-center gap-3 my-2"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">{t("auth.or")}</span><div className="flex-1 h-px bg-border" /></div>
      <Field label={t("auth.email")}>
        <input id="login-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="username" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
      </Field>
      <Field label={t("auth.password")}>
        <input id="login-password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
      </Field>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
          {t("auth.remember_me")}
        </label>
        <button type="button" onClick={onForgot} className="text-xs text-primary hover:underline">{t("auth.forgot")}</button>
      </div>
      <button disabled={busy} className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-semibold shadow-glow disabled:opacity-60">
        {busy ? t("common.loading") : t("auth.login")}
      </button>
      <button
        type="button"
        onClick={resendActivation}
        disabled={resendBusy}
        className={`w-full text-xs ${showResend ? "text-primary" : "text-muted-foreground"} hover:underline disabled:opacity-60`}
      >
        {resendBusy ? t("common.loading") : `✉ ${t("auth.resend_activation")}`}
      </button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState({
    full_name: "", parent_name: "", email: "", phone: "",
    password: "", confirm: "", gender: "male", age: "",
    country: "", city: "", quran_level: "beginner",
  });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Passwords don't match"); return; }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: form.full_name,
          parent_name: form.parent_name,
          phone: form.phone,
          gender: form.gender,
          age: form.age,
          country: form.country,
          city: form.city,
          quran_level: form.quran_level,
          language: lang,
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(isWeakPasswordError(error.message) ? t("auth.weak_password") : error.message);
      return;
    }
    toast.success(t("auth.signup_confirm_sent"), { duration: 9000 });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3" method="post" action="#" autoComplete="on">
      <GoogleBtn />
      <div className="flex items-center gap-3 my-2"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">{t("auth.or")}</span><div className="flex-1 h-px bg-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("auth.full_name")}><input name="name" autoComplete="name" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.parent_name")}><input name="parent_name" autoComplete="off" value={form.parent_name} onChange={(e) => set("parent_name", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.email")}><input name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.phone")}><input name="tel" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.gender")}>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
            <option value="male">{t("auth.male")}</option>
            <option value="female">{t("auth.female")}</option>
          </select>
        </Field>
        <Field label={t("auth.age")}><input type="number" min={3} max={120} value={form.age} onChange={(e) => set("age", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.country")}><input autoComplete="country-name" value={form.country} onChange={(e) => set("country", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.city")}><input autoComplete="address-level2" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} /></Field>
        <Field label={t("auth.quran_level")}>
          <select value={form.quran_level} onChange={(e) => set("quran_level", e.target.value)} className={inputCls}>
            <option value="beginner">{t("auth.level.beginner")}</option>
            <option value="intermediate">{t("auth.level.intermediate")}</option>
            <option value="advanced">{t("auth.level.advanced")}</option>
          </select>
        </Field>
        <Field label={t("auth.password")}><input name="new-password" type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} autoComplete="new-password" /></Field>
        <Field label={t("auth.confirm_password")}><input name="confirm-password" type="password" required value={form.confirm} onChange={(e) => set("confirm", e.target.value)} className={inputCls} autoComplete="new-password" /></Field>
      </div>
      <button disabled={busy} className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-semibold shadow-glow disabled:opacity-60 mt-2">
        {busy ? t("common.loading") : t("auth.register")}
      </button>
    </form>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    toast.success(t("auth.reset_sent"));
    onBack();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label={t("auth.email")}><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
      <button disabled={busy} className="w-full py-2.5 rounded-xl bg-gradient-royal text-primary-foreground font-semibold disabled:opacity-60">{busy ? t("common.loading") : t("common.submit")}</button>
      <button type="button" onClick={onBack} className="w-full text-xs text-muted-foreground hover:text-foreground">← {t("auth.login")}</button>
    </form>
  );
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground mb-1 block">{label}</span>
      {children}
    </label>
  );
}
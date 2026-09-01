import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useI18n, LangSwitcher } from "@/lib/i18n";
import { toast } from "sonner";
import { LogoPremium3D } from "@/components/LogoPremium3D";
import RegisterForm from "@/features/auth/RegisterForm";

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
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · رواء | Sign in — Rawa Quran Academy" },
      { name: "description", content: "Sign in or create your Rawa Quran Academy account to join live halaqas, track memorization and manage your subscription." },
      { property: "og:title", content: "Sign in — Rawa Quran Academy" },
      { property: "og:description", content: "Access your Rawa Quran Academy account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
    <div dir={dir} className="min-h-dvh auth-bg flex items-start sm:items-center justify-center px-4 py-8 sm:py-12 overflow-x-hidden">
      <div className="w-full max-w-[620px] min-w-0">
        <div className="flex justify-center mb-4"><LangSwitcher /></div>
        <Link to="/" className="flex flex-col items-center justify-center gap-2.5 mb-6">
          <LogoPremium3D size="md" intro />
          <div className="text-center">
            <div className="text-[22px] sm:text-2xl font-bold text-primary leading-snug" style={{ fontFamily: "var(--font-display-ar)" }}>{t("app.name")}</div>
            <div className="text-[13px] text-muted-foreground mt-0.5">{t("app.tagline")}</div>
          </div>
        </Link>
        <div className="auth-card rounded-[28px] p-5 sm:p-7 md:p-8">
          <div className="auth-segment flex gap-1 p-1 mb-6 text-sm">
            <button
              type="button"
              onClick={() => setTab("login")}
              aria-pressed={tab === "login"}
              className={`flex-1 min-w-0 rounded-[20px] font-semibold transition-all duration-200 ${tab === "login" ? "auth-cta" : "text-[#5c5266] hover:text-[#241a2f]"}`}
            >{t("auth.login")}</button>
            <button
              type="button"
              onClick={() => setTab("register")}
              aria-pressed={tab === "register"}
              className={`flex-1 min-w-0 rounded-[20px] font-semibold transition-all duration-200 ${tab === "register" ? "auth-cta" : "text-[#5c5266] hover:text-[#241a2f]"}`}
            >{t("auth.register")}</button>
          </div>
          {tab === "login" && <LoginForm onForgot={() => setTab("forgot")} />}
          {tab === "register" && (
            <div className="space-y-5">
              <GoogleBtn />
              <Divider />
              <RegisterForm onDone={() => setTab("login")} />
            </div>
          )}
          {tab === "forgot" && <ForgotForm onBack={() => setTab("login")} />}
        </div>
      </div>
    </div>
  );
}

function Divider() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-[#e6e0ea]" />
      <span className="text-xs text-[#9b92a5]">{t("auth.or")}</span>
      <div className="flex-1 h-px bg-[#e6e0ea]" />
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
      className="w-full h-[50px] rounded-[15px] border border-[#e5dfea] bg-white text-[#241a2f] hover:bg-[#faf8fc] hover:border-[#d6cce2] transition-colors duration-200 text-[14.5px] font-medium flex items-center justify-center gap-2.5 disabled:opacity-60"
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
    <form onSubmit={submit} className="space-y-5" method="post" action="#" autoComplete="on">
      <GoogleBtn />
      <Divider />
      <div className="space-y-4">
        <Field label={t("auth.email")} htmlFor="login-email">
          <input id="login-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="username" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        </Field>
        <Field label={t("auth.password")} htmlFor="login-password">
          <div className="relative min-w-0">
            <input id="login-password" name="password" type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pe-12`} autoComplete="current-password" />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? t("reg.hide") : t("reg.show")}
              className="absolute end-2 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-xl text-[#776d82] hover:text-[#241a2f] transition-colors"
            >
              {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </Field>
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-[#776d82] cursor-pointer select-none">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-[#e6e0ea] accent-primary" />
          {t("auth.remember_me")}
        </label>
        <button type="button" onClick={onForgot} className="text-xs font-medium text-primary hover:underline">{t("auth.forgot")}</button>
      </div>
      <button disabled={busy} className="auth-cta w-full h-14 rounded-2xl text-[15.5px] font-bold flex items-center justify-center gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? t("common.loading") : t("auth.login")}
      </button>
      <button
        type="button"
        onClick={resendActivation}
        disabled={resendBusy}
        className={`w-full text-xs ${showResend ? "text-primary" : "text-[#9b92a5]"} hover:underline disabled:opacity-60`}
      >
        {resendBusy ? t("common.loading") : `✉ ${t("auth.resend_activation")}`}
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
    <form onSubmit={submit} className="space-y-5">
      <Field label={t("auth.email")} htmlFor="forgot-email">
        <input id="forgot-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </Field>
      <button disabled={busy} className="auth-cta w-full h-14 rounded-2xl text-[15.5px] font-bold flex items-center justify-center gap-2">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? t("common.loading") : t("common.submit")}
      </button>
      <button type="button" onClick={onBack} className="w-full text-xs text-[#776d82] hover:text-[#241a2f]">← {t("auth.login")}</button>
    </form>
  );
}

const inputCls = "auth-field";
function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="auth-label mb-2 block">{label}</label>
      {children}
    </div>
  );
}

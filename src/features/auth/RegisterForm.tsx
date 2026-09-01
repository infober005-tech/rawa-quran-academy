import { useMemo, useState } from "react";
import { Eye, EyeOff, Check, X, ChevronDown, Search, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, findCountry, type Country } from "@/lib/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const WEAK_PWD_PATTERNS = /pwned|leaked|compromis|breach|weak[_ ]?password|haveibeenpwned/i;
const isWeakPasswordError = (m?: string) => !!m && WEAK_PWD_PATTERNS.test(m);

// letters-only across scripts (Arabic + Latin) with spaces/apostrophes/hyphens
const LETTERS_ONLY = /^[\p{L}\s'’\-]+$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MONTH_INDEXES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type FormState = {
  full_name: string;
  parent_name: string;
  email: string;
  gender: "male" | "female";
  quran_level: "beginner" | "intermediate" | "advanced";
  city: string;
  country: string; // ISO
  state: string;
  dob_d: string;
  dob_m: string;
  dob_y: string;
  phone_country: string; // ISO
  phone_number: string;
  password: string;
  confirm: string;
};

const inputCls = "auth-field";

function FloatingField({
  id, label, error, ok, children,
}: { id: string; label: string; error?: string; ok?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="auth-label mb-2 block truncate">{label}</label>
      <div className="relative min-w-0">
        {children}
        {ok && !error && (
          <Check className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 text-[#2e9b68]" aria-hidden />
        )}
        {error && (
          <X className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 text-[#d84c5b]" aria-hidden />
        )}
      </div>
      {error && <div className="mt-1.5 auth-error-text">{error}</div>}
    </div>
  );
}


function passwordScore(p: string) {
  const rules = {
    len: p.length >= 8,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    num: /\d/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
  const score = Object.values(rules).filter(Boolean).length;
  const labelKeys = ["reg.pwd.vweak", "reg.pwd.weak", "reg.pwd.medium", "reg.pwd.strong", "reg.pwd.vstrong"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-emerald-700"];
  return {
    rules,
    score,
    labelKey: score === 0 ? "reg.pwd.vweak" : labelKeys[score - 1],
    color: score === 0 ? "bg-red-500" : colors[score - 1],
  };
}

function computeAge(y: number, m: number, d: number): number | null {
  if (!y || !m || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const md = today.getMonth() + 1 - m;
  if (md < 0 || (md === 0 && today.getDate() < d)) age--;
  return age;
}

function daysInMonth(y: number, m: number) {
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

function CountryPicker({
  value, onChange, label,
}: { value: string; onChange: (code: string) => void; label: string }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const c = findCountry(value);
  const cname = (x: { name_ar: string; name_en: string }) => (lang === "ar" ? x.name_ar : x.name_en);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRIES;
    return COUNTRIES.filter((x) =>
      x.name_ar.toLowerCase().includes(s) ||
      x.name_en.toLowerCase().includes(s) ||
      x.code.toLowerCase().includes(s) ||
      x.dial.includes(s)
    );
  }, [q]);
  return (
    <div className="min-w-0">
      {showLabel && <span className="auth-label mb-2 block truncate">{label}</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative min-w-0">
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(inputCls, "flex items-center gap-2 text-start pe-9")}
              aria-label={label}
            >
              <span className="text-lg shrink-0">{c?.flag ?? "🏳️"}</span>
              <span className="flex-1 min-w-0 truncate">{c ? `${cname(c)} (+${c.dial})` : label}</span>
            </button>
          </PopoverTrigger>
          <ChevronDown className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3 h-4 w-4 text-[#9b92a5]" />
        </div>

        <PopoverContent align="start" className="p-0 w-[min(92vw,360px)]">
          <div className="p-2 border-b border-border flex items-center gap-2">
            <Search className="h-4 w-4 opacity-60" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("auth.search_country")}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.map((x) => (
              <button
                key={x.code}
                type="button"
                onClick={() => { onChange(x.code); setOpen(false); setQ(""); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition text-start",
                  value === x.code && "bg-primary/10 text-primary"
                )}
              >
                <span className="text-lg">{x.flag}</span>
                <span className="flex-1 truncate">{cname(x)}</span>
                <span className="text-xs text-muted-foreground">+{x.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">{t("auth.no_results")}</div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function formatPhone(digits: string) {
  // Simple grouping: XXX XXX XXXX / XXX XXX XXX
  const d = digits.replace(/\D/g, "");
  return d.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

export default function RegisterForm({ onDone }: { onDone: () => void }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<FormState>({
    full_name: "", parent_name: "", email: "",
    gender: "male", quran_level: "beginner",
    city: "", country: DEFAULT_COUNTRY_CODE, state: "",
    dob_d: "", dob_m: "", dob_y: "",
    phone_country: DEFAULT_COUNTRY_CODE, phone_number: "",
    password: "", confirm: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [showPw, setShowPw] = useState(false);
  const [showCw, setShowCw] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const mark = (k: keyof FormState) => setTouched((s) => ({ ...s, [k]: true }));

  const country = findCountry(form.country)!;
  const phoneCountry = findCountry(form.phone_country)!;

  const now = new Date();
  const currentYear = now.getFullYear();
  const years = useMemo(() => {
    const start = currentYear - 4;
    const end = currentYear - 100;
    const arr: number[] = [];
    for (let y = start; y >= end; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const dobY = Number(form.dob_y) || 0;
  const dobM = Number(form.dob_m) || 0;
  const dobD = Number(form.dob_d) || 0;
  const age = computeAge(dobY, dobM, dobD);
  const dobValid = !!(dobY && dobM && dobD) && age !== null && age >= 4 && age <= 100;

  const pwd = passwordScore(form.password);
  const pwdStrong = pwd.score >= 4;
  const confirmOk = form.password.length > 0 && form.password === form.confirm;

  const phoneDigits = form.phone_number.replace(/\D/g, "");
  const phoneValid = phoneDigits.length >= 7 && phoneDigits.length <= 15;

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (touched.full_name && !LETTERS_ONLY.test(form.full_name.trim())) errors.full_name = t("reg.err.name_letters");
  if (touched.parent_name && form.parent_name && !LETTERS_ONLY.test(form.parent_name.trim())) errors.parent_name = t("reg.err.parent_letters");
  if (touched.city && !LETTERS_ONLY.test(form.city.trim())) errors.city = t("reg.err.city_letters");
  if (touched.email && !EMAIL_RE.test(form.email.trim())) errors.email = t("reg.err.email");
  if (touched.state && !form.state) errors.state = t("reg.err.state");
  if (touched.phone_number && !phoneValid) errors.phone_number = t("reg.err.phone");
  if ((touched.dob_y || touched.dob_m || touched.dob_d) && !dobValid) errors.dob_y = t("reg.err.dob");
  if (touched.password && !pwdStrong) errors.password = t("reg.err.password");
  if (touched.confirm && !confirmOk) errors.confirm = t("reg.pwd.nomatch");

  const canSubmit =
    LETTERS_ONLY.test(form.full_name.trim()) &&
    (form.parent_name === "" || LETTERS_ONLY.test(form.parent_name.trim())) &&
    LETTERS_ONLY.test(form.city.trim()) &&
    EMAIL_RE.test(form.email.trim()) &&
    !!form.country && !!form.state && !!form.gender && !!form.quran_level &&
    dobValid && phoneValid && pwdStrong && confirmOk;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      full_name: true, parent_name: true, city: true, email: true,
      state: true, phone_number: true, dob_y: true, dob_m: true, dob_d: true,
      password: true, confirm: true,
    });
    if (!canSubmit) { toast.error(t("reg.err.fix")); return; }

    const dob = `${form.dob_y}-${String(form.dob_m).padStart(2, "0")}-${String(form.dob_d).padStart(2, "0")}`;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: form.full_name.trim(),
          parent_name: form.parent_name.trim() || null,
          phone: `+${phoneCountry.dial}${phoneDigits}`,
          gender: form.gender,
          age: String(age ?? ""),
          country: country.name_ar,
          city: form.city.trim(),
          quran_level: form.quran_level,
          language: lang,
          date_of_birth: dob,
          state: form.state,
          phone_country: phoneCountry.code,
          phone_code: phoneCountry.dial,
          phone_number: phoneDigits,
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

  const maxDay = daysInMonth(dobY, dobM);

  return (
    <form onSubmit={submit} className="space-y-4" method="post" autoComplete="on">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
        {/* Full name */}
        <FloatingField id="full_name" label={t("auth.full_name")} error={errors.full_name} ok={!!form.full_name && !errors.full_name}>
          <input id="full_name" name="name" autoComplete="name" required
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            onBlur={() => mark("full_name")}
            className={inputCls} />
        </FloatingField>

        {/* Parent name */}
        <FloatingField id="parent_name" label={t("auth.parent_name")} error={errors.parent_name} ok={!!form.parent_name && !errors.parent_name}>
          <input id="parent_name" name="parent_name" autoComplete="off"
            value={form.parent_name}
            onChange={(e) => set("parent_name", e.target.value)}
            onBlur={() => mark("parent_name")}
            className={inputCls} />
        </FloatingField>

        {/* Email */}
        <FloatingField id="email" label={t("auth.email")} error={errors.email} ok={!!form.email && !errors.email}>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => mark("email")}
            className={inputCls} />
        </FloatingField>

        {/* Gender */}
        <FloatingField id="gender" label={t("auth.gender")}>
          <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value as "male" | "female")} className={inputCls}>
            <option value="male">{t("auth.male")}</option>
            <option value="female">{t("auth.female")}</option>
          </select>
        </FloatingField>

        {/* DOB */}
        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground min-w-0">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t("reg.dob")}</span>
            {age !== null && dobValid && <span className="ms-auto shrink-0 text-primary font-semibold">{t("reg.age", { n: age })}</span>}
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-0">
            <select
              aria-label={t("reg.day")}
              value={form.dob_d}
              onChange={(e) => { set("dob_d", e.target.value); mark("dob_d"); }}
              className={cn(inputCls, "text-center pt-0 pb-0")}
            >
              <option value="">{t("reg.day")}</option>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              aria-label={t("reg.month")}
              value={form.dob_m}
              onChange={(e) => { set("dob_m", e.target.value); mark("dob_m"); }}
              className={cn(inputCls, "text-center pt-0 pb-0")}
            >
              <option value="">{t("reg.month")}</option>
              {MONTH_INDEXES.map((m) => (
                <option key={m} value={m}>{t(`reg.month.${m}`)}</option>
              ))}
            </select>
            <select
              aria-label={t("reg.year")}
              value={form.dob_y}
              onChange={(e) => { set("dob_y", e.target.value); mark("dob_y"); }}
              className={cn(inputCls, "text-center pt-0 pb-0")}
            >
              <option value="">{t("reg.year")}</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {errors.dob_y && <div className="mt-1 text-[11px] text-red-500 leading-snug">{errors.dob_y}</div>}
        </div>

        {/* Country */}
        <div>
          <CountryPicker value={form.country} onChange={(code) => { set("country", code); set("state", ""); }} label={t("auth.country")} />
        </div>

        {/* State */}
        <FloatingField id="state" label={t("reg.state")} error={errors.state} ok={!!form.state}>
          <select
            id="state"
            disabled={!country || country.states.length <= 1}
            value={form.state}
            onChange={(e) => { set("state", e.target.value); mark("state"); }}
            className={cn(inputCls, "disabled:opacity-60")}
          >
            <option value="">{country.states.length > 1 ? t("reg.choose") : t("reg.na")}</option>
            {country.states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </FloatingField>

        {/* City */}
        <FloatingField id="city" label={t("auth.city")} error={errors.city} ok={!!form.city && !errors.city}>
          <input id="city" name="city" autoComplete="address-level2" required
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            onBlur={() => mark("city")}
            className={inputCls} />
        </FloatingField>

        {/* Quran level */}
        <FloatingField id="quran_level" label={t("auth.quran_level")}>
          <select id="quran_level" value={form.quran_level} onChange={(e) => set("quran_level", e.target.value as FormState["quran_level"])} className={inputCls}>
            <option value="beginner">{t("auth.level.beginner")}</option>
            <option value="intermediate">{t("auth.level.intermediate")}</option>
            <option value="advanced">{t("auth.level.advanced")}</option>
          </select>
        </FloatingField>

        {/* Phone with country dial */}
        <div className="sm:col-span-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("auth.phone")}</div>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)] gap-2 min-w-0">
            <div className="min-w-0">
              <CountryPicker value={form.phone_country} onChange={(code) => set("phone_country", code)} label={t("auth.country")} />
            </div>
            <div
              dir="ltr"
              className="flex items-stretch h-12 min-w-0 overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-primary/40"
            >
              <span className="shrink-0 px-2.5 flex items-center text-sm text-muted-foreground border-e border-input font-mono">
                +{phoneCountry.dial}
              </span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                dir="ltr"
                value={formatPhone(form.phone_number)}
                onChange={(e) => set("phone_number", e.target.value.replace(/\D/g, ""))}
                onBlur={() => mark("phone_number")}
                placeholder="6 12 34 56 78"
                className="flex-1 min-w-0 h-full px-2.5 bg-transparent outline-none text-sm sm:text-base font-mono"
              />
              {form.phone_number && (
                phoneValid
                  ? <Check className="mx-2 self-center shrink-0 h-4 w-4 text-emerald-500" />
                  : <X className="mx-2 self-center shrink-0 h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          {errors.phone_number && <div className="mt-1 text-[11px] text-red-500 leading-snug">{errors.phone_number}</div>}
        </div>

        {/* Password */}
        <div className="sm:col-span-2">
          <FloatingField id="password" label={t("auth.password")} error={errors.password} ok={form.password.length > 0 && pwdStrong}>
            <div className="relative">
              <input
                id="password"
                name="new-password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                onBlur={() => mark("password")}
                className={cn(inputCls, "pe-10")}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showPw ? t("reg.hide") : t("reg.show")}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FloatingField>
          {form.password && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={cn("h-1.5 flex-1 rounded-full transition", i < pwd.score ? pwd.color : "bg-muted")} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: pwd.score >= 4 ? "rgb(5,150,105)" : pwd.score >= 3 ? "rgb(202,138,4)" : "rgb(220,38,38)" }}>{t(pwd.labelKey)}</span>
              </div>
              <ul className="grid grid-cols-2 gap-1 text-[11px]">
                {["len", "upper", "lower", "num", "special"].map((k) => {
                  const r = { k, label: t(`reg.pwd.${k}`) };
                  const ok = (pwd.rules as Record<string, boolean>)[r.k];
                  return (
                    <li key={r.k} className={cn("flex items-center gap-1.5", ok ? "text-emerald-600" : "text-muted-foreground")}>
                      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-60" />}
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="sm:col-span-2">
          <FloatingField id="confirm" label={t("auth.confirm_password")} error={errors.confirm} ok={confirmOk}>
            <div className="relative">
              <input
                id="confirm"
                name="confirm-password"
                type={showCw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => set("confirm", e.target.value)}
                onBlur={() => mark("confirm")}
                className={cn(inputCls, "pe-10")}
              />
              <button type="button" onClick={() => setShowCw((v) => !v)}
                className="absolute end-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label={showCw ? t("reg.hide") : t("reg.show")}>
                {showCw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FloatingField>
          {form.confirm && (
            <div className={cn("mt-1 text-[11px] flex items-center gap-1", confirmOk ? "text-emerald-600" : "text-red-500")}>
              {confirmOk ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {confirmOk ? t("reg.pwd.match") : t("reg.pwd.nomatch")}
            </div>
          )}
        </div>
      </div>

      <button
        disabled={busy || !canSubmit}
        className="w-full py-3 rounded-xl bg-gradient-royal text-primary-foreground font-semibold shadow-glow disabled:opacity-60 transition"
      >
        {busy ? t("common.loading") : t("auth.register")}
      </button>
    </form>
  );
}
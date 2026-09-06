import { useMemo, useState } from "react";
import { Eye, EyeOff, Check, X, ChevronDown, Search, Calendar, Loader2, ArrowLeft, ArrowRight, Mail, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Lang } from "@/lib/i18n";
import { toast } from "sonner";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, findCountry } from "@/lib/countries";
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
      {error && <div className="mt-1.5 auth-error-text" role="alert">{error}</div>}
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
  value, onChange, label, showLabel = true,
}: { value: string; onChange: (code: string) => void; label: string; showLabel?: boolean }) {
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

const STEP_KEYS = ["reg.wiz.step1", "reg.wiz.step2", "reg.wiz.step3", "reg.wiz.step4", "reg.wiz.step5"];
const TOTAL_STEPS = 5;

function StepIndicator({ step }: { step: number }) {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 sm:gap-2" role="list">
        {STEP_KEYS.map((k, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={k} role="listitem" className="flex-1 min-w-0">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  done ? "bg-[linear-gradient(90deg,#d4af37,#e6c765)]" : active ? "bg-[linear-gradient(90deg,#6f4aa8,#8a67b8)]" : "bg-[#e9e3f0]"
                )}
              />
              <div
                className={cn(
                  "mt-2 hidden truncate text-[11px] font-medium sm:block",
                  done ? "text-[#a8862b]" : active ? "text-[#6f4aa8]" : "text-[#a49bad]"
                )}
              >
                {t(k)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-[#6f4aa8]">
          {t("reg.wiz.step_of", { n: step + 1, total: TOTAL_STEPS })}
        </span>
        <span className="truncate text-[11.5px] text-[#776d82] sm:hidden">{t(STEP_KEYS[step])}</span>
      </div>
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-[19px] font-bold leading-snug text-[#241a2f] sm:text-[21px]">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[#776d82]">{sub}</p>
    </div>
  );
}

const LANG_OPTIONS: Array<{ code: Lang; native: string; latin: string }> = [
  { code: "ar", native: "العربية", latin: "Arabic" },
  { code: "fr", native: "Français", latin: "French" },
  { code: "en", native: "English", latin: "English" },
];

export default function RegisterForm({ onDone }: { onDone: () => void }) {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
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

  const personalOk =
    LETTERS_ONLY.test(form.full_name.trim()) &&
    (form.parent_name === "" || LETTERS_ONLY.test(form.parent_name.trim())) &&
    LETTERS_ONLY.test(form.city.trim()) &&
    !!form.country && !!form.state && !!form.quran_level &&
    dobValid && phoneValid;

  const accountOk = EMAIL_RE.test(form.email.trim()) && pwdStrong && confirmOk;

  const canSubmit = personalOk && accountOk && !!form.gender;

  const goNext = () => {
    if (step === 2) {
      setTouched((s) => ({ ...s, full_name: true, parent_name: true, city: true, state: true, phone_number: true, dob_y: true, dob_m: true, dob_d: true }));
      if (!personalOk) { toast.error(t("reg.err.fix")); return; }
    }
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) { goNext(); return; }
    setTouched({
      full_name: true, parent_name: true, city: true, email: true,
      state: true, phone_number: true, dob_y: true, dob_m: true, dob_d: true,
      password: true, confirm: true,
    });
    if (!canSubmit) {
      toast.error(t("reg.err.fix"));
      if (!personalOk) setStep(2);
      return;
    }

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
    setStep(4);
  };

  const maxDay = daysInMonth(dobY, dobM);
  const BackIcon = lang === "ar" ? ArrowRight : ArrowLeft;
  const NextIcon = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <form onSubmit={submit} className="min-w-0" method="post" autoComplete="on" noValidate>
      <StepIndicator step={step} />

      {/* ── Step 1 · Language ─────────────────────────────── */}
      {step === 0 && (
        <div className="auth-step-panel">
          <StepHeading title={t("reg.wiz.lang_title")} sub={t("reg.wiz.lang_sub")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LANG_OPTIONS.map((o) => {
              const active = lang === o.code;
              return (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => setLang(o.code)}
                  aria-pressed={active}
                  className={cn("auth-tile min-h-[92px] px-4 py-4 text-start", active && "auth-tile-active")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[16px] font-bold text-[#241a2f]">{o.native}</span>
                    {active && <Check className="h-4 w-4 shrink-0 text-[#a8862b]" aria-hidden />}
                  </div>
                  <div className="mt-1 text-[12px] text-[#776d82]">{o.latin}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 2 · Academy section (gender) ─────────────── */}
      {step === 1 && (
        <div className="auth-step-panel">
          <StepHeading title={t("reg.wiz.section_title")} sub={t("reg.wiz.section_sub")} />
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {([
              { v: "male" as const, title: t("reg.wiz.male_title"), sub: t("reg.wiz.male_sub"), tint: "linear-gradient(150deg, rgb(58 36 92 / 0.94), rgb(34 21 58 / 0.96))", fg: "#f6f1ff", subFg: "#cdbfe6" },
              { v: "female" as const, title: t("reg.wiz.female_title"), sub: t("reg.wiz.female_sub"), tint: "linear-gradient(150deg, rgb(247 240 252 / 0.96), rgb(240 231 248 / 0.96))", fg: "#38265a", subFg: "#7a6a92" },
            ]).map((c) => {
              const active = form.gender === c.v;
              return (
                <button
                  key={c.v}
                  type="button"
                  onClick={() => set("gender", c.v)}
                  aria-pressed={active}
                  className={cn("auth-tile auth-gold-rim relative min-h-[148px] overflow-hidden p-5 text-start", active && "auth-tile-active")}
                  style={{ backgroundImage: c.tint }}
                >
                  <span className="islamic-pattern pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden />
                  <span className="relative flex h-full flex-col">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[17px] font-bold leading-snug" style={{ color: c.fg, fontFamily: "var(--font-display-ar)" }}>{c.title}</span>
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition",
                          active ? "border-[#d4af37] bg-[#d4af37] text-[#2a1b0a]" : "border-current/30 opacity-50"
                        )}
                        style={{ color: c.fg }}
                        aria-hidden
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </span>
                    <span className="mt-2 text-[12.5px] leading-relaxed" style={{ color: c.subFg }}>{c.sub}</span>
                    {active && (
                      <span className="mt-auto pt-3 text-[11px] font-semibold tracking-wide text-[#d4af37]">{t("reg.wiz.selected")}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3 · Personal information ─────────────────── */}
      {step === 2 && (
        <div className="auth-step-panel">
          <StepHeading title={t("reg.wiz.personal_title")} sub={t("reg.wiz.personal_sub")} />
          <div className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-y-5">
            <FloatingField id="full_name" label={t("auth.full_name")} error={errors.full_name} ok={!!form.full_name && !errors.full_name}>
              <input id="full_name" name="name" autoComplete="name" required
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                onBlur={() => mark("full_name")}
                className={cn(inputCls, "pe-10", errors.full_name && "auth-field-error")} />
            </FloatingField>

            <FloatingField id="parent_name" label={t("auth.parent_name")} error={errors.parent_name} ok={!!form.parent_name && !errors.parent_name}>
              <input id="parent_name" name="parent_name" autoComplete="off"
                value={form.parent_name}
                onChange={(e) => set("parent_name", e.target.value)}
                onBlur={() => mark("parent_name")}
                className={cn(inputCls, "pe-10", errors.parent_name && "auth-field-error")} />
            </FloatingField>

            {/* DOB */}
            <div className="min-w-0 sm:col-span-2">
              <div className="mb-2 flex min-w-0 items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-[#9b92a5]" aria-hidden />
                <span className="auth-label truncate">{t("reg.dob")}</span>
                {age !== null && dobValid && <span className="ms-auto shrink-0 text-xs font-semibold text-primary">{t("reg.age", { n: age })}</span>}
              </div>
              <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
                <select
                  aria-label={t("reg.day")}
                  value={form.dob_d}
                  onChange={(e) => { set("dob_d", e.target.value); mark("dob_d"); }}
                  className={cn(inputCls, "auth-select ps-3", errors.dob_y && "auth-field-error")}
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
                  className={cn(inputCls, "auth-select ps-3", errors.dob_y && "auth-field-error")}
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
                  className={cn(inputCls, "auth-select ps-3", errors.dob_y && "auth-field-error")}
                >
                  <option value="">{t("reg.year")}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              {errors.dob_y && <div className="mt-1.5 auth-error-text" role="alert">{errors.dob_y}</div>}
            </div>

            <CountryPicker value={form.country} onChange={(code) => { set("country", code); set("state", ""); }} label={t("auth.country")} />

            <FloatingField id="state" label={t("reg.state")} error={errors.state}>
              <select
                id="state"
                disabled={!country || country.states.length <= 1}
                value={form.state}
                onChange={(e) => { set("state", e.target.value); mark("state"); }}
                className={cn(inputCls, "auth-select", errors.state && "auth-field-error")}
              >
                <option value="">{country.states.length > 1 ? t("reg.choose") : t("reg.na")}</option>
                {country.states.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FloatingField>

            <FloatingField id="city" label={t("auth.city")} error={errors.city} ok={!!form.city && !errors.city}>
              <input id="city" name="city" autoComplete="address-level2" required
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                onBlur={() => mark("city")}
                className={cn(inputCls, "pe-10", errors.city && "auth-field-error")} />
            </FloatingField>

            <FloatingField id="quran_level" label={t("auth.quran_level")}>
              <select id="quran_level" value={form.quran_level} onChange={(e) => set("quran_level", e.target.value as FormState["quran_level"])} className={cn(inputCls, "auth-select")}>
                <option value="beginner">{t("auth.level.beginner")}</option>
                <option value="intermediate">{t("auth.level.intermediate")}</option>
                <option value="advanced">{t("auth.level.advanced")}</option>
              </select>
            </FloatingField>

            {/* Phone with country dial */}
            <div className="min-w-0 sm:col-span-2">
              <div className="auth-label mb-2">{t("auth.phone")}</div>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3">
                <div className="min-w-0">
                  <CountryPicker value={form.phone_country} onChange={(code) => set("phone_country", code)} label={t("auth.country")} showLabel={false} />
                </div>
                <div
                  dir="ltr"
                  className={cn("auth-field flex items-stretch overflow-hidden px-0 focus-within:border-[#6f4aa8] focus-within:shadow-[0_0_0_3px_rgb(111_74_168_/_0.1)]", errors.phone_number && "auth-field-error")}
                >
                  <span className="flex shrink-0 items-center border-e border-[#e6e0ea] bg-[#f5f2f9] px-3 font-mono text-sm text-[#776d82]">
                    +{phoneCountry.dial}
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    dir="ltr"
                    aria-label={t("auth.phone")}
                    value={formatPhone(form.phone_number)}
                    onChange={(e) => set("phone_number", e.target.value.replace(/\D/g, ""))}
                    onBlur={() => mark("phone_number")}
                    placeholder="6 12 34 56 78"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-[15px] outline-none"
                  />
                  {form.phone_number && (
                    phoneValid
                      ? <Check className="mx-3 h-4 w-4 shrink-0 self-center text-[#2e9b68]" />
                      : <X className="mx-3 h-4 w-4 shrink-0 self-center text-[#d84c5b]" />
                  )}
                </div>
              </div>
              {errors.phone_number && <div className="mt-1.5 auth-error-text" role="alert">{errors.phone_number}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4 · Account information ──────────────────── */}
      {step === 3 && (
        <div className="auth-step-panel">
          <StepHeading title={t("reg.wiz.account_title")} sub={t("reg.wiz.account_sub")} />
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-5">
            <FloatingField id="email" label={t("auth.email")} error={errors.email} ok={!!form.email && !errors.email}>
              <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => mark("email")}
                className={cn(inputCls, "pe-10", errors.email && "auth-field-error")} />
            </FloatingField>

            <div>
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
                    className={cn(inputCls, "pe-12", errors.password && "auth-field-error")}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute end-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[#776d82] transition-colors hover:text-[#241a2f]"
                    aria-label={showPw ? t("reg.hide") : t("reg.show")}>
                    {showPw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </FloatingField>
              {form.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className={cn("h-1.5 flex-1 rounded-full transition", i < pwd.score ? pwd.color : "bg-[#eee9f3]")} />
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
                        <li key={r.k} className={cn("flex items-center gap-1.5", ok ? "text-[#2e9b68]" : "text-[#9b92a5]")}>
                          {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-60" />}
                          {r.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div>
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
                    className={cn(inputCls, "pe-12", errors.confirm && "auth-field-error")}
                  />
                  <button type="button" onClick={() => setShowCw((v) => !v)}
                    className="absolute end-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[#776d82] transition-colors hover:text-[#241a2f]"
                    aria-label={showCw ? t("reg.hide") : t("reg.show")}>
                    {showCw ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </FloatingField>
              {form.confirm && (
                <div className={cn("mt-1.5 flex items-center gap-1.5 text-xs", confirmOk ? "text-[#2e9b68]" : "text-[#d84c5b]")}>
                  {confirmOk ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {confirmOk ? t("reg.pwd.match") : t("reg.pwd.nomatch")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5 · Confirmation ─────────────────────────── */}
      {step === 4 && (
        <div className="auth-step-panel text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[linear-gradient(135deg,#6f4aa8,#8a67b8)] shadow-[0_16px_40px_-18px_rgb(111_74_168_/_0.8)]">
            <Mail className="h-7 w-7 text-white" aria-hidden />
          </div>
          <h2 className="mt-4 text-[20px] font-bold text-[#241a2f]">{t("reg.wiz.done_title")}</h2>
          <p className="mx-auto mt-2 max-w-[42ch] text-[13.5px] leading-relaxed text-[#776d82]">{t("reg.wiz.done_sub")}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#a8862b]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("auth.pending_approval")}
          </div>
          <button
            type="button"
            onClick={onDone}
            className="auth-cta mt-6 flex h-14 w-full items-center justify-center rounded-2xl text-[15.5px] font-bold"
          >
            {t("reg.wiz.done_cta")}
          </button>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────── */}
      {step < 4 && (
        <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex h-13 min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#e5dfea] bg-white px-5 text-[14.5px] font-semibold text-[#5c5266] transition-colors hover:border-[#d6cce2] hover:bg-[#faf8fc] sm:w-auto"
            >
              <BackIcon className="h-4 w-4" aria-hidden />
              {t("reg.wiz.back")}
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="auth-cta flex h-14 w-full flex-1 items-center justify-center gap-2 rounded-2xl text-[15.5px] font-bold"
            >
              {t("reg.wiz.next")}
              <NextIcon className="h-4 w-4" aria-hidden />
            </button>
          ) : (
            <button
              disabled={busy || !canSubmit}
              className="auth-cta flex h-14 w-full flex-1 items-center justify-center gap-2 rounded-2xl text-[15.5px] font-bold"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {busy ? t("common.loading") : t("auth.register")}
            </button>
          )}
        </div>
      )}
    </form>
  );
}

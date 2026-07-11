import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import ar from "./i18n/ar";
import fr from "./i18n/fr";
import en from "./i18n/en";

export type Lang = "ar" | "fr" | "en";

const DICT: Record<Lang, Record<string, string>> = { ar, fr, en };


type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: string, vars?: Record<string, string | number>) => string;
  dir: "rtl" | "ltr";
};
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("rawa.lang") as Lang | null) ?? "ar";
    setLangState(saved);
  }, []);

  // Sync language from user's profile after login and on auth state changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const applyFromProfile = async (uid: string | undefined) => {
      if (!uid) return;
      const { data } = await supabase.from("profiles").select("language").eq("id", uid).maybeSingle();
      const remote = (data as { language?: Lang } | null)?.language;
      if (!cancelled && remote && (remote === "ar" || remote === "fr" || remote === "en")) {
        setLangState(remote);
        localStorage.setItem("rawa.lang", remote);
      }
    };
    supabase.auth.getSession().then(({ data }) => applyFromProfile(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => applyFromProfile(s?.user?.id));
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("rawa.lang", l);
    // Persist to profile if signed in (fire-and-forget).
    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (uid) await supabase.from("profiles").update({ language: l }).eq("id", uid);
      } catch { /* ignore */ }
    })();
  };

  const t = (k: string, vars?: Record<string, string | number>) => {
    let s = DICT[lang][k] ?? DICT.ar[k] ?? k;
    if (vars) for (const [key, val] of Object.entries(vars)) s = s.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(val));
    return s;
  };
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

// Alias matching common i18n libraries
export function useTranslation() {
  return useI18n();
}

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div role="group" aria-label="Language" className="inline-flex rounded-full border border-border bg-card/60 p-0.5 text-xs">
      {(["ar", "fr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={l === "ar" ? "العربية" : l === "fr" ? "Français" : "English"}
          className={`px-3 py-1.5 min-h-9 min-w-9 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
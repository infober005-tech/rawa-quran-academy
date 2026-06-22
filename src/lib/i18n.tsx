import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import ar from "./i18n/ar";
import fr from "./i18n/fr";
import en from "./i18n/en";

export type Lang = "ar" | "fr" | "en";

const DICT: Record<Lang, Record<string, string>> = { ar, fr, en };


type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string; dir: "rtl" | "ltr" };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("rawa.lang") as Lang | null) ?? "ar";
    setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("rawa.lang", l);
  };

  const t = (k: string) => DICT[lang][k] ?? DICT.ar[k] ?? k;
  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
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
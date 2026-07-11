import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import ar from "@/lib/i18n/ar";
import fr from "@/lib/i18n/fr";
import en from "@/lib/i18n/en";

interface State { error: Error | null }

// Class component can't use hooks; read language from localStorage/documentElement directly.
function pickDict() {
  const lang = (typeof document !== "undefined" && document.documentElement.lang) as "ar" | "fr" | "en" | "";
  if (lang === "en") return en;
  if (lang === "fr") return fr;
  return ar;
}

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportLovableError(error, { boundary: "react_error_boundary", componentStack: info.componentStack });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    const d = pickDict();
    const dir = (typeof document !== "undefined" && document.documentElement.dir) || "rtl";
    return (
      <div dir={dir as "rtl" | "ltr"} className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center rounded-3xl border border-destructive/30 bg-card p-8 shadow-soft">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-primary mb-2">{d["common.something_wrong"]}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {d["err.generic"]}
          </p>
          <button
            onClick={this.reset}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-gradient-royal text-primary-foreground font-semibold shadow-glow"
          >
            {d["common.retry"]}
          </button>
        </div>
      </div>
    );
  }
}

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface State { error: Error | null }

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
    return (
      <div dir="rtl" className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center rounded-3xl border border-destructive/30 bg-card p-8 shadow-soft">
          <div className="text-5xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-primary mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-sm text-muted-foreground mb-5">
            نعتذر، حصل خلل في تحميل هذا الجزء. يمكنك المحاولة مجدداً.
          </p>
          <button
            onClick={this.reset}
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-gradient-royal text-primary-foreground font-semibold shadow-glow"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
}

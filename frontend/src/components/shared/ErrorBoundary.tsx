import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Catches any render-time exception in the tree
 * and shows a recoverable fallback instead of a blank white page.
 *
 * Per audit recommendation (Batch 1 P0): place at App.tsx root, and optionally
 * wrap risky surfaces (e.g. pages that use recharts or the dashboard N+1 fetch).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Server-side logging hook would go here. For now, console.error.
    console.error("[ErrorBoundary] Uncaught render error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4 font-sans">
          <div className="max-w-md w-full rounded-2xl border border-surface-700/60 bg-surface-900/60 p-6 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-100 mb-1">
              Terjadi kesalahan
            </h1>
            <p className="text-sm text-slate-400 mb-5">
              Halaman gagal dirender. Coba muat ulang, atau kembali ke dashboard.
            </p>
            {this.state.error && (
              <pre className="text-[11px] text-slate-500 bg-surface-800/60 rounded-lg p-3 mb-5 overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl border border-surface-700 text-slate-200 text-sm font-semibold hover:bg-surface-800 transition-colors"
              >
                Coba lagi
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-xl bg-brand-500 text-surface-950 text-sm font-bold hover:bg-brand-400 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Muat ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

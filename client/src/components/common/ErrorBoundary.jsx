import React from "react";

/**
 * Top-level React Error Boundary for Nivora Care HMS.
 * Prevents white-screen crashes and presents a user-friendly recovery UI.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[Nivora Care ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">
                  Nivora Care HMS — Application Error
                </h1>
                <p className="text-sm text-slate-400">
                  An unexpected error occurred while rendering this view.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 text-sm">
              <p className="text-rose-400 font-medium font-mono break-words">
                {this.state.error?.message || "Unknown error"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={this.handleReload}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-cyan-900/30"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium text-sm transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-medium text-sm transition-colors"
              >
                Return to Login
              </button>
            </div>

            {this.state.errorInfo && (
              <details className="mt-4 text-xs text-slate-400">
                <summary className="cursor-pointer hover:text-slate-200 select-none">
                  View Component Stack Details
                </summary>
                <pre className="mt-2 p-3 bg-slate-950/60 rounded-lg overflow-x-auto text-[11px] text-slate-400 border border-slate-800/80">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

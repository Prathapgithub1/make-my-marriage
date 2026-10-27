import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log unexpected errors safely
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf3] text-[#1a1c18] p-6 text-center antialiased">
          <div className="max-w-md w-full bg-white border border-[#d8c2bb]/50 rounded-2xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(37,39,35,0.03)]">
            <div className="w-12 h-12 rounded-xl bg-[#8a4b35]/10 border border-[#8a4b35]/20 mx-auto flex items-center justify-center text-[#8a4b35] font-serif font-bold text-xl mb-4">
              M
            </div>

            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f4f4ed] text-[#8a4b35] text-xs font-semibold mb-3 border border-[#d8c2bb]/40">
              Application Notice
            </span>

            <h1 className="font-serif text-2xl sm:text-3xl text-[#1a1c18] font-medium tracking-tight mb-2">
              Something went wrong
            </h1>

            <p className="text-sm text-[#53433e] leading-relaxed mb-6">
              We encountered an unexpected error while preparing your experience. Please try
              reloading the page.
            </p>

            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <div className="mb-6 p-3 rounded-lg bg-[#f4f4ed] border border-[#d8c2bb]/40 text-left text-xs font-mono text-[#53433e] overflow-x-auto max-h-32">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button type="button" onClick={this.handleReset} className="button w-full sm:w-auto">
                Reload Page
              </button>
              <a href="/" className="button button-secondary w-full sm:w-auto">
                Return to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

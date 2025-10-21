import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: unknown;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("ErrorBoundary caught an error:", { error, errorInfo });
  }

  handleRetry = () => {
    // Full reload resolves most dynamic import failures
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full border border-border rounded-lg p-6 bg-card shadow-sm text-center">
            <h1 className="text-xl font-semibold mb-2 text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn’t load part of the app (likely a network hiccup). Please try again.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;

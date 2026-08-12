import { Component } from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="rounded-full bg-danger-5 p-3">
            <svg
              className="h-6 w-6 text-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-black-65">
            Ocurrió un error en el Dashboard
          </p>
          <p className="max-w-xs text-xs text-black-25">
            {this.state.error?.message ?? "Error inesperado"}
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded bg-primary px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-85"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

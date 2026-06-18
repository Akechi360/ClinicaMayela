import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackText?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 glass-panel border border-red-500/10 rounded-2xl flex flex-col items-center justify-center text-center gap-3 w-full font-sans">
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
            {this.props.fallbackText || 'Error al cargar este componente'}
          </span>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 border border-satin-copper/20 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-medium hover:text-slate-dark bg-pure-white/40 cursor-pointer transition-all"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

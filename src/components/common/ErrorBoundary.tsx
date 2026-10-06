import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 rounded-2xl bg-[#0b1328] border-2 border-rose-500/50 shadow-2xl text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-white">
            {this.props.fallbackTitle || 'Não foi possível carregar esta área'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ocorreu uma inconsistência temporária ao renderizar os dados desta tela. Clique abaixo para recarregar com segurança.
          </p>
          {this.state.error?.message && (
            <p className="text-[10px] font-mono text-rose-300 bg-black/40 p-2 rounded-lg border border-rose-900/40 max-h-24 overflow-y-auto text-left">
              {this.state.error.message}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recarregar Tela</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

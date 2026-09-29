import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught wine cellar error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.removeItem('wijnkelder_wines_v2');
      localStorage.removeItem('wijnkelder_cabinet_capacity_v2');
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset storage:', e);
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-300">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-stone-100">
                Oeps, er ging iets mis bij het laden
              </h1>
              <p className="text-sm text-stone-400">
                Geen zorgen, je data kan veilig hersteld worden. Probeer de pagina te herladen of herstel de standaardgegevens.
              </p>
              {this.state.error && (
                <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-xl text-left text-xs font-mono text-rose-400 overflow-x-auto max-h-28">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-800 hover:bg-rose-700 text-white font-medium text-sm rounded-xl transition shadow-lg shadow-rose-950/50"
              >
                <RefreshCw className="w-4 h-4" />
                Herladen
              </button>

              <button
                onClick={this.handleResetData}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-medium text-sm rounded-xl border border-stone-700 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Data Herstellen
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * ContentErrorBoundary Component
 * Catches errors in content rendering and provides a fallback UI
 */
class ContentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (could be sent to error tracking service)
    console.error('ContentErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { darkMode, children } = this.props;

    if (this.state.hasError) {
      return (
        <div
          className={cn(
            "rounded-xl p-6 text-center border",
            darkMode
              ? "bg-slate-800/50 border-slate-700"
              : "bg-slate-50 border-slate-200"
          )}
        >
          <AlertTriangle
            className={cn(
              "w-10 h-10 mx-auto mb-3",
              darkMode ? "text-amber-400" : "text-amber-500"
            )}
          />
          <p
            className={cn(
              "font-medium mb-2",
              darkMode ? "text-slate-200" : "text-slate-700"
            )}
          >
            Something went wrong loading this content.
          </p>
          <p
            className={cn(
              "text-sm mb-4",
              darkMode ? "text-slate-400" : "text-slate-500"
            )}
          >
            Don't worry, the rest of the page should still work.
          </p>
          <button
            onClick={this.handleRetry}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              darkMode
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ContentErrorBoundary;

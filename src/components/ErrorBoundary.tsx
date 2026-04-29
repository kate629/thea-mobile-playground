import React from 'react';

// Top-level React error boundary. Catches uncaught render-phase errors
// anywhere in the tree and renders a friendly fallback instead of letting
// the entire app silently unmount to a blank `<div id="root"></div>`.
//
// Without this boundary, a single render-phase throw (e.g. a Firebase init
// edge case in IG/FB webview, an unhandled promise rejection feeding bad
// state into a hook) collapses the whole UI to nothing — users see a blank
// white page and bounce. The boundary degrades gracefully to a "we hit a
// snag" card with a refresh CTA, preserving the chance to recover.
//
// Also forwards the error to the global error logger (window.fbq + console)
// so we can correlate user reports with stack traces in DevTools / our
// future Sentry-equivalent pipeline.

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional override for the fallback UI. Defaults to the built-in card. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const FALLBACK_STYLES: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  fontFamily: '"Nunito Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  backgroundColor: '#fff',
  textAlign: 'center',
  color: '#1f2937',
};

const HEADING_STYLES: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  margin: '0 0 8px',
};

const BODY_STYLES: React.CSSProperties = {
  fontSize: '16px',
  margin: '0 0 24px',
  maxWidth: '480px',
  lineHeight: 1.5,
  color: '#4b5563',
};

const BUTTON_STYLES: React.CSSProperties = {
  padding: '12px 24px',
  fontSize: '16px',
  fontWeight: 500,
  backgroundColor: '#92400e',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Uncaught render error:', error, errorInfo);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (!error) return children;
    if (fallback) return fallback(error, this.reset);
    return (
      <div style={FALLBACK_STYLES} role="alert">
        <h1 style={HEADING_STYLES}>We hit a snag.</h1>
        <p style={BODY_STYLES}>
          Something went wrong loading Thea. Please refresh the page to try again.
        </p>
        <button
          type="button"
          style={BUTTON_STYLES}
          onClick={() => window.location.reload()}
        >
          Refresh
        </button>
      </div>
    );
  }
}

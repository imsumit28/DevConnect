import React from 'react';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected application error.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-6 shadow-lg">
            <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-600">
              DevConnect hit an unexpected UI error. Try reloading the page.
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 whitespace-pre-wrap">
              {this.state.message}
            </pre>
            <button
              onClick={this.handleReload}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;

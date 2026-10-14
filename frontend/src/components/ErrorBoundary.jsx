import { Component } from "react";

// A render error anywhere below this component used to unmount the whole
// app and leave a blank white page. This catches it and shows a recovery
// screen instead.
//
// `resetKey` (the current route) clears the error automatically when the
// user navigates somewhere else, so one broken page doesn't block the rest.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            This page hit an unexpected error. Your data is safe - you can
            try again, or go back to the start.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={() => window.location.assign("/")}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }
}
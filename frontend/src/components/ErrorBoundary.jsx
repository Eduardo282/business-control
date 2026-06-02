import React from "react";
import { logger } from "../services/logger";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("Unhandled UI error", { error, errorInfo });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" className="min-h-[220px] w-full flex items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-5 text-center text-red-700 shadow-sm">
          <h2 className="text-base font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm">Please refresh the page or try again in a moment.</p>
        </div>
      </div>
    );
  }
}

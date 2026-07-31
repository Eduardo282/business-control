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
      <div
        role="alert"
        className="flex min-h-[220px] w-full items-center justify-center bg-surface-app p-6 text-content-primary"
      >
        <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-5 text-center text-red-800 shadow-sm dark:border-red-800 dark:bg-red-950/50 dark:text-red-200 dark:shadow-black/30">
          <h2 className="text-base font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm">Please refresh the page or try again in a moment.</p>
        </div>
      </div>
    );
  }
}

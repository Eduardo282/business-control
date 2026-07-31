import { useId } from "react";

export default function Input({
  label,
  error,
  id: providedId,
  className = "",
  "aria-describedby": providedDescription,
  "aria-invalid": providedInvalid,
  ...props
}) {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [providedDescription, errorId].filter(Boolean).join(" ");

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="ml-1 text-xs font-semibold uppercase tracking-wider text-content-secondary transition-colors dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : providedInvalid}
          className={`w-full rounded-xl border border-control-border bg-white px-4 py-3 text-sm text-content-primary placeholder:text-content-muted shadow-sm transition-colors focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-control-disabled disabled:text-zinc-600 disabled:placeholder:text-zinc-500 disabled:focus:ring-0 dark:bg-dark-700 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus:border-blue-400 dark:focus:ring-blue-400/30 dark:disabled:border-zinc-700 dark:disabled:text-zinc-400 ${
            error ?
              "border-red-600 focus:border-red-600 focus:ring-red-600/25 dark:border-red-500 dark:focus:border-red-400 dark:focus:ring-red-400/30"
            : ""
          } ${className}`}
        />
      </div>
      {error && (
        <span
          id={errorId}
          role="alert"
          className="ml-1 block text-xs font-medium text-red-700 animate-fadeIn dark:text-red-300 motion-reduce:animate-none"
        >
          {error}
        </span>
      )}
    </div>
  );
}

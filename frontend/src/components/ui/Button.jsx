export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) {
  const base =
    "group relative inline-flex items-center justify-center overflow-hidden rounded-xl border font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-900 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:hover:translate-y-0 motion-reduce:transition-none ";

  const variants = {
    primary:
      "border-light-accent bg-gradient-to-r from-light-accent to-light-accentHover text-white shadow-lg shadow-light-accent/20 hover:from-light-accentHover hover:to-light-accentHover dark:border-blue-400/40 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-400 dark:shadow-blue-950/40",
    secondary:
      "border-zinc-300 bg-white text-zinc-800 shadow-sm hover:border-zinc-400 hover:bg-zinc-100 dark:border-white/20 dark:bg-white/10 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-white/15",
    danger:
      "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100 focus-visible:ring-red-600 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:border-red-600 dark:hover:bg-red-900/50 dark:focus-visible:ring-red-400",
    ghost:
      "border-transparent bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      {...props}
      className={`${base} ${variants[variant] || variants.primary} ${
        sizes[size]
      } ${className}`}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "primary" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-y-full bg-white/15 transition-transform duration-200 group-hover:translate-y-0 group-disabled:translate-y-full motion-reduce:transition-none"
        />
      )}
    </button>
  );
}

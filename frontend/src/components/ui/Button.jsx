export default function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) {
  const base =
    "font-medium rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden group ";

  // Estilos de variantes
  const variants = {
    primary:
      "bg-gradient-to-r from-light-accent to-light-accent dark:from-primary-600 dark:to-primary-500 hover:to-light-accent dark:hover:to-primary-400 text-white shadow-lg shadow-light-accent/25 dark:shadow-primary-500/25 border border-white/20 dark:border-primary-400/20",
    secondary: "glass-button text-light-text-body dark:text-slate-200",
    danger:
      "bg-light-error/10 dark:bg-red-500/10 text-light-error dark:text-red-400 border border-light-error/20 dark:border-red-500/20 hover:bg-light-error/20 dark:hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    ghost:
      "hover:bg-light-highlight/20 dark:hover:bg-white/5 text-light-text-secondary dark:text-slate-400 hover:text-light-text-primary dark:hover:text-white border border-transparent",
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
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
      )}
    </button>
  );
}

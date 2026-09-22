export default function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`glass-panel glass-mirror group relative overflow-hidden rounded-2xl border border-white/25 dark:border-white/10 bg-white/35 dark:bg-dark-900/55 p-6 text-content-primary shadow-glass-sm dark:shadow-glass-mirror transition-all duration-200 hover:shadow-glass-lg hover:border-white/40 dark:hover:border-white/20 ${className}`}>
      {glow && (
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 size-40 rounded-full bg-primary-500/10 blur-3xl transition-colors duration-150 group-hover:bg-primary-500/20 motion-reduce:transition-none"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

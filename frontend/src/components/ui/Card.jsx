export default function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`glass-panel group relative overflow-hidden rounded-md border border-zinc-300/80 bg-white/85 p-6 text-content-primary shadow-sm dark:border-white/15 dark:bg-dark-800/90 dark:text-zinc-100 dark:shadow-black/30 ${className}`}>
      {glow && (
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-20 size-40 rounded-full bg-primary-500/5 blur-3xl transition-colors duration-150 group-hover:bg-primary-500/10 motion-reduce:transition-none"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

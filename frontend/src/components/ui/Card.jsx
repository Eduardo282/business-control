export default function Card({ children, className = "", glow = false }) {
  return (
    <div
      className={`glass-panel rounded-md p-6 relative overflow-hidden group ${className}`}>
      {glow && (
        <div className="absolute -top-20 -right-20 size-40 bg-primary-500/5 rounded-full blur-3xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

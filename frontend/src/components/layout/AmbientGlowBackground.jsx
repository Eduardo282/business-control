export default function AmbientGlowBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none z-0"
    >
      {/* Orb 1: Cobalt / Electric Blue (Top-Left) */}
      <div
        className="absolute -top-24 -left-20 w-[34rem] h-[34rem] rounded-full opacity-40 dark:opacity-45 blur-[100px] transition-all duration-700 motion-safe:animate-pulse-slow"
        style={{
          background:
            "radial-gradient(circle, rgba(37, 99, 235, 0.7) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 75%)",
        }}
      />

      {/* Orb 2: Vivid Violet / Purple (Top-Right / Center-Right) */}
      <div
        className="absolute top-1/4 -right-24 w-[32rem] h-[32rem] rounded-full opacity-35 dark:opacity-40 blur-[110px] transition-all duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.7) 0%, rgba(168, 85, 247, 0.35) 50%, transparent 75%)",
        }}
      />

      {/* Orb 3: Electric Cyan (Bottom-Left) */}
      <div
        className="absolute -bottom-28 left-1/4 w-[30rem] h-[30rem] rounded-full opacity-30 dark:opacity-35 blur-[95px] transition-all duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.65) 0%, rgba(14, 165, 233, 0.3) 50%, transparent 75%)",
        }}
      />

      {/* Orb 4: Deep Indigo / Blue Ambient Glow (Center) */}
      <div
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full opacity-20 dark:opacity-30 blur-[130px] transition-all duration-700"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, rgba(79, 70, 229, 0.2) 60%, transparent 80%)",
        }}
      />

      {/* Glass Light Ring Accents (Reflective highlights echoing the reference image) */}
      <div
        className="hidden md:block absolute top-20 right-1/4 w-72 h-44 rounded-full border border-blue-400/20 dark:border-cyan-400/25 blur-[1px] rotate-12 opacity-30 dark:opacity-40 pointer-events-none"
        style={{
          boxShadow:
            "0 0 40px rgba(56, 189, 248, 0.25), inset 0 0 20px rgba(168, 85, 247, 0.25)",
        }}
      />
      <div
        className="hidden md:block absolute bottom-16 right-16 w-80 h-52 rounded-full border border-violet-400/20 dark:border-violet-400/25 blur-[1px] -rotate-12 opacity-25 dark:opacity-35 pointer-events-none"
        style={{
          boxShadow:
            "0 0 50px rgba(139, 92, 246, 0.25), inset 0 0 25px rgba(6, 182, 212, 0.2)",
        }}
      />
    </div>
  );
}

import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const label = isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      className="relative flex size-10 items-center justify-center rounded-xl border border-zinc-300 bg-white text-zinc-900 shadow-sm transition-[background-color,border-color,color,transform] duration-150 ease-out hover:border-zinc-400 hover:bg-zinc-100 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/20 dark:bg-white/10 dark:text-zinc-100 dark:hover:border-white/30 dark:hover:bg-white/15 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-900 motion-reduce:transition-none"
      title={label}
      aria-label={label}
      aria-pressed={isDark}>
      {/* Sol */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="absolute transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0) scale(1.1)",
        }}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>

      {/* Luna */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="absolute transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0) scale(1.1)" : "rotate(90deg) scale(0.5)",
        }}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}

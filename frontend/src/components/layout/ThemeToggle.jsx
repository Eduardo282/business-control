import { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggleTheme}
      className="relative flex items-center justify-center size-10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
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
        className="absolute transition-all duration-500"
        style={{
          color: isDark ? "#94a3b8" : "#fbbf24",
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0) scale(1.1)",
          filter: !isDark ? "drop-shadow(0 0 8px rgba(251,191,36,0.4))" : "none",
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
        className="absolute transition-all duration-500"
        style={{
          color: isDark ? "#38bdf8" : "#64748b",
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0) scale(1.1)" : "rotate(90deg) scale(0.5)",
          filter: isDark ? "drop-shadow(0 0 8px rgba(56,189,248,0.4))" : "none",
        }}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    </button>
  );
}

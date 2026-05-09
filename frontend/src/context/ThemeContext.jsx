import { createContext, useState, useEffect, useCallback } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Por defecto 'dark' ya que el diseño actual del usuario es oscuro
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // El modo 'class' de Tailwind se basa en la presencia de la clase 'dark' en el elemento html
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const switchTheme = () => {
      setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    // Si el navegador no soporta View Transitions, cambiar sin animación
    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    // Usar la View Transition API para la animación circular
    document.startViewTransition(switchTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

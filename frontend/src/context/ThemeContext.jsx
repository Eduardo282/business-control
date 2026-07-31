import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEYS,
  applyTheme,
  getThemeStorageKey,
  isValidTheme,
  persistTheme,
  readThemePreferences,
} from "./theme";

export const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  toggleTheme: () => {},
});

const useSafeLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export const ThemeProvider = ({ children }) => {
  const location = useLocation();
  const storageKey = getThemeStorageKey(location.pathname);
  const [preferences, setPreferences] = useState(readThemePreferences);
  const theme = preferences[storageKey] ?? DEFAULT_THEME;

  // Route changes can swap admin/portal preferences. Apply before paint so the
  // destination never renders for a frame with the previous scope's theme.
  useSafeLayoutEffect(() => {
    applyTheme(theme);
  }, [storageKey, theme]);

  useEffect(() => {
    const syncStoredPreference = (event) => {
      const storageKeys = Object.values(THEME_STORAGE_KEYS);

      if (
        event.key === null ||
        (storageKeys.includes(event.key) && event.newValue === null)
      ) {
        setPreferences(readThemePreferences());
        return;
      }

      if (!storageKeys.includes(event.key) || !isValidTheme(event.newValue)) {
        return;
      }

      setPreferences((current) => ({
        ...current,
        [event.key]: event.newValue,
      }));
    };

    window.addEventListener("storage", syncStoredPreference);
    return () => window.removeEventListener("storage", syncStoredPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const switchTheme = () => {
      // Apply immediately so the View Transition captures the correct state;
      // React state then keeps every consumer in sync.
    applyTheme(nextTheme);
    persistTheme(storageKey, nextTheme);
    setPreferences((current) => ({
      ...current,
      [storageKey]: nextTheme,
    }));
    };

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
      prefersReducedMotion ||
      typeof document.startViewTransition !== "function"
    ) {
      switchTheme();
      return;
    }

    document.startViewTransition(switchTheme);
  }, [storageKey, theme]);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

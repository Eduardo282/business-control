export const DEFAULT_THEME = "dark";

export const THEME_STORAGE_KEYS = Object.freeze({
  admin: "theme",
  portal: "portal_theme",
});

export const THEME_COLORS = Object.freeze({
  light: "#f8fafc",
  dark: "#0f111a",
});

export function isValidTheme(value) {
  return value === "light" || value === "dark";
}

export function getThemeStorageKey(pathname = "") {
  return pathname.startsWith("/portal")
    ? THEME_STORAGE_KEYS.portal
    : THEME_STORAGE_KEYS.admin;
}

function getDefaultStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function readStoredTheme(storageKey, storage = getDefaultStorage()) {
  try {
    const storedTheme = storage?.getItem(storageKey);
    return isValidTheme(storedTheme) ? storedTheme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function readThemePreferences(storage = getDefaultStorage()) {
  return {
    [THEME_STORAGE_KEYS.admin]: readStoredTheme(
      THEME_STORAGE_KEYS.admin,
      storage,
    ),
    [THEME_STORAGE_KEYS.portal]: readStoredTheme(
      THEME_STORAGE_KEYS.portal,
      storage,
    ),
  };
}

export function persistTheme(
  storageKey,
  theme,
  storage = getDefaultStorage(),
) {
  if (!isValidTheme(theme)) return false;

  try {
    storage?.setItem(storageKey, theme);
    return true;
  } catch {
    return false;
  }
}

export function applyTheme(theme, options = {}) {
  const resolvedTheme = isValidTheme(theme) ? theme : DEFAULT_THEME;
  const targetDocument =
    options.document ??
    (typeof document === "undefined" ? null : document);
  const root = options.root ?? targetDocument?.documentElement;

  if (!root) return resolvedTheme;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  if (targetDocument?.head) {
    let themeColorMeta = targetDocument.head.querySelector(
      'meta[name="theme-color"]',
    );

    if (!themeColorMeta) {
      themeColorMeta = targetDocument.createElement("meta");
      themeColorMeta.setAttribute("name", "theme-color");
      targetDocument.head.appendChild(themeColorMeta);
    }

    themeColorMeta.setAttribute("content", THEME_COLORS[resolvedTheme]);
  }

  return resolvedTheme;
}

export function initializeTheme(pathname, options = {}) {
  const resolvedPathname =
    pathname ??
    (typeof window === "undefined" ? "" : window.location.pathname);
  const storageKey = getThemeStorageKey(resolvedPathname);
  const theme = readStoredTheme(storageKey, options.storage);

  applyTheme(theme, options);

  return { storageKey, theme };
}

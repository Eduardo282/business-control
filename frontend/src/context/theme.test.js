import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  THEME_COLORS,
  THEME_STORAGE_KEYS,
  applyTheme,
  getThemeStorageKey,
  initializeTheme,
  readStoredTheme,
} from "./theme.js";

describe("theme bootstrap", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    document.head.querySelector('meta[name="theme-color"]')?.remove();
  });

  it("selects independent admin and portal storage keys", () => {
    expect(getThemeStorageKey("/clientes")).toBe(THEME_STORAGE_KEYS.admin);
    expect(getThemeStorageKey("/portal/dashboard")).toBe(
      THEME_STORAGE_KEYS.portal,
    );
  });

  it("rejects invalid stored values and falls back to dark", () => {
    localStorage.setItem(THEME_STORAGE_KEYS.admin, "sepia");

    expect(readStoredTheme(THEME_STORAGE_KEYS.admin)).toBe(DEFAULT_THEME);

    const result = initializeTheme("/login");

    expect(result).toEqual({
      storageKey: THEME_STORAGE_KEYS.admin,
      theme: DEFAULT_THEME,
    });
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(
      document.head.querySelector('meta[name="theme-color"]'),
    ).toHaveAttribute("content", THEME_COLORS.dark);
  });

  it("applies the portal preference synchronously without changing admin", () => {
    localStorage.setItem(THEME_STORAGE_KEYS.admin, "dark");
    localStorage.setItem(THEME_STORAGE_KEYS.portal, "light");

    expect(initializeTheme("/portal/login").theme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.admin)).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.portal)).toBe("light");
  });

  it("updates the root state and browser theme color together", () => {
    applyTheme("dark");
    applyTheme("light");

    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(
      document.head.querySelector('meta[name="theme-color"]'),
    ).toHaveAttribute("content", THEME_COLORS.light);
  });
});

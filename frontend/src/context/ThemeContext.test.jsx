import React, { useContext } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";

import ThemeToggle from "../components/layout/ThemeToggle.jsx";
import { ThemeContext, ThemeProvider } from "./ThemeContext.jsx";
import { THEME_STORAGE_KEYS } from "./theme.js";

function ThemeHarness() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  return (
    <>
      <output data-testid="active-theme">{theme}</output>
      <button type="button" onClick={() => navigate("/portal/dashboard")}>
        Ir al portal
      </button>
      <button type="button" onClick={() => navigate("/clientes")}>
        Ir a administración
      </button>
      <ThemeToggle />
    </>
  );
}

function renderThemeProvider(initialPath = "/clientes") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    delete document.startViewTransition;
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    delete document.startViewTransition;
  });

  it("switches route scopes without overwriting either preference", async () => {
    const user = userEvent.setup();
    localStorage.setItem(THEME_STORAGE_KEYS.admin, "light");
    localStorage.setItem(THEME_STORAGE_KEYS.portal, "dark");

    renderThemeProvider();

    expect(screen.getByTestId("active-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: "Ir al portal" }));

    expect(screen.getByTestId("active-theme")).toHaveTextContent("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.admin)).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.portal)).toBe("dark");

    await user.click(
      screen.getByRole("button", { name: "Cambiar a modo claro" }),
    );

    expect(localStorage.getItem(THEME_STORAGE_KEYS.portal)).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEYS.admin)).toBe("light");
  });

  it("skips View Transitions when reduced motion is requested", async () => {
    const user = userEvent.setup();
    const startViewTransition = vi.fn();
    document.startViewTransition = startViewTransition;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    localStorage.setItem(THEME_STORAGE_KEYS.admin, "dark");

    renderThemeProvider();

    await user.click(
      screen.getByRole("button", { name: "Cambiar a modo claro" }),
    );

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(screen.getByTestId("active-theme")).toHaveTextContent("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it.each([
    ["admin", "/clientes", THEME_STORAGE_KEYS.admin, "removeItem"],
    ["portal", "/portal/dashboard", THEME_STORAGE_KEYS.portal, "removeItem"],
    ["admin", "/clientes", THEME_STORAGE_KEYS.admin, "clear"],
    ["portal", "/portal/dashboard", THEME_STORAGE_KEYS.portal, "clear"],
  ])(
    "re-reads the %s default after localStorage.%s()",
    (_scope, initialPath, storageKey, operation) => {
      localStorage.setItem(storageKey, "light");
      renderThemeProvider(initialPath);

      expect(screen.getByTestId("active-theme")).toHaveTextContent("light");

      act(() => {
        if (operation === "clear") {
          localStorage.clear();
        } else {
          localStorage.removeItem(storageKey);
        }

        window.dispatchEvent(
          new StorageEvent("storage", {
            key: operation === "clear" ? null : storageKey,
            oldValue: "light",
            newValue: null,
          }),
        );
      });

      expect(localStorage.getItem(storageKey)).toBeNull();
      expect(screen.getByTestId("active-theme")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveClass("dark");
      expect(document.documentElement.style.colorScheme).toBe("dark");
    },
  );
});

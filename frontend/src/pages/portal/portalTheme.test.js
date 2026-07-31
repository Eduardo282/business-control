import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import process from "node:process";
import { describe, expect, it } from "vitest";

const PORTAL_FILES = [
  "PortalLogin.jsx",
  "PortalForgotPassword.jsx",
  "PortalResetPassword.jsx",
  "PortalLayout.jsx",
  "PortalSettings.jsx",
  "PortalDashboard.jsx",
  "dashboard/PortalDashboardReel.jsx",
  "dashboard/PortalDashboardServicesList.jsx",
  "dashboard/PortalDashboardView.jsx",
  "PortalCatalog.jsx",
  "catalog/PortalCatalogView.jsx",
  "catalog/portalCatalogColumns.jsx",
  "PortalQuotes.jsx",
  "PortalSupport.jsx",
];

const portalDirectory = resolve(
  process.cwd(),
  basename(process.cwd()) === "frontend" ? "src/pages/portal" : "frontend/src/pages/portal",
);

const readPortalFile = (fileName) =>
  readFileSync(resolve(portalDirectory, fileName), "utf8");

const readPortalSource = (fileNames) =>
  fileNames.map((fileName) => readPortalFile(fileName)).join("\n");

const readQuotedValue = (source, start) => {
  const quote = source[start];
  let value = "";

  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\\") {
      value += `${character}${source[index + 1] ?? ""}`;
      index += 1;
      continue;
    }
    if (character === quote) return { value, end: index + 1 };
    value += character;
  }

  return { value, end: source.length };
};

const extractClassAttributeValues = (source) => {
  const values = [];
  const attributePattern = /\b(?:className|descriptionClassName)\s*=\s*/g;

  for (const match of source.matchAll(attributePattern)) {
    let cursor = match.index + match[0].length;
    const firstCharacter = source[cursor];

    if (["\"", "'", "`"].includes(firstCharacter)) {
      values.push(readQuotedValue(source, cursor).value);
      continue;
    }

    if (firstCharacter !== "{") continue;

    let depth = 1;
    let expression = "";
    cursor += 1;

    while (cursor < source.length && depth > 0) {
      const character = source[cursor];

      if (["\"", "'", "`"].includes(character)) {
        const quoted = readQuotedValue(source, cursor);
        expression += `${character}${quoted.value}${character}`;
        cursor = quoted.end;
        continue;
      }

      if (character === "{") depth += 1;
      if (character === "}") depth -= 1;
      if (depth > 0) expression += character;
      cursor += 1;
    }

    values.push(expression);
  }

  return values;
};

const themeSensitiveLightToken =
  /(?:bg-white(?:\/\d+)?|bg-zinc-(?:50|100|200)|text-zinc-[2-9]00|border-zinc-(?:100|200|300)|text-black|bg-\[#(?:f6f5f0|ffffff|1B4733|1a2b4c|235b42)\]|text-\[#(?:1a2b4c|3b4b6b|5e6b82|235b42|2277B4|1B4733)\]|(?:bg|text|border)-(?:red|emerald|blue|amber|yellow|purple|violet)-(?:50|100|200|300|400|500|600|700|800))/;

describe("contact portal theme coverage", () => {
  it.each(PORTAL_FILES)(
    "%s pairs theme-sensitive class attributes with a dark variant",
    (fileName) => {
      const source = readPortalFile(fileName);
      const unpairedAttributes = [];

      for (const classes of extractClassAttributeValues(source)) {
        if (themeSensitiveLightToken.test(classes) && !classes.includes("dark:")) {
          unpairedAttributes.push(classes.replace(/\s+/g, " ").trim());
        }
      }

      expect(unpairedAttributes).toEqual([]);
    },
  );

  it("includes dynamic template and conditional class expressions in the audit", () => {
    const attributes = extractClassAttributeValues(
      readPortalFile("catalog/PortalCatalogView.jsx"),
    );

    expect(
      attributes.some(
        (classes) =>
          classes.includes("cursor-pointer hover:text-zinc-900") &&
          classes.includes("dark:hover:text-zinc-100"),
      ),
    ).toBe(true);
  });

  it.each([
    "PortalLogin.jsx",
    "PortalForgotPassword.jsx",
    "PortalResetPassword.jsx",
  ])("%s explicitly themes auth surfaces and form states", (fileName) => {
    const source = readPortalFile(fileName);

    expect(source).toContain("bg-[#f6f5f0] dark:bg-zinc-950");
    expect(source).toContain("dark:placeholder:text-zinc-500");
    expect(source).toContain("dark:focus:border-emerald-400");
    expect(source).toContain("dark:disabled:bg-emerald-950");
  });

  it("themes the reset invalid-token panel and the settings autofill state", () => {
    expect(readPortalFile("PortalResetPassword.jsx")).toContain(
      "dark:bg-red-500/15",
    );

    const settings = readPortalFile("PortalSettings.jsx");
    expect(settings).toContain(".portal-settings-input:-webkit-autofill");
    expect(settings).toContain(".dark .portal-settings-input:-webkit-autofill");
    expect(settings).toContain("dark:text-red-300");
  });

  it("themes layout loading and interactive borders", () => {
    const source = readPortalFile("PortalLayout.jsx");

    expect(source).toContain("Cargando portal...");
    expect(source).toContain("min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950");
    expect(source).toContain("dark:hover:border-zinc-500");
  });

  it("themes dashboard reels, status cards, paginator, and folio selection", () => {
    const source = readPortalSource([
      "PortalDashboard.jsx",
      "dashboard/PortalDashboardReel.jsx",
      "dashboard/PortalDashboardServicesList.jsx",
      "dashboard/PortalDashboardView.jsx",
    ]);

    expect(source).toContain(".dark .reel-window");
    expect(source).toContain(".dark .symbol-face");
    expect(source).toContain("dark:bg-zinc-900/80");
    expect(source).toContain("dark:bg-blue-500/20 dark:text-blue-300");
    expect(source).toContain("dark:bg-emerald-500/15 dark:text-emerald-300");
  });

  it("themes catalog filters, selected rows, modals, and the floating CTA", () => {
    const source = readPortalSource([
      "PortalCatalog.jsx",
      "catalog/PortalCatalogView.jsx",
      "catalog/portalCatalogColumns.jsx",
    ]);

    expect(source).toContain("dark:bg-emerald-500/10");
    expect(source).toContain("dark:text-blue-400");
    expect(source).toContain("dark:bg-black/70");
    expect(source).toContain("dark:bg-emerald-300");
    expect(source).toContain("dark:disabled:bg-emerald-950");
  });

  it("themes quote empty, status, table, pagination, and modal states", () => {
    const source = readPortalFile("PortalQuotes.jsx");

    expect(source).toContain("bg-white/60 dark:bg-zinc-900/70");
    expect(source).toContain("dark:bg-purple-500/15 dark:text-purple-300");
    expect(source).toContain("dark:bg-zinc-950");
    expect(source).toContain("dark:disabled:bg-zinc-950");
    expect(source).toContain("dark:bg-black/70");
  });

  it("themes support gradients, scrollbar, agent bubbles, and status states", () => {
    const source = readPortalFile("PortalSupport.jsx");

    expect(source).toContain(".dark .portal-support-messages");
    expect(source).toContain("dark:from-zinc-950 dark:to-zinc-900");
    expect(source).toContain("dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100");
    expect(source).toContain("dark:text-emerald-400");
    expect(source).toContain("dark:disabled:bg-zinc-800");
  });
});

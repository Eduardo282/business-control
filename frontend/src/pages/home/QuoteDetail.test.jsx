import { describe, expect, it } from "vitest";

import { getQuoteDetailStatusClasses } from "./QuoteDetail.jsx";

describe("QuoteDetail status theme", () => {
  it.each([
    ["PENDIENTE", ["dark:text-amber-300", "dark:border-amber-500/30", "dark:bg-amber-500/10"]],
    ["SOLICITADA", ["dark:text-blue-300", "dark:border-blue-500/30", "dark:bg-blue-500/10"]],
    ["ENVIADA", ["dark:text-indigo-300", "dark:border-indigo-500/30", "dark:bg-indigo-500/10"]],
    ["ACEPTADA", ["dark:text-emerald-300", "dark:border-emerald-500/30", "dark:bg-emerald-500/10"]],
    ["RECHAZADA", ["dark:text-red-300", "dark:border-red-500/30", "dark:bg-red-500/10"]],
  ])("returns explicit dark pairs for %s", (status, expectedClasses) => {
    const classes = getQuoteDetailStatusClasses(status).split(" ");

    expect(classes).toEqual(expect.arrayContaining(expectedClasses));
  });

  it("returns a dark neutral fallback for unknown statuses", () => {
    expect(getQuoteDetailStatusClasses("DESCONOCIDA").split(" ")).toEqual(
      expect.arrayContaining([
        "dark:text-zinc-300",
        "dark:border-dark-700",
        "dark:bg-dark-800",
      ]),
    );
  });
});

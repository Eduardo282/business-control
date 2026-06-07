import { describe, expect, it, vi } from "vitest";

import {
  formatCurrency,
  formatDateTime,
  getQuoteStatusLabel,
  normalizeSearchText,
} from "./formatters.js";
import { gql } from "./graphqlClient.js";

describe("formatters", () => {
  it("normalizes search text by removing accents, symbols and casing", () => {
    expect(normalizeSearchText("  Cotización Ágil #2026!! ")).toBe(
      "cotizacion agil 2026",
    );
  });

  it("formats currency with Mexican separators and two decimals", () => {
    expect(formatCurrency(1234.5)).toBe("1,234.50");
    expect(formatCurrency("invalid")).toBe("0.00");
  });

  it("formats invalid dates as a dash", () => {
    expect(formatDateTime("not-a-date")).toBe("-");
  });

  it.each([
    ["PENDING", "Pendiente"],
    ["requested", "Solicitada"],
    ["APPROVED", "Aprobada"],
    ["REJECTED", "Rechazada"],
    ["CUSTOM", "CUSTOM"],
    [undefined, "Pendiente"],
  ])("maps quote status %s to %s", (status, expected) => {
    expect(getQuoteStatusLabel(status)).toBe(expected);
  });
});

describe("gql", () => {
  it("returns GraphQL data when the response has no errors", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({ data: { data: { ok: true } } }),
    };

    await expect(gql("query Test", { id: 1 }, client)).resolves.toEqual({ ok: true });
    expect(client.post).toHaveBeenCalledWith("", {
      query: "query Test",
      variables: { id: 1 },
    });
  });

  it("throws an enriched error when GraphQL returns errors", async () => {
    const client = {
      post: vi.fn().mockResolvedValue({
        data: {
          errors: [
            {
              message: "Forbidden",
              extensions: { code: "FORBIDDEN", details: { role: "USER" } },
            },
          ],
        },
      }),
    };

    await expect(gql("query Forbidden", {}, client)).rejects.toMatchObject({
      message: "Forbidden",
      code: "FORBIDDEN",
      details: { role: "USER" },
    });
  });
});

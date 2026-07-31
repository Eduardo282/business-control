import { describe, expect, it, vi } from "vitest";
import {
  buildCreateQuotePayload,
  isMeaningfulQuoteDraft,
  resolveQuoteDraftScope,
  resolveQuoteFolioDraft,
} from "./quoteDraft.js";

describe("resolveQuoteDraftScope", () => {
  it("prefers a versioned request scope over a client scope", () => {
    expect(
      resolveQuoteDraftScope({ requestId: "23", clientId: "7" }),
    ).toBe("request:v2:23");
  });

  it("uses the client scope when there is no request", () => {
    expect(resolveQuoteDraftScope({ clientId: "7" })).toBe("client:7");
  });

  it("falls back to the global scope", () => {
    expect(resolveQuoteDraftScope({})).toBe("global");
  });
});

describe("isMeaningfulQuoteDraft", () => {
  it.each([
    { selectedClient: { id: 1 } },
    { clientSearch: "Client" },
    { folio: "ABCD123" },
    { items: [{ product_id: 1 }] },
  ])("accepts a draft with meaningful data", (draft) => {
    expect(isMeaningfulQuoteDraft(draft)).toBe(true);
  });

  it.each([
    undefined,
    null,
    {},
    { clientSearch: "  ", folio: "\t", items: [] },
  ])("rejects an empty draft", (draft) => {
    expect(isMeaningfulQuoteDraft(draft)).toBe(false);
  });
});

describe("resolveQuoteFolioDraft", () => {
  it("normalizes a valid folio", () => {
    expect(resolveQuoteFolioDraft("  abcd123 ")).toBe("ABCD123");
  });

  it("generates a deterministic folio when the input is invalid", () => {
    const random = vi
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.04)
      .mockReturnValueOnce(0.08)
      .mockReturnValueOnce(0.12)
      .mockReturnValueOnce(0.456);

    expect(resolveQuoteFolioDraft("invalid", random)).toBe("ABCD456");
    expect(random).toHaveBeenCalledTimes(5);
  });
});

describe("buildCreateQuotePayload", () => {
  it("builds the exact create-quote payload shape", () => {
    expect(
      buildCreateQuotePayload({
        client: { id: 10 },
        contactId: 21,
        folio: "ABCD123",
        items: [
          {
            product_id: 30,
            quantity: 2,
            price: 125,
            discount: 10,
          },
        ],
      }),
    ).toEqual({
      client_id: 10,
      contact_id: 21,
      items: [
        {
          product_id: 30,
          quantity: 2,
          unit_price: 125,
          discount: 10,
        },
      ],
      notes: "Ninguna por el momento",
      folio: "ABCD123",
    });
  });

  it("leaves an empty contact undefined so JSON transport omits it", () => {
    const payload = buildCreateQuotePayload({
      client: { id: 10 },
      contactId: "",
      folio: "ABCD123",
      items: [],
    });

    expect(payload.contact_id).toBeUndefined();
    expect(JSON.parse(JSON.stringify(payload))).not.toHaveProperty("contact_id");
  });

  it("coerces numeric prices and defaults invalid prices to zero", () => {
    const payload = buildCreateQuotePayload({
      client: { id: 10 },
      folio: "ABCD123",
      items: [
        { product_id: 1, quantity: 1, price: "125.50", discount: 0 },
        { product_id: 2, quantity: 1, price: "invalid", discount: 0 },
      ],
    });

    expect(payload.items.map((item) => item.unit_price)).toEqual([125.5, 0]);
  });

  it("normalizes discounts with the shared pricing rules", () => {
    const payload = buildCreateQuotePayload({
      client: { id: 10 },
      folio: "ABCD123",
      items: [
        { product_id: 1, quantity: 1, price: 10, discount: "12.5" },
        { product_id: 2, quantity: 1, price: 10, discount: 150 },
        { product_id: 3, quantity: 1, price: 10, discount: -20 },
      ],
    });

    expect(payload.items.map((item) => item.discount)).toEqual([12.5, 100, 0]);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildQuoteRequestItems,
  getQuoteRequestSummary,
  updateQuoteRequestCart,
} from "./quoteRequestCart";

describe("quote request cart", () => {
  it("keeps multiple products with independent quantities", () => {
    const cart = [
      ["prd-1", 1],
      ["prd-2", 1],
      ["prd-1", 2],
    ].reduce(
      (currentCart, [productId, delta]) =>
        updateQuoteRequestCart(currentCart, productId, delta),
      {},
    );

    expect(cart).toEqual({
      "prd-1": 3,
      "prd-2": 1,
    });
    expect(buildQuoteRequestItems(cart)).toEqual([
      { product_id: "prd-1", quantity: 3 },
      { product_id: "prd-2", quantity: 1 },
    ]);
    expect(getQuoteRequestSummary(cart)).toEqual({
      productCount: 2,
      totalQuantity: 4,
    });
  });

  it("removes only the selected product when its quantity reaches zero", () => {
    const cart = updateQuoteRequestCart(
      {
        "prd-1": 2,
        "prd-2": 1,
      },
      "prd-1",
      -2,
    );

    expect(cart).toEqual({ "prd-2": 1 });
  });
});


import { describe, expect, it } from "vitest";
import {
  groupQuoteProductResults,
  inferQuoteProductType,
} from "./productGrouping";

describe("inferQuoteProductType", () => {
  it("preserves explicit product types and infers normalized catalog text", () => {
    expect(inferQuoteProductType({ product_type: "SERVICE" })).toBe("SERVICE");
    expect(inferQuoteProductType({ name: "Póliza anual" })).toBe("POLICY");
    expect(inferQuoteProductType({ category: "CONTPAQi Comercial" })).toBe(
      "CONTPAQI",
    );
    expect(inferQuoteProductType({ name: "Equipo de oficina" })).toBe(
      "PRODUCT",
    );
  });
});

describe("groupQuoteProductResults", () => {
  it("keeps unnamed products in separate fallback groups", () => {
    const groups = groupQuoteProductResults([
      { id: 10, folio: "A-10" },
      { id: 11, folio: "A-11" },
    ]);

    expect(groups.map((product) => product._groupKey)).toEqual([
      "product-10",
      "product-11",
    ]);
  });
});

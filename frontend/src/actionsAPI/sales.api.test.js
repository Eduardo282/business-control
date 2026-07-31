import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSaleFromQuoteApi,
  deleteSaleApi,
  getSaleApi,
  listSalesApi,
} from "./sales.api";
import { gql } from "../utils/graphqlClient";

vi.mock("../utils/graphqlClient", () => ({
  gql: vi.fn(),
}));

describe("sales.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listSalesApi fetches sales list", async () => {
    const mockSales = [{ id: "10", total: 4500, folio: "VTA-000010" }];
    gql.mockResolvedValueOnce({ sales: mockSales });

    const result = await listSalesApi();
    expect(result).toEqual(mockSales);
  });

  it("getSaleApi fetches single sale", async () => {
    const mockSale = { id: "10", total: 4500, items: [] };
    gql.mockResolvedValueOnce({ sale: mockSale });

    const result = await getSaleApi("10");
    expect(result).toEqual(mockSale);
  });

  it("createSaleFromQuoteApi creates a sale from quote item ids", async () => {
    const created = { id: "11", total: 1500, folio: "VTA-000011" };
    gql.mockResolvedValueOnce({ createSaleFromQuote: created });

    const result = await createSaleFromQuoteApi({ quote_id: "5", quote_item_ids: ["item-1"] });
    expect(result).toEqual(created);
  });

  it("deleteSaleApi removes a sale", async () => {
    gql.mockResolvedValueOnce({ deleteSale: true });

    const result = await deleteSaleApi("11");
    expect(result).toBe(true);
  });
});

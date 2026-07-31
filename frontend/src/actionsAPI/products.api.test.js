import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearProductPriceHistoryApi,
  createProductApi,
  deleteProductApi,
  getProductApi,
  listProductsApi,
  updateProductApi,
  updateProductPriceApi,
} from "./products.api";
import { gql } from "../utils/graphqlClient";

vi.mock("../utils/graphqlClient", () => ({
  gql: vi.fn(),
}));

describe("products.api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listProductsApi fetches products", async () => {
    const mockProducts = [{ id: "1", name: "Sistema Contable", current_price: 1500 }];
    gql.mockResolvedValueOnce({ products: mockProducts });

    const result = await listProductsApi();
    expect(result).toEqual(mockProducts);
  });

  it("listProductsApi filters by clientId when provided", async () => {
    gql.mockResolvedValueOnce({ products: [] });

    await listProductsApi("client-123");
    expect(gql).toHaveBeenCalledWith(
      expect.stringContaining("query GetProducts"),
      { clientId: "client-123" },
    );
  });

  it("getProductApi fetches product detail with history", async () => {
    const mockProduct = {
      id: "1",
      name: "Sistema Contable",
      price_history: [{ id: "ph1", price: 1200 }],
    };
    gql.mockResolvedValueOnce({ product: mockProduct });

    const result = await getProductApi("1");
    expect(result).toEqual(mockProduct);
  });

  it("createProductApi creates product", async () => {
    const input = { name: "Póliza Anual", current_price: 5000, category: "Polizas" };
    const created = { id: "2", ...input };
    gql.mockResolvedValueOnce({ createProduct: created });

    const result = await createProductApi(input);
    expect(result).toEqual(created);
  });

  it("updateProductApi updates product detail", async () => {
    const input = { name: "Póliza Premium" };
    const updated = { id: "2", ...input };
    gql.mockResolvedValueOnce({ updateProduct: updated });

    const result = await updateProductApi("2", input);
    expect(result).toEqual(updated);
  });

  it("updateProductPriceApi updates current price", async () => {
    const updated = { id: "2", current_price: 5500 };
    gql.mockResolvedValueOnce({ updateProductPrice: updated });

    const result = await updateProductPriceApi("2", 5500);
    expect(result).toEqual(updated);
  });

  it("deleteProductApi deletes a product", async () => {
    gql.mockResolvedValueOnce({ deleteProduct: true });

    const result = await deleteProductApi("2");
    expect(result).toBe(true);
  });

  it("clearProductPriceHistoryApi clears price history", async () => {
    gql.mockResolvedValueOnce({ clearProductPriceHistory: true });

    const result = await clearProductPriceHistoryApi("2");
    expect(result).toBe(true);
  });
});

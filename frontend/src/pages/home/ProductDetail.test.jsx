import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductDetail from "./ProductDetail";
import { getProductApi } from "../../actionsAPI/products.api";

vi.mock("../../actionsAPI/products.api", () => ({
  getProductApi: vi.fn(),
  updateProductApi: vi.fn(),
  deleteProductApi: vi.fn(),
  updateProductPriceApi: vi.fn(),
  clearProductPriceHistoryApi: vi.fn(),
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: { name: "ADMIN" } } }),
}));

describe("ProductDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the persisted folio for a service product", async () => {
    getProductApi.mockResolvedValue({
      id: 3,
      folio: "SRV-000003",
      name: "Tacos a domicilio",
      category: "Comida",
      product_type: "SERVICE",
      current_price: 454,
      users_count: 1,
      description: "Unos ricos tacos",
      price_history: [],
      update_history: [],
      created_at: "2026-07-10T13:39:00.000Z",
      updated_at: "2026-07-10T13:39:00.000Z",
    });

    render(
      <MemoryRouter initialEntries={["/productos/3"]}>
        <Routes>
          <Route path="/productos/:id" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("SRV-000003")).toBeInTheDocument();
    expect(screen.queryByText("PRD-000003")).not.toBeInTheDocument();
  });
});

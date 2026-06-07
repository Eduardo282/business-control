import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductSelectorModal from "./ProductSelectorModal.jsx";

const products = [
  {
    id: 1,
    name: "CONTPAQi Nóminas",
    folio: "PRD-000001",
    category: "CONTPAQI",
    description: "Sistema para nómina",
    isCustom: true,
  },
];

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onBack: vi.fn(),
    title: "Productos CONTPAQi",
    type: "CONTPAQI",
    products,
    selectedCategory: "CONTPAQI",
    onSelectProduct: vi.fn(),
    onNewProductClick: vi.fn(),
    productLogoMap: {},
    ...overrides,
  };

  render(<ProductSelectorModal {...props} />);
  return props;
}

describe("ProductSelectorModal", () => {
  afterEach(() => cleanup());

  it("does not render when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText("Productos CONTPAQi")).not.toBeInTheDocument();
  });

  it("renders products with folio, category and custom badge", () => {
    renderModal();

    expect(screen.getByText("CONTPAQi Nóminas")).toBeVisible();
    expect(screen.getByText(/Folio: PRD-000001/i)).toBeVisible();
    expect(screen.getByText("CONTPAQI")).toBeVisible();
    expect(screen.getByText("Nuevo")).toBeVisible();
  });

  it("selects a product and exposes navigation actions", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole("button", { name: /CONTPAQi Nóminas/i }));
    await user.click(screen.getByRole("button", { name: /Nuevo producto/i }));
    await user.click(screen.getAllByRole("button")[0]);

    expect(props.onSelectProduct).toHaveBeenCalledWith(products[0]);
    expect(props.onNewProductClick).toHaveBeenCalledTimes(1);
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["SERVICE", "Nuevo servicio"],
    ["POLICY", "Nueva póliza"],
    ["PRODUCT", "Nuevo producto"],
  ])("uses the right creation label for %s", (type, label) => {
    renderModal({ type, products: [] });

    expect(screen.getByRole("button", { name: new RegExp(label, "i") })).toBeVisible();
  });

  it("shows empty state for selected category", () => {
    renderModal({ products: [], selectedCategory: "Servicios", type: "SERVICE" });

    expect(screen.getByText(/No hay opciones disponibles/i)).toBeVisible();
    expect(screen.getByText("Servicios")).toBeVisible();
  });
});

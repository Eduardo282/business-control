import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CategoryManagerModal from "./CategoryManagerModal.jsx";

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    newCategoryName: "",
    setNewCategoryName: vi.fn(),
    handleAddCategory: vi.fn(),
    availableCategories: ["Contabilidad", "Servicios"],
    normalizeServicePolicyCategory: normalize,
    selectedCategory: "Servicios",
    applyCategorySelection: vi.fn(),
    categoryPage: 1,
    setCategoryPage: vi.fn(),
    ...overrides,
  };

  render(<CategoryManagerModal {...props} />);
  return props;
}

describe("CategoryManagerModal", () => {
  afterEach(() => cleanup());

  it("does not render when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText("Categorías")).not.toBeInTheDocument();
  });

  it("disables add button and warns when category is duplicated", () => {
    renderModal({ newCategoryName: " servicios " });

    expect(screen.getByRole("button", { name: /Agregar/i })).toBeDisabled();
    expect(screen.getByText(/Ya existe una categoría/i)).toBeVisible();
  });

  it("adds a non-duplicated category", async () => {
    const user = userEvent.setup();
    const props = renderModal({ newCategoryName: "Legal" });

    await user.click(screen.getByRole("button", { name: /Agregar/i }));

    expect(props.handleAddCategory).toHaveBeenCalledTimes(1);
  });

  it("selects a category and closes", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole("button", { name: "Contabilidad" }));

    expect(props.applyCategorySelection).toHaveBeenCalledWith("Contabilidad");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("paginates category chips", async () => {
    const user = userEvent.setup();
    const categories = Array.from({ length: 13 }, (_, index) => `Cat ${index + 1}`);
    const props = renderModal({ availableCategories: categories });

    expect(screen.getByText(/Página 1 de 2/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Siguiente/i }));

    expect(props.setCategoryPage).toHaveBeenCalled();
  });

  it("filters categories by search and resets pagination", async () => {
    const user = userEvent.setup();
    const props = renderModal({
      availableCategories: ["Contabilidad", "Servicios", "Tesorería"],
      categoryPage: 2,
    });

    await user.type(
      screen.getByRole("searchbox", { name: /Buscar categorías/i }),
      "teso"
    );

    expect(screen.getByRole("button", { name: "Tesorería" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Contabilidad" })
    ).not.toBeInTheDocument();
    expect(props.setCategoryPage).toHaveBeenCalledWith(1);
  });
});

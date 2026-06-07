import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EditItemModal from "./EditItemModal.jsx";

describe("EditItemModal", () => {
  afterEach(() => cleanup());

  const draft = {
    name: "Servicio mensual",
    quantity: 2,
    price: 100,
    discount: 10,
  };

  it("does not render without an item draft", () => {
    render(<EditItemModal editingItemDraft={null} />);

    expect(screen.queryByText(/Editar producto/i)).not.toBeInTheDocument();
  });

  it("renders item values and calculated totals", () => {
    render(
      <EditItemModal
        editingItemDraft={draft}
        editingItemTotals={{ subtotal: 180, total: 208.8 }}
        formatCurrency={(value) => Number(value).toFixed(2)}
        onClose={() => {}}
        onApply={() => {}}
        onChangeField={() => {}}
      />,
    );

    expect(screen.getByText("Servicio mensual")).toBeVisible();
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
    expect(screen.getByText("$180.00")).toBeVisible();
    expect(screen.getByText("$208.80")).toBeVisible();
  });

  it("emits field changes and action callbacks", async () => {
    const user = userEvent.setup();
    const onChangeField = vi.fn();
    const onApply = vi.fn();
    const onClose = vi.fn();

    render(
      <EditItemModal
        editingItemDraft={draft}
        editingItemTotals={{ subtotal: 180, total: 208.8 }}
        formatCurrency={(value) => Number(value).toFixed(2)}
        onClose={onClose}
        onApply={onApply}
        onChangeField={onChangeField}
      />,
    );

    const quantityInput = screen.getByDisplayValue("2");
    fireEvent.change(quantityInput, { target: { value: "" } });
    fireEvent.change(quantityInput, { target: { value: "3" } });
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }));
    await user.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(onChangeField).toHaveBeenCalledWith("quantity", "");
    expect(onChangeField).toHaveBeenCalledWith("quantity", "3");
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

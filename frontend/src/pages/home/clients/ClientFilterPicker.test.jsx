import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClientFilterPicker from "./ClientFilterPicker.jsx";

function renderPicker(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    fieldName: "city",
    fieldConfig: { buttonLabel: "Ciudad" },
    filters: { city: "Guadalajara" },
    options: ["Guadalajara", "Monterrey"],
    filterPickerSearch: "",
    setFilterPickerSearch: vi.fn(),
    filterPickerPage: 0,
    setFilterPickerPage: vi.fn(),
    onApplyFilter: vi.fn(),
    ...overrides,
  };

  render(<ClientFilterPicker {...props} />);
  return props;
}

describe("ClientFilterPicker", () => {
  afterEach(() => cleanup());

  it("does not render when closed or field is missing", () => {
    renderPicker({ isOpen: false });
    expect(screen.queryByText(/Filtrar por/i)).not.toBeInTheDocument();
  });

  it("updates search and resets pagination", async () => {
    const user = userEvent.setup();
    const props = renderPicker();

    await user.type(screen.getByPlaceholderText(/Buscar valor/i), "Monterrey");

    expect(props.setFilterPickerSearch).toHaveBeenCalled();
    expect(props.setFilterPickerPage).toHaveBeenCalledWith(0);
  });

  it("applies selected filter and closes", async () => {
    const user = userEvent.setup();
    const props = renderPicker();

    await user.click(screen.getByRole("button", { name: "Monterrey" }));

    expect(props.onApplyFilter).toHaveBeenCalledWith("city", "Monterrey");
    expect(props.setFilterPickerSearch).toHaveBeenCalledWith("");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop", () => {
    const props = renderPicker();

    fireEvent.click(screen.getByText(/Filtrar por Ciudad/i).closest(".fixed"));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when there are no options", () => {
    renderPicker({ options: [] });

    expect(screen.getByText(/No hay valores para mostrar/i)).toBeVisible();
  });
});

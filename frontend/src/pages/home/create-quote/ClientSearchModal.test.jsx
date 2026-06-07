import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClientSearchModal from "./ClientSearchModal.jsx";

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    clientSearch: "",
    isClientSearching: false,
    clientResults: [],
    visibleClientResults: [],
    onClose: vi.fn(),
    onSearchChange: vi.fn(),
    onSelectClient: vi.fn(),
    ...overrides,
  };

  render(<ClientSearchModal {...props} />);
  return props;
}

describe("ClientSearchModal", () => {
  afterEach(() => cleanup());

  it("does not render when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText(/Buscar Cliente/i)).not.toBeInTheDocument();
  });

  it("emits search changes", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.type(screen.getByPlaceholderText(/nombre del cliente o RFC/i), "Atlas");

    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("shows loading state while searching", () => {
    renderModal({ isClientSearching: true });

    expect(screen.getByText(/Buscando clientes/i)).toBeVisible();
  });

  it("shows empty search result message", () => {
    renderModal({ clientSearch: "No Existe" });

    expect(screen.getByText(/No se encontraron clientes/i)).toBeVisible();
  });

  it("selects a visible client result", async () => {
    const user = userEvent.setup();
    const client = { id: 123456789, business_name: "Textiles Atlas", rfc: "TEX010101ABC" };
    const props = renderModal({
      clientResults: [client],
      visibleClientResults: [client],
    });

    await user.click(screen.getByText("Textiles Atlas"));

    expect(props.onSelectClient).toHaveBeenCalledWith(client);
  });
});

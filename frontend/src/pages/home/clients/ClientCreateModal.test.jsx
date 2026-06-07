import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ClientCreateModal from "./ClientCreateModal.jsx";
import { createClientApi } from "../../../actionsAPI/clients.api";
import { notificationService } from "../../../services/notificationService";

vi.mock("../../../actionsAPI/clients.api", () => ({
  createClientApi: vi.fn(),
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    toast: vi.fn(),
  },
}));

describe("ClientCreateModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<ClientCreateModal isOpen={false} onClose={() => {}} onSuccess={() => {}} />);

    expect(screen.queryByText(/Nuevo Cliente/i)).not.toBeInTheDocument();
  });

  it("submits a new client and normalizes empty optional fields to null", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    createClientApi.mockResolvedValue({ id: 1 });

    render(<ClientCreateModal isOpen onClose={() => {}} onSuccess={onSuccess} />);

    await user.type(screen.getByPlaceholderText("Ej. Empresa SA de CV"), "Textiles Atlas");
    await user.type(screen.getByPlaceholderText("XAXX010101000"), "TEX010101ABC");
    await user.type(screen.getByPlaceholderText("contacto@empresa.com"), "ventas@textiles.test");
    await user.click(screen.getByRole("button", { name: /Registrar Cliente/i }));

    await waitFor(() => {
      expect(createClientApi).toHaveBeenCalledWith({
        business_name: "Textiles Atlas",
        rfc: "TEX010101ABC",
        email1: "ventas@textiles.test",
        email2: null,
        celular: null,
        telefono: null,
        codigo_postal: null,
        ciudad: null,
      });
    });
    expect(notificationService.toast).toHaveBeenCalledWith({
      title: "Cliente registrado con éxito",
      icon: "success",
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("shows API errors without closing the form", async () => {
    const user = userEvent.setup();
    createClientApi.mockRejectedValue(new Error("RFC duplicado"));

    render(<ClientCreateModal isOpen onClose={() => {}} onSuccess={() => {}} />);

    await user.type(screen.getByPlaceholderText("Ej. Empresa SA de CV"), "Cliente Error");
    await user.click(screen.getByRole("button", { name: /Registrar Cliente/i }));

    expect(await screen.findByText(/RFC duplicado/i)).toBeVisible();
  });

  it("resets the form and closes when cancelling", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ClientCreateModal isOpen onClose={onClose} onSuccess={() => {}} />);

    await user.type(screen.getByPlaceholderText("Ej. Empresa SA de CV"), "Cliente Temporal");
    await user.click(screen.getByRole("button", { name: /Cancelar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

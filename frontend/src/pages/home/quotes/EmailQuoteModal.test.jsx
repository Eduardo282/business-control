import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import EmailQuoteModal from "./EmailQuoteModal.jsx";

const quote = {
  id: 10,
  folio: "ABCD123",
  total: 597.4,
  contact: { id: 1, full_name: "Eduardo García", email: "eduardo@test.com" },
  client: {
    contacts: [
      { id: 1, full_name: "Eduardo García", email: "eduardo@test.com" },
      { id: 2, full_name: "Ventas", email: "ventas@test.com" },
    ],
  },
  user: { full_name: "Adrian Juarez" },
};

describe("EmailQuoteModal", () => {
  afterEach(() => cleanup());

  it("does not render when closed", () => {
    render(<EmailQuoteModal isOpen={false} quote={quote} onSubmit={() => {}} />);

    expect(screen.queryByText(/Enviar por Correo/i)).not.toBeInTheDocument();
  });

  it("pre-fills contact email and message from quote data", async () => {
    render(<EmailQuoteModal isOpen quote={quote} onClose={() => {}} onSubmit={() => {}} />);

    expect(await screen.findByDisplayValue("eduardo@test.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/cotización ABCD123/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/597.40/i)).toBeInTheDocument();
  });

  it("allows selecting another contact and submits the email payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<EmailQuoteModal isOpen quote={quote} onClose={() => {}} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText(/Seleccionar contacto/i), "ventas@test.com");
    await waitFor(() => expect(screen.getByDisplayValue("ventas@test.com")).toBeInTheDocument());
    await user.clear(screen.getByLabelText(/Mensaje/i));
    await user.type(screen.getByLabelText(/Mensaje/i), "Mensaje personalizado");
    await user.click(screen.getByRole("button", { name: /Enviar Correo/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      emailTo: "ventas@test.com",
      emailMessage: "Mensaje personalizado",
    });
  });

  it("shows error and success feedback", () => {
    render(
      <EmailQuoteModal
        isOpen
        quote={quote}
        onClose={() => {}}
        onSubmit={() => {}}
        error="Correo inválido"
        success="Correo enviado"
      />,
    );

    expect(screen.getByText("Correo inválido")).toBeVisible();
    expect(screen.getByText("Correo enviado")).toBeVisible();
  });
});

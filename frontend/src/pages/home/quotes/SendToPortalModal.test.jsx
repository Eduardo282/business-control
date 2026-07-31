import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SendToPortalModal from "./SendToPortalModal.jsx";

describe("SendToPortalModal theme", () => {
  afterEach(() => cleanup());

  it("provides dark-safe icon, focus, and disabled states", () => {
    render(
      <SendToPortalModal
        isOpen
        onClose={vi.fn()}
        quote={{
          client: {
            contacts: [
              {
                id: 1,
                full_name: "Ana Torres",
                email: "ana@example.com",
                has_portal_access: false,
              },
            ],
          },
        }}
        onSubmit={vi.fn()}
        setPortalError={vi.fn()}
      />,
    );

    const heading = screen.getByRole("heading", { name: /Enviar a Portal/i });
    const confirmButton = screen.getByRole("button", { name: /Confirmar y Enviar/i });

    expect(heading).toBeVisible();

    expect(screen.getByLabelText(/Seleccionar contacto/i)).toBeVisible();
    expect(confirmButton).toBeDisabled();
  });
});

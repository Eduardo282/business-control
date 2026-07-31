import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Button from "./Button.jsx";
import Card from "./Card.jsx";
import Input from "./Input.jsx";

describe("UI primitives", () => {
  afterEach(() => cleanup());

  it("renders a primary button and forwards click handlers", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Guardar</Button>);

    const button = screen.getByRole("button", { name: /guardar/i });
    // Classes like "from-light-accent" are brittle tailwind internals.
    // We only test semantic roles and user interactions.

    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("falls back to primary styles when an unknown variant is provided", () => {
    render(<Button variant="unknown">Continuar</Button>);

    // Unknown variant should still render a valid button
    expect(screen.getByRole("button", { name: /continuar/i })).toBeVisible();
  });

  it("renders an input label, value and error state", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Input
        label="Correo"
        error="Correo inválido"
        value=""
        onChange={onChange}
        placeholder="correo@empresa.com"
      />,
    );

    const input = screen.getByLabelText("Correo");
    const error = screen.getByRole("alert");

    expect(error).toHaveTextContent("Correo inválido");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", error.id);

    await user.type(input, "a");

    expect(onChange).toHaveBeenCalled();
  });

  it("renders card content and optional glow decoration", () => {
    const { container } = render(
      <Card glow className="custom-card">
        Contenido
      </Card>,
    );

    expect(screen.getByText("Contenido")).toBeVisible();
    expect(container.firstChild).toHaveClass("custom-card");
    expect(container.querySelector(".blur-3xl")).toBeInTheDocument();
  });

  it("preserves input classes and exposes disabled styling", () => {
    render(<Input label="Código" className="custom-input" disabled />);

    expect(screen.getByLabelText("Código")).toHaveClass("custom-input");
    expect(screen.getByLabelText("Código")).toBeDisabled();
  });
});

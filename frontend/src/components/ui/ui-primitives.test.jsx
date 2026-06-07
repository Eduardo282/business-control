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
    expect(button).toHaveClass("from-light-accent");

    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("falls back to primary styles when an unknown variant is provided", () => {
    render(<Button variant="unknown">Continuar</Button>);

    expect(screen.getByRole("button", { name: /continuar/i })).toHaveClass(
      "from-light-accent",
    );
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

    expect(screen.getByText("Correo")).toBeInTheDocument();
    expect(screen.getByText("Correo inválido")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("correo@empresa.com"), "a");

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
});

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SourceSelectionModal from "./SourceSelectionModal.jsx";

describe("SourceSelectionModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the active category and all registration sources", () => {
    render(
      <SourceSelectionModal
        isOpen
        selectedCategory="Automatización"
        onClose={() => {}}
        onSelectSource={() => {}}
      />,
    );

    expect(screen.getByText(/Categoría activa:/i)).toBeInTheDocument();
    expect(screen.getByText("Automatización")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Productos de CONTPAQI/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Pólizas/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^Productos$/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Servicios/i })).toBeVisible();
  });

  it.each([
    [/Productos de CONTPAQI/i, "CONTPAQI"],
    [/Pólizas/i, "POLICY"],
    [/^Productos$/i, "PRODUCT"],
    [/Servicios/i, "SERVICE"],
  ])("emits %s source selection", async (buttonName, expectedType) => {
    const user = userEvent.setup();
    const onSelectSource = vi.fn();

    render(
      <SourceSelectionModal
        isOpen
        selectedCategory="Automatización"
        onClose={() => {}}
        onSelectSource={onSelectSource}
      />,
    );

    await user.click(screen.getByRole("button", { name: buttonName }));

    expect(onSelectSource).toHaveBeenCalledWith(expectedType);
  });
});

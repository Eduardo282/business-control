import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PortalDashboardServicesList } from "./PortalDashboardServicesList";
import { PRODUCT_TYPE_FILTER_OPTIONS } from "../productPresentation";

describe("portal services after catalog retirement", () => {
  afterEach(cleanup);

  it("keeps service search and all status filters available", () => {
    const setSearchTerm = vi.fn();
    const setStatusFilter = vi.fn();
    render(<PortalDashboardServicesList
      currentServices={[]}
      filteredServices={[]}
      searchTerm=""
      statusFilter="ALL"
      setSearchTerm={setSearchTerm}
      setStatusFilter={setStatusFilter}
    />);

    expect(screen.getByRole("heading", { name: "Mis Servicios" })).toBeVisible();
    expect(screen.queryByText(/p[oó]lizas/i)).not.toBeInTheDocument();
    expect(screen.getByText("No tienes servicios activos actualmente.")).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText("Nombre, licencia, fecha…"), { target: { value: "Soporte" } });
    expect(setSearchTerm).toHaveBeenCalledWith("Soporte");
    for (const [label, status] of [["Todos", "ALL"], ["Activo", "ACTIVE"], ["Por Vencer", "EXPIRING_SOON"], ["Vencido", "EXPIRED"], ["Cancelado", "CANCELLED"]]) {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(setStatusFilter).toHaveBeenLastCalledWith(status);
    }
  });

  it("retains product and service catalog filters without the removed type", () => {
    expect(PRODUCT_TYPE_FILTER_OPTIONS.map(option => option.value)).toEqual(["PRODUCT", "SERVICE"]);
  });
});

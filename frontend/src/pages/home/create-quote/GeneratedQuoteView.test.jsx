import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import GeneratedQuoteView from "./GeneratedQuoteView.jsx";

const generatedQuote = {
  id: 42,
  folio: "Q-000042",
  status: "PENDIENTE",
  created_at: "2026-07-15T12:00:00.000Z",
  client: { business_name: "Textiles Atlas", rfc: "TEX010101ABC" },
  contact: {
    full_name: "Ana Torres",
    position_title: "Compras",
    email: "ana@example.com",
    phone: "5551234567",
  },
  items: [
    {
      tempId: "item-1",
      name: "Servicio mensual",
      quantity: 1,
      unit_price: 100,
      discounted_unit_price: 100,
      discount: 0,
      total: 100,
    },
  ],
  grossSubtotal: 100,
  totalDiscount: 0,
  grandTotal: 100,
  ivaTotal: 16,
  totalWithIva: 116,
};

describe("GeneratedQuoteView", () => {
  afterEach(() => cleanup());

  it("renders dark-safe cards, table rows, totals, and actions", () => {
    render(
      <GeneratedQuoteView
        generatedQuote={generatedQuote}
        formatCurrency={(value) => Number(value).toFixed(2)}
        formatDateTime={() => "15 jul 2026"}
        getQuoteStatusLabel={(status) => status}
        navigate={vi.fn()}
        startNewQuote={vi.fn()}
        clampDiscount={(value) => Number(value) || 0}
      />,
    );

    expect(screen.getByText("Textiles Atlas")).toBeVisible();
    expect(screen.getByText("Servicio mensual")).toBeVisible();
    expect(screen.getAllByText("$116.00").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Ver detalle/i })).toBeVisible();
  });
});

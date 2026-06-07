import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import QuotePreviewModal from "./QuotePreviewModal.jsx";

const selectedClient = {
  business_name: "Textiles Atlas JDQS S.C.",
  rfc: "TEX091827WEF",
};

const selectedContact = {
  full_name: "Eduardo Francisco García",
  position_title: "Desarrollador",
  email: "lalito9270@gmail.com",
  phone: "52165464",
};

const items = [
  {
    tempId: "tmp-1",
    name: "Servicio Contable",
    folio: "SRV-000001",
    quantity: 2,
    price: 100,
    discount: 10,
    total: 180,
  },
  {
    tempId: "tmp-2",
    name: "Licencia CONTPAQi",
    quantity: 1,
    price: 300,
    discount: 0,
    total: 300,
  },
];

const totals = {
  grossSubtotal: 500,
  totalDiscount: 20,
  grandTotal: 480,
  ivaTotal: 76.8,
  totalWithIva: 556.8,
};

function renderModal(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    selectedClient,
    selectedContact,
    folio: "ABCD123",
    items,
    totals,
    clampDiscount: (value) => Math.max(0, Math.min(100, Number(value) || 0)),
    calculateDiscountedUnitPrice: (price, discount) => price * (1 - discount / 100),
    onSave: vi.fn(),
    loading: false,
    ...overrides,
  };

  render(<QuotePreviewModal {...props} />);
  return props;
}

describe("QuotePreviewModal", () => {
  afterEach(() => cleanup());

  it("does not render when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText(/Vista Previa de Cotización/i)).not.toBeInTheDocument();
  });

  it("renders client, contact, folio, products and totals", () => {
    renderModal();

    expect(screen.getByText("Textiles Atlas JDQS S.C.")).toBeVisible();
    expect(screen.getByText("TEX091827WEF")).toBeVisible();
    expect(screen.getByText("ABCD123")).toBeVisible();
    expect(screen.getByText("Eduardo Francisco García")).toBeVisible();
    expect(screen.getByText("Servicio Contable")).toBeVisible();
    expect(screen.getByText("SRV-000001")).toBeVisible();
    expect(screen.getByText(/3 productos/i)).toBeVisible();
    expect(screen.getByText("$556.80")).toBeVisible();
  });

  it("shows discounted unit price only when discount is present", () => {
    renderModal();

    expect(screen.getByText(/Unitario c\/desc/i)).toBeVisible();
    expect(screen.getByText(/Desc 10%/i)).toBeVisible();
  });

  it("shows no-contact state", () => {
    renderModal({ selectedContact: null });

    expect(screen.getByText(/Sin contacto asignado/i)).toBeVisible();
  });

  it("emits close and save actions and disables save while loading", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.click(screen.getByRole("button", { name: /Volver a editar/i }));
    await user.click(screen.getByRole("button", { name: /Confirmar y Generar Cotización/i }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);

    cleanup();
    renderModal({ loading: true });
    expect(screen.getByRole("button", { name: /Procesando/i })).toBeDisabled();
  });
});

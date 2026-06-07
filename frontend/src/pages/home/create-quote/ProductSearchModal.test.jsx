import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductSearchModal from "./ProductSearchModal.jsx";

function createTableMock({ rows = [], pageSize = 10, canPrevious = false, canNext = false } = {}) {
  return {
    getHeaderGroups: () => [
      {
        id: "header",
        headers: [
          {
            id: "product",
            isPlaceholder: false,
            column: { columnDef: { header: "Producto" } },
            getContext: () => ({}),
          },
          {
            id: "current_price",
            isPlaceholder: false,
            column: { columnDef: { header: "Precio" } },
            getContext: () => ({}),
          },
          {
            id: "actions",
            isPlaceholder: false,
            column: { columnDef: { header: "Acciones" } },
            getContext: () => ({}),
          },
        ],
      },
    ],
    getRowModel: () => ({ rows }),
    getState: () => ({ pagination: { pageSize, pageIndex: 0 } }),
    setPageSize: vi.fn(),
    setPageIndex: vi.fn(),
    getCanPreviousPage: () => canPrevious,
    getCanNextPage: () => canNext,
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    getPageCount: () => 2,
  };
}

function createProductRow(productName = "Servicio Soporte") {
  return {
    id: "row-1",
    getVisibleCells: () => [
      {
        id: "cell-product",
        column: {
          id: "product",
          columnDef: { cell: () => <span>{productName}</span> },
        },
        getContext: () => ({}),
      },
      {
        id: "cell-price",
        column: {
          id: "current_price",
          columnDef: { cell: () => <span>$1,200.00</span> },
        },
        getContext: () => ({}),
      },
      {
        id: "cell-actions",
        column: {
          id: "actions",
          columnDef: { cell: () => <button type="button">Agregar</button> },
        },
        getContext: () => ({}),
      },
    ],
  };
}

function renderModal(overrides = {}) {
  const productSearchTable = overrides.productSearchTable || createTableMock();
  const props = {
    isOpen: true,
    prodSearch: "",
    onSearchChange: vi.fn(),
    onClose: vi.fn(),
    productSearchTable,
    isProductSearching: false,
    prodResults: [],
    filteredProductCount: 0,
    productTypeFilter: "",
    onProductTypeFilterChange: vi.fn(),
    ...overrides,
  };

  render(<ProductSearchModal {...props} />);
  return props;
}

describe("ProductSearchModal", () => {
  afterEach(() => cleanup());

  it("does not render when closed", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByText(/Buscar Productos/i)).not.toBeInTheDocument();
  });

  it("emits search and type filter changes", async () => {
    const user = userEvent.setup();
    const props = renderModal();

    await user.type(screen.getByPlaceholderText(/folio, nombre o categoría/i), "soporte");
    await user.selectOptions(screen.getByLabelText(/Filtrar productos por tipo/i), "SERVICE");

    expect(props.onSearchChange).toHaveBeenCalled();
    expect(props.onProductTypeFilterChange).toHaveBeenCalledWith("SERVICE");
  });

  it("renders loading and empty states", () => {
    const { rerender } = render(
      <ProductSearchModal
        isOpen
        prodSearch=""
        onSearchChange={() => {}}
        onClose={() => {}}
        productSearchTable={createTableMock()}
        isProductSearching
        prodResults={[]}
      />,
    );

    expect(screen.getByText(/Buscando productos/i)).toBeVisible();

    rerender(
      <ProductSearchModal
        isOpen
        prodSearch="Conta"
        onSearchChange={() => {}}
        onClose={() => {}}
        productSearchTable={createTableMock()}
        isProductSearching={false}
        prodResults={[]}
      />,
    );

    expect(screen.getByText(/No se encontraron productos con "Conta"/i)).toBeVisible();
  });

  it("renders table rows and controls pagination", async () => {
    const user = userEvent.setup();
    const table = createTableMock({ rows: [createProductRow()], pageSize: 5, canNext: true });
    const props = renderModal({
      productSearchTable: table,
      prodResults: [{ id: 1 }],
      filteredProductCount: 1,
    });

    expect(screen.getByText("Servicio Soporte")).toBeVisible();
    expect(screen.getByText("1 producto(s) encontrado(s)")).toBeVisible();

    await user.selectOptions(screen.getByDisplayValue("5"), "25");
    await user.click(screen.getByRole("button", { name: /Siguiente/i }));
    await user.click(screen.getByRole("button", { name: /Cerrar/i }));

    expect(table.setPageSize).toHaveBeenCalledWith(25);
    expect(table.setPageIndex).toHaveBeenCalledWith(0);
    expect(table.nextPage).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("explains empty type-filtered results", () => {
    renderModal({
      productTypeFilter: "SERVICE",
      prodResults: [{ id: 1 }],
      filteredProductCount: 0,
    });

    expect(screen.getByText(/No hay productos para el tipo seleccionado/i)).toBeVisible();
  });
});

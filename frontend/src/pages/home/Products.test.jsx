import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  buildProductsPdfTableData,
  groupProductsByName,
} from "./products/productHelpers";
import { FolioSelectionModal } from "./products/FolioSelectionModal";

const products = [
  {
    id: 1,
    name: "CONTPAQ 2026",
    folio: "PRD-000017",
    category: "Product CONTPAQI",
    current_price: 12,
    users_count: 8,
  },
  {
    id: 2,
    name: "contpaq 2026",
    folio: "PRD-000018",
    category: "Product CONTPAQI",
    current_price: 25,
    users_count: 1,
  },
  {
    id: 3,
    name: "Otro producto",
    folio: "PRD-000019",
    current_price: 40,
  },
];

describe("groupProductsByName", () => {
  it("creates one row for products sharing the same normalized name", () => {
    const rows = groupProductsByName(products);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: 1,
      folio: "PRD-000017",
      _groupKey: "contpaq 2026",
      _groupCount: 2,
    });
    expect(rows[0]._groupItems.map((product) => product.folio)).toEqual([
      "PRD-000017",
      "PRD-000018",
    ]);
  });

  it("uses the selected folio product as the complete visible row", () => {
    const rows = groupProductsByName(products, { "contpaq 2026": 2 });

    expect(rows[0]).toMatchObject({
      id: 2,
      folio: "PRD-000018",
      current_price: 25,
      users_count: 1,
      _groupCount: 2,
    });
  });
});

describe("buildProductsPdfTableData", () => {
  it("exports grouped product quantities instead of assuming one per row", () => {
    const rows = groupProductsByName(products);
    const table = buildProductsPdfTableData(rows);

    expect(table.head[0]).toContain("CANTIDAD");
    expect(table.totalProducts).toBe(3);
    expect(table.body[0]).toEqual([
      "PRD-000017",
      "CONTPAQ 2026",
      "Product CONTPAQI",
      "2",
      "$12.00",
      8,
      "",
    ]);
  });
});

describe("FolioSelectionModal", () => {
  it("shows every folio and returns the selected product", () => {
    const onSelect = vi.fn();

    render(
      <FolioSelectionModal
        group={{
          key: "contpaq 2026",
          name: "CONTPAQ 2026",
          items: products.slice(0, 2),
          selectedId: 1,
        }}
        onClose={vi.fn()}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("PRD-000017")).toBeInTheDocument();
    fireEvent.click(screen.getByText("PRD-000018"));

    expect(onSelect).toHaveBeenCalledWith("contpaq 2026", products[1]);
  });
});

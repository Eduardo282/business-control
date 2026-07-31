import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  formatQuoteProductVariantOption,
  groupQuoteProductResults,
  QuoteProductVariantSelect,
} from "./CreateQuote.jsx";

describe("groupQuoteProductResults", () => {
  it("groups repeated products by normalized name even when folios differ", () => {
    const rows = groupQuoteProductResults([
      {
        id: 7,
        name: "Tacos a domicilio",
        folio: "SRV-000007",
        category: "Comida",
      },
      {
        id: 3,
        name: "tacos a domicilio",
        folio: "SRV-000003",
        category: "Comida",
      },
      {
        id: 8,
        name: "Pizza a domicilio",
        folio: "SRV-000008",
        category: "Comida",
      },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      id: 3,
      folio: "SRV-000003",
      _groupKey: "tacos a domicilio",
      _groupCount: 2,
    });
    expect(rows[0]._groupItems.map((product) => product.folio)).toEqual([
      "SRV-000003",
      "SRV-000007",
    ]);
  });

  it("uses the selected grouped product variant as the visible row", () => {
    const rows = groupQuoteProductResults(
      [
        {
          id: 7,
          name: "Tacos a domicilio",
          folio: "SRV-000007",
          category: "Comida",
          current_price: 454,
        },
        {
          id: 3,
          name: "tacos a domicilio",
          folio: "SRV-000003",
          category: "Comida",
          current_price: 500,
        },
      ],
      { "tacos a domicilio": 7 },
    );

    expect(rows[0]).toMatchObject({
      id: 7,
      folio: "SRV-000007",
      current_price: 454,
      _groupCount: 2,
    });
  });
});

describe("formatQuoteProductVariantOption", () => {
  it("shows folio and price for a product variant", () => {
    expect(
      formatQuoteProductVariantOption({
        folio: "SRV-000003",
        current_price: 500,
      }),
    ).toBe("SRV-000003 · $500.00");
  });
});

describe("QuoteProductVariantSelect", () => {
  it("lets the user choose a grouped product folio and price", async () => {
    const user = userEvent.setup();
    const onSelectVariant = vi.fn();
    const product = groupQuoteProductResults([
      {
        id: 3,
        name: "Tacos a domicilio",
        folio: "SRV-000003",
        category: "Comida",
        current_price: 500,
      },
      {
        id: 7,
        name: "Tacos a domicilio",
        folio: "SRV-000007",
        category: "Comida",
        current_price: 454,
      },
    ])[0];

    render(
      <QuoteProductVariantSelect
        product={product}
        onSelectVariant={onSelectVariant}
      />,
    );

    expect(screen.getByLabelText(/Elegir folio y precio/i)).toBeVisible();

    await user.selectOptions(
      screen.getByLabelText(/Elegir folio y precio/i),
      "7",
    );

    expect(onSelectVariant).toHaveBeenCalledWith("tacos a domicilio", "7");
  });
});

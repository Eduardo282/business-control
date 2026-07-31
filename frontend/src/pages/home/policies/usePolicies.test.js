import { describe, expect, it } from "vitest";
import {
  buildSalesPdfTableData,
  filterSales,
  formatSaleDate,
  getSalesMetrics,
  getSalesFilterOptions,
  isRegisteredPortalSale,
} from "./usePolicies";

const sales = [
  {
    id: 16,
    folio: "BHKY876",
    registered_at: "2026-06-05T22:58:00.000Z",
    total: 1508,
    client: { business_name: "Textiles Atlas" },
    contact: { full_name: "Eduardo García", email: "eduardo@example.com" },
    items: [],
  },
  {
    id: 24,
    folio: "RRXZ036",
    registered_at: "2026-06-12T19:09:00.000Z",
    total: 48.72,
    client: { business_name: "Textiles Atlas" },
    contact: { full_name: "Eduardo García", email: "eduardo@example.com" },
    items: [],
  },
];

describe("sales filters", () => {
  it("includes only accepted registered portal quotes in the accepted quotes section", () => {
    const registeredQuote = {
      status: "ACEPTADA",
      is_registered: true,
      is_sent_to_client_portal: true,
      contact: { id: 7 },
    };

    expect(isRegisteredPortalSale(registeredQuote)).toBe(true);
    expect(
      isRegisteredPortalSale({
        ...registeredQuote,
        status: "ENVIADA",
      }),
    ).toBe(false);
    expect(
      isRegisteredPortalSale({
        ...registeredQuote,
        status: "RECHAZADA",
      }),
    ).toBe(false);
  });

  it("builds unique date and folio options", () => {
    const options = getSalesFilterOptions([...sales, sales[0]]);

    expect(options.folios).toEqual(["BHKY876", "RRXZ036"]);
    expect(options.saleDates).toEqual(
      expect.arrayContaining(
        sales.map((sale) => formatSaleDate(sale.registered_at)),
      ),
    );
    expect(options.saleDates).toHaveLength(2);
  });

  it("filters by the selected sale date", () => {
    const result = filterSales(sales, "", {
      saleDate: formatSaleDate(sales[1].registered_at),
      folio: "",
    });

    expect(result.map((sale) => sale.id)).toEqual([24]);
  });

  it("filters by the selected folio without affecting global search", () => {
    const result = filterSales(sales, "textiles", {
      saleDate: "",
      folio: "BHKY876",
    });

    expect(result.map((sale) => sale.id)).toEqual([16]);
  });

  it("counts registered quotes without calculating sold totals", () => {
    const metrics = getSalesMetrics(sales);

    expect(metrics.totalSales).toBe(2);
    expect(metrics.uniqueClients).toBe(1);
    expect(metrics).not.toHaveProperty("totalAmount");
  });

  it("includes product quantity in the PDF table", () => {
    const table = buildSalesPdfTableData([
      {
        quote: "Cotización #27",
        folio: "XBHB141",
        cliente: "Empresa de bimbo coca cola",
        contacto: "Eduardo García",
        productos: "contpaq 2026",
        cantidad: 3,
        total: 41.76,
        quoteDate: "12/06/2026, 1:32 p.m.",
      },
    ]);

    expect(table.head[0]).toContain("COTIZACIÓN");
    expect(table.head[0]).toContain("CANTIDAD");
    expect(table.body[0][5]).toBe(3);
  });
});

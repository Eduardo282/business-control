import { describe, expect, it } from "vitest";

import {
  buildExportColumns,
  filterClients,
  getFixedMainColumnNames,
  getFilterPickerOptions,
  getPrimaryTableColumns,
  groupDetailColumnsByPrimary,
  sortClientRowsForExcelView,
} from "./clientTableHelpers";

describe("clientTableHelpers", () => {
  it("keeps four unique Excel columns as the fixed table columns", () => {
    expect(
      getFixedMainColumnNames([
        "business_name",
        "rfc",
        "business_name",
        "email1",
        "celular",
        "ciudad",
      ]),
    ).toEqual(["business_name", "rfc", "email1", "celular"]);
  });

  it("fills missing fixed columns from the configured table order", () => {
    const columns = [
      { name: "business_name" },
      { name: "rfc" },
      { name: "email1" },
      { name: "celular" },
      { name: "ciudad" },
    ];

    expect(
      getPrimaryTableColumns(columns, ["rfc", "missing"]),
    ).toEqual([
      { name: "rfc" },
      { name: "business_name" },
      { name: "email1" },
      { name: "celular" },
    ]);
  });

  it("deduplicates and sorts filter values without accents or case", () => {
    expect(
      getFilterPickerOptions(
        [
          { city: " Mérida " },
          { city: "merida" },
          { city: "Álvaro Obregón" },
          { city: "" },
        ],
        "city",
      ),
    ).toEqual(["Álvaro Obregón", "Mérida"]);
  });

  it("combines accent-insensitive search with exact field filters", () => {
    const clients = [
      { business_name: "Árbol SA", city: "Mérida" },
      { business_name: "Arboleda", city: "Monterrey" },
    ];

    expect(
      filterClients({
        allClients: clients,
        query: "arbol",
        filters: { city: "merida" },
        searchableColumns: [{ name: "business_name" }, { name: "city" }],
      }),
    ).toEqual([clients[0]]);
  });

  it("prioritizes imported rows and then the newest numeric id", () => {
    const clients = [
      { id: 1, email1: "" },
      { id: 2, email1: "two@example.com" },
      { id: 3, email1: "three@example.com" },
    ];

    expect(sortClientRowsForExcelView(clients, ["email1"])).toEqual([
      clients[2],
      clients[1],
      clients[0],
    ]);
  });

  it("balances unrelated detail columns across primary columns", () => {
    const primary = [{ name: "business_name" }, { name: "rfc" }];
    const details = [{ name: "city" }, { name: "phone" }];

    expect(groupDetailColumnsByPrimary(details, primary)).toEqual({
      business_name: [details[0]],
      rfc: [details[1]],
    });
  });

  it("makes duplicate export labels unique using the field name", () => {
    expect(
      buildExportColumns([
        { name: "email1", label: "Correo" },
        { name: "email2", label: "Correo" },
      ]),
    ).toEqual([
      { name: "email1", label: "Correo" },
      { name: "email2", label: "Correo (email2)" },
    ]);
  });
});

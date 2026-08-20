import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  buildExcelWorkbook,
  calculateExcelColumnWidths,
  estimateExcelRowHeight,
  getExcelHeaders,
} from "./excelExport";

describe("getExcelHeaders", () => {
  it("keeps columns that first appear in later dynamic rows", () => {
    expect(
      getExcelHeaders([
        { Cliente: "Empresa A", RFC: "AAA010101AAA" },
        { Cliente: "Empresa B", Teléfono: "0012345678" },
      ]),
    ).toEqual(["Cliente", "RFC", "Teléfono"]);
  });
});

describe("calculateExcelColumnWidths", () => {
  it("uses content-aware widths without creating unbounded columns", () => {
    const widths = calculateExcelColumnWidths({
      headers: ["Folio", "Descripción", "Total"],
      rows: [
        {
          Folio: "PRD-000006",
          Descripción: "A".repeat(200),
          Total: 6390,
        },
      ],
    });

    expect(widths).toEqual([12, 48, 10]);
  });

  it("honors configured template widths inside safe bounds", () => {
    const widths = calculateExcelColumnWidths({
      headers: ["Nombre", "Correo", "Notas"],
      widths: [4, 22, 100],
    });

    expect(widths).toEqual([10, 22, 48]);
  });
});

describe("estimateExcelRowHeight", () => {
  it("grows for wrapped text and caps excessively long rows", () => {
    expect(estimateExcelRowHeight(["Texto corto"], [20])).toBe(20);
    expect(estimateExcelRowHeight(["A".repeat(500)], [20])).toBe(72);
  });
});

describe("buildExcelWorkbook", () => {
  it("builds a readable filtered sheet while preserving value types", () => {
    const workbook = buildExcelWorkbook(ExcelJS, {
      sheetName: "Ventas",
      rows: [
        {
          Folio: "VTA-000001",
          Teléfono: "0012345678",
          Productos: "Servicio con una descripción suficientemente larga",
          Total: 6390,
        },
      ],
    });
    const worksheet = workbook.getWorksheet("Ventas");

    expect(worksheet.views[0]).toMatchObject({ state: "frozen", ySplit: 1 });
    expect(worksheet.autoFilter).toEqual({
      from: { row: 1, column: 1 },
      to: { row: 2, column: 4 },
    });
    expect(worksheet.getCell("A1").font).toMatchObject({
      bold: true,
      color: { argb: "FFFFFFFF" },
    });
    expect(worksheet.getCell("A2").value).toBe("VTA-000001");
    expect(worksheet.getCell("B2").value).toBe("0012345678");
    expect(worksheet.getCell("D2").value).toBe(6390);
    expect(worksheet.getCell("D2").numFmt).toBe('"$"#,##0.00');
    expect(worksheet.getCell("C2").alignment.wrapText).toBe(true);
    expect(worksheet.columns.every((column) => column.width <= 48)).toBe(true);
  });

  it("serializes valid files and protects Excel-sensitive values", async () => {
    const workbook = buildExcelWorkbook(ExcelJS, {
      sheetName: "Clientes",
      rows: [
        {
          "ID cliente": 1234567890123456,
          Medición: 12.345678,
          Notas: "A".repeat(40000),
        },
      ],
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const reopenedWorkbook = new ExcelJS.Workbook();
    await reopenedWorkbook.xlsx.load(buffer);
    const worksheet = reopenedWorkbook.getWorksheet("Clientes");

    expect(worksheet.getCell("A2").value).toBe("1234567890123456");
    expect(worksheet.getCell("B2").value).toBe(12.345678);
    expect(worksheet.getCell("B2").numFmt).toBe("#,##0.######");
    expect(worksheet.getCell("C2").value).toHaveLength(32767);
    expect(worksheet.getCell("C2").value.endsWith("...")).toBe(true);
  });

  it("formats template headers even when there are no data rows", () => {
    const workbook = buildExcelWorkbook(ExcelJS, {
      headers: ["Nombre", "Correo"],
      rows: [],
      sheetName: "Plantilla Contactos",
      widths: [20, 30],
    });
    const worksheet = workbook.getWorksheet("Plantilla Contactos");

    expect(worksheet.rowCount).toBe(1);
    expect(worksheet.getCell("A1").value).toBe("Nombre");
    expect(worksheet.columns.map((column) => column.width)).toEqual([20, 30]);
    expect(worksheet.autoFilter).toEqual({
      from: { row: 1, column: 1 },
      to: { row: 1, column: 2 },
    });
  });
});

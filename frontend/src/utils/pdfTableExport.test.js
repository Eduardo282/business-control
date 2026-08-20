import { describe, expect, it, vi } from "vitest";

import {
  addPdfPageFooters,
  buildPdfTableOptions,
} from "./pdfTableExport";

function createPdfDocument(pageCount = 1) {
  return {
    addImage: vi.fn(),
    getNumberOfPages: vi.fn(() => pageCount),
    internal: {
      pageSize: {
        getHeight: vi.fn(() => 210),
        getWidth: vi.fn(() => 297),
      },
    },
    line: vi.fn(),
    setDrawColor: vi.fn(),
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setLineWidth: vi.fn(),
    setPage: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
  };
}

describe("buildPdfTableOptions", () => {
  it("keeps a compact table on one horizontal section", () => {
    const doc = createPdfDocument();
    const options = buildPdfTableOptions({
      doc,
      title: "Productos",
      head: [["FOLIO", "PRODUCTO", "PRECIO"]],
      body: [["PRD-1", "Producto", "$10.00"]],
    });

    expect(options.horizontalPageBreak).toBeUndefined();
    expect(options.rowPageBreak).toBe("avoid");
    expect(options.showHead).toBe("everyPage");

    options.didDrawPage({ pageNumber: 1 });

    expect(doc.addImage).toHaveBeenCalledOnce();
    expect(doc.text).toHaveBeenCalledWith(
      "Productos",
      14,
      15,
      expect.objectContaining({ maxWidth: expect.any(Number) }),
    );
  });

  it("splits very wide tables horizontally and repeats the first column", () => {
    const doc = createPdfDocument();
    const columns = Array.from({ length: 9 }, (_, index) => `C${index + 1}`);
    const options = buildPdfTableOptions({
      doc,
      title: "Clientes",
      head: [columns],
      body: [columns],
    });

    expect(options).toMatchObject({
      horizontalPageBreak: true,
      horizontalPageBreakBehaviour: "afterAllRows",
      horizontalPageBreakRepeat: 0,
    });
  });
});

describe("addPdfPageFooters", () => {
  it("numbers every generated page", () => {
    const doc = createPdfDocument(2);

    addPdfPageFooters(doc);

    expect(doc.setPage.mock.calls).toEqual([[1], [2]]);
    expect(doc.text).toHaveBeenCalledWith(
      "Página 1 de 2",
      283,
      204,
      { align: "right" },
    );
    expect(doc.text).toHaveBeenCalledWith(
      "Página 2 de 2",
      283,
      204,
      { align: "right" },
    );
  });
});

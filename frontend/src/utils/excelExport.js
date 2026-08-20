const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 48;
const HEADER_ROW_HEIGHT = 28;
const DEFAULT_ROW_HEIGHT = 20;
const MAX_ROW_HEIGHT = 72;
const MAX_CELL_TEXT_LENGTH = 32767;

const HEADER_FILL = "FF1F4E78";
const HEADER_TEXT = "FFFFFFFF";
const ALTERNATE_ROW_FILL = "FFF7F9FC";
const DIVIDER_COLOR = "FFDCE3EA";

const MONEY_HEADER_PATTERN =
  /(^|\s)(precio|total|importe|monto|subtotal|costo)(\s|$)/i;
const IDENTIFIER_HEADER_PATTERN =
  /(^|[\s_])(id|folio|rfc|tel[eé]fono|celular|sku|c[oó]digo(?:\s+postal)?|c\.?\s*p\.?)([\s_]|$)/i;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function limitCellText(value) {
  const text = String(value);
  if (text.length <= MAX_CELL_TEXT_LENGTH) return text;
  return `${text.slice(0, MAX_CELL_TEXT_LENGTH - 3)}...`;
}

function getDisplayText(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : value.toISOString().slice(0, 10);
  }
  if (Array.isArray(value)) return limitCellText(value.join(", "));
  if (typeof value === "object") {
    try {
      return limitCellText(JSON.stringify(value));
    } catch {
      return limitCellText(value);
    }
  }
  return limitCellText(value);
}

function getLongestLineLength(value) {
  return getDisplayText(value)
    .split(/\r?\n/)
    .reduce((longest, line) => Math.max(longest, line.length), 0);
}

function normalizeCellValue(value, header) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value;
  }
  if (typeof value === "string") return limitCellText(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    if (
      IDENTIFIER_HEADER_PATTERN.test(header) ||
      (Number.isInteger(value) && Math.abs(value) >= 1e15)
    ) {
      return String(value);
    }
    return value;
  }
  if (typeof value === "boolean") return value;
  return getDisplayText(value);
}

function sanitizeSheetName(sheetName) {
  const sanitized = String(sheetName || "Datos")
    .replace(/[\\/?*\[\]:]/g, " ")
    .trim();

  return (sanitized || "Datos").slice(0, 31);
}

export function getExcelHeaders(rows = []) {
  const headers = [];
  const seen = new Set();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((header) => {
      if (seen.has(header)) return;
      seen.add(header);
      headers.push(header);
    });
  });

  return headers;
}

export function calculateExcelColumnWidths({
  headers,
  rows = [],
  widths = [],
}) {
  return headers.map((header, columnIndex) => {
    const requestedWidth = Number(widths[columnIndex]);
    if (Number.isFinite(requestedWidth) && requestedWidth > 0) {
      return clamp(requestedWidth, MIN_COLUMN_WIDTH, MAX_COLUMN_WIDTH);
    }

    const contentWidth = rows.reduce(
      (largest, row) =>
        Math.max(largest, getLongestLineLength(row?.[header])),
      0,
    );

    return clamp(
      Math.max(getLongestLineLength(header) + 4, contentWidth + 2),
      MIN_COLUMN_WIDTH,
      MAX_COLUMN_WIDTH,
    );
  });
}

export function estimateExcelRowHeight(values, columnWidths) {
  const lineCount = values.reduce((largest, value, index) => {
    const availableWidth = Math.max((columnWidths[index] || 12) - 2, 1);
    const wrappedLines = getDisplayText(value)
      .split(/\r?\n/)
      .reduce(
        (total, line) =>
          total + Math.max(1, Math.ceil(line.length / availableWidth)),
        0,
      );

    return Math.max(largest, wrappedLines);
  }, 1);

  return clamp(
    DEFAULT_ROW_HEIGHT + (lineCount - 1) * 15,
    DEFAULT_ROW_HEIGHT,
    MAX_ROW_HEIGHT,
  );
}

function getNumberFormat(header, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (MONEY_HEADER_PATTERN.test(header)) return '"$"#,##0.00';
  return Number.isInteger(value) ? "#,##0" : "#,##0.######";
}

function applyHeaderStyle(row) {
  row.height = HEADER_ROW_HEIGHT;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: HEADER_TEXT }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: DIVIDER_COLOR } },
    };
  });
}

function applyDataRowStyle(row, headers, sourceValues, rowIndex) {
  row.height = estimateExcelRowHeight(
    sourceValues,
    row.worksheet.columns.map((column) => column.width),
  );

  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    const cellValue = cell.value;
    cell.alignment = {
      horizontal: typeof cellValue === "number" ? "right" : "left",
      vertical: "top",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "hair", color: { argb: DIVIDER_COLOR } },
      right: { style: "hair", color: { argb: DIVIDER_COLOR } },
    };

    if (rowIndex % 2 === 0) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: ALTERNATE_ROW_FILL },
      };
    }

    const numberFormat = getNumberFormat(
      headers[columnNumber - 1],
      cellValue,
    );
    if (numberFormat) cell.numFmt = numberFormat;
  });
}

export function buildExcelWorkbook(
  ExcelJS,
  { rows = [], headers: providedHeaders, sheetName, widths = [] },
) {
  const headers = providedHeaders || getExcelHeaders(rows);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Business Control";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(sanitizeSheetName(sheetName), {
    properties: { defaultRowHeight: DEFAULT_ROW_HEIGHT },
    views: [
      {
        state: "frozen",
        ySplit: 1,
        activeCell: "A2",
        showGridLines: false,
      },
    ],
    pageSetup: {
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      orientation: headers.length > 7 ? "landscape" : "portrait",
      paperSize: 9,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.5,
        bottom: 0.5,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  if (!headers.length) return workbook;

  const columnWidths = calculateExcelColumnWidths({ headers, rows, widths });
  worksheet.columns = headers.map((header, index) => ({
    header,
    key: `column_${index}`,
    width: columnWidths[index],
  }));

  applyHeaderStyle(worksheet.getRow(1));

  rows.forEach((sourceRow, index) => {
    const sourceValues = headers.map((header) => sourceRow?.[header]);
    const row = worksheet.addRow(
      sourceValues.map((value, columnIndex) =>
        normalizeCellValue(value, headers[columnIndex]),
      ),
    );
    applyDataRowStyle(row, headers, sourceValues, index + 1);
  });

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(rows.length + 1, 1), column: headers.length },
  };
  worksheet.pageSetup.printTitlesRow = "1:1";
  worksheet.headerFooter.oddFooter = "&RPágina &P de &N";

  return workbook;
}

async function loadExcelJs() {
  const module = await import("exceljs");
  const ExcelJS = module.default || module;

  if (!ExcelJS?.Workbook) {
    throw new Error("No se pudo cargar el generador de Excel.");
  }

  return ExcelJS;
}

function downloadExcelBuffer(buffer, fileName) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function writeExcelFile(options) {
  const ExcelJS = await loadExcelJs();
  const workbook = buildExcelWorkbook(ExcelJS, options);
  const buffer = await workbook.xlsx.writeBuffer();
  downloadExcelBuffer(buffer, options.fileName);
}

export async function exportRowsToExcel({ rows, sheetName, fileName }) {
  await writeExcelFile({ rows, sheetName, fileName });
}

export async function exportTemplateToExcel({
  columns,
  sheetName,
  fileName,
  widths = [],
}) {
  await writeExcelFile({
    rows: [],
    headers: columns,
    sheetName,
    fileName,
    widths,
  });
}

/**
 * ExcelParser — Responsabilidad Única: leer un buffer Excel y extraer headers + filas normalizadas.
 * No sabe nada de base de datos, descargas ni mapeo de columnas SQL.
 */
import * as XLSX from "xlsx";

/**
 * Garantiza que los headers sean únicos (agrega sufijos _2, _3, etc. si hay duplicados).
 * @param {string[]} headers
 * @returns {string[]}
 */
export function ensureUniqueHeaders(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = String(header || `column_${index + 1}`);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

/**
 * Parsea un buffer Excel y retorna headers + filas como objetos clave-valor.
 * @param {Buffer} fileBuffer — Buffer del archivo Excel
 * @returns {{ headers: string[], rows: object[] }}
 * @throws {Error} Si el archivo está vacío o no contiene hojas válidas
 */
export function parseExcelBuffer(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("El archivo no contiene hojas válidas.");

  const matrix = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });
  if (!matrix.length)
    throw new Error("El archivo está vacío o no contiene filas para importar.");

  const firstRow = matrix[0] || [];
  const headers = ensureUniqueHeaders(
    firstRow.map((value, index) => {
      const text = String(value || "").trim();
      return text || `column_${index + 1}`;
    }),
  );

  const rows = matrix
    .slice(1)
    .map((rowValues) => {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = rowValues?.[index] ?? "";
      });
      return row;
    })
    .filter((row) =>
      Object.values(row).some((value) => String(value || "").trim() !== ""),
    );

  if (!rows.length) {
    throw new Error(
      "El archivo no contiene filas de datos debajo del encabezado.",
    );
  }

  return { headers, rows };
}

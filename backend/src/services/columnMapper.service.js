/**
 * ColumnMapper — Responsabilidad Única: mapear headers de Excel a columnas SQL existentes.
 * Incluye lógica de fuzzy matching, aliases y fallback por posición.
 * No sabe nada de descargas, Excel parsing ni ALTER TABLE.
 */

const SYSTEM_MANAGED_COLUMNS = new Set(["created_by_user_id"]);

/**
 * Normaliza un texto a un identificador snake_case sin acentos.
 * @param {string} value
 * @returns {string}
 */
export function normaliseKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Tokeniza un identificador normalizado en partes individuales.
 * @param {string} normalisedValue
 * @returns {string[]}
 */
function tokenise(normalisedValue) {
  return String(normalisedValue || "")
    .split("_")
    .filter(Boolean);
}

/**
 * Calcula un score de similitud entre un header normalizado y un nombre de columna.
 * @param {string} headerNormalised
 * @param {string} columnNormalised
 * @returns {number} Score entre 0 y 1
 */
export function scoreHeaderToColumn(headerNormalised, columnNormalised) {
  if (!headerNormalised || !columnNormalised) return 0;
  if (headerNormalised === columnNormalised) return 1;

  if (
    (headerNormalised.length >= 3 &&
      columnNormalised.includes(headerNormalised)) ||
    (columnNormalised.length >= 3 &&
      headerNormalised.includes(columnNormalised))
  ) {
    return 0.78;
  }

  const headerTokens = tokenise(headerNormalised);
  const columnTokens = tokenise(columnNormalised);
  if (!headerTokens.length || !columnTokens.length) return 0;

  const columnTokenSet = new Set(columnTokens);
  const common = headerTokens.filter((token) =>
    columnTokenSet.has(token),
  ).length;
  return common / Math.max(headerTokens.length, columnTokens.length);
}

/**
 * Mapea headers de Excel a columnas SQL usando alias exactos, fuzzy matching y fallback por posición.
 * @param {string[]} headers — Headers del Excel
 * @param {object[]} availableColumns — Columnas disponibles en la tabla SQL ({ name, ... })
 * @param {object} [options]
 * @param {string[]} [options.orderedHeaders] — Headers en orden preferido
 * @returns {{ mapped: object, unmatched: string[], mappingMode: string }}
 */
export function getHeaderToColumnMap(headers, availableColumns, options = {}) {
  const orderedHeaders =
    Array.isArray(options.orderedHeaders) && options.orderedHeaders.length
      ? options.orderedHeaders
      : headers;

  const usableColumns = availableColumns.filter(
    (column) => !SYSTEM_MANAGED_COLUMNS.has(column.name),
  );

  const byNormalisedColumn = new Map(
    usableColumns.map((column) => [normaliseKey(column.name), column.name]),
  );

  const aliases = {
    razon_social: "business_name",
    razon: "business_name",
    empresa: "business_name",
    nombre: "business_name",
    correo: "email1",
    correo_principal: "email1",
    correo_secundario: "email2",
    telefono: "telefono",
    movil: "celular",
    codigo_postal: "codigo_postal",
    cp: "codigo_postal",
  };

  const mapped = {};
  const usedColumns = new Set();
  let mappingMode = "name";

  const tryResolveAlias = (header) => {
    const normalisedHeader = normaliseKey(header);

    let targetColumn = byNormalisedColumn.get(normalisedHeader);
    if (!targetColumn && aliases[normalisedHeader]) {
      const aliasColumn = aliases[normalisedHeader];
      if (byNormalisedColumn.has(normaliseKey(aliasColumn))) {
        targetColumn = aliasColumn;
      }
    }

    return targetColumn;
  };

  // Fase 1: coincidencia exacta o alias
  for (const header of orderedHeaders) {
    const targetColumn = tryResolveAlias(header);
    if (targetColumn && !usedColumns.has(targetColumn)) {
      mapped[header] = targetColumn;
      usedColumns.add(targetColumn);
    }
  }

  // Fase 2: fuzzy matching
  for (const header of orderedHeaders) {
    if (mapped[header]) continue;

    const normalisedHeader = normaliseKey(header);
    let best = null;
    let bestScore = 0;

    for (const column of usableColumns) {
      if (usedColumns.has(column.name)) continue;
      const score = scoreHeaderToColumn(
        normalisedHeader,
        normaliseKey(column.name),
      );
      if (score > bestScore) {
        best = column.name;
        bestScore = score;
      }
    }

    if (best && bestScore >= 0.6) {
      mapped[header] = best;
      usedColumns.add(best);
      mappingMode = mappingMode === "name" ? "fuzzy" : mappingMode;
    }
  }

  // Fase 3: fallback por posición
  if (!Object.keys(mapped).length) {
    const fallbackSize = Math.min(orderedHeaders.length, usableColumns.length);
    for (let index = 0; index < fallbackSize; index += 1) {
      mapped[orderedHeaders[index]] = usableColumns[index].name;
    }
    mappingMode = "position";
  }

  const unmatched = headers.filter((header) => !mapped[header]);

  return { mapped, unmatched, mappingMode };
}

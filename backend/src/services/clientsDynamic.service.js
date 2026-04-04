import axios from "axios";
import * as XLSX from "xlsx";
import { pool } from "../config/db.js";

const CLIENTS_TABLE = "clients";
const CLIENTS_COLUMN_META_TABLE = "clients_column_meta";
const HIDDEN_COLUMNS = new Set(["portal_password_hash"]);
const INSERT_EXCLUDED_COLUMNS = new Set([
  "id",
  "created_at",
  "updated_at",
  "portal_password_hash",
]);
const UPDATE_EXCLUDED_COLUMNS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by_user_id",
  "portal_password_hash",
]);
const SYSTEM_MANAGED_COLUMNS = new Set(["created_by_user_id"]);
const RESERVED_COLUMN_NAMES = new Set([
  "select",
  "from",
  "where",
  "group",
  "order",
  "by",
  "table",
  "column",
]);

async function ensureClientsColumnMetaTable() {
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS ${escapeIdentifier(CLIENTS_COLUMN_META_TABLE)} (
        column_name VARCHAR(128) NOT NULL PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        display_order INT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `,
  );
}

function normaliseLabel(value) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

async function getStoredColumnMeta(columnNames) {
  if (!Array.isArray(columnNames) || !columnNames.length) {
    return new Map();
  }

  await ensureClientsColumnMetaTable();

  const params = {};
  const tokens = columnNames.map((columnName, index) => {
    const token = `column_${index}`;
    params[token] = columnName;
    return `:${token}`;
  });

  const [rows] = await pool.query(
    `
      SELECT column_name, label, display_order
      FROM ${escapeIdentifier(CLIENTS_COLUMN_META_TABLE)}
      WHERE column_name IN (${tokens.join(",")})
    `,
    params,
  );

  const mapped = rows.map((row) => {
    const asNumber = Number(row.display_order);
    return [
      row.column_name,
      {
        label: normaliseLabel(row.label),
        displayOrder: Number.isInteger(asNumber) ? asNumber : null,
      },
    ];
  });

  return new Map(mapped);
}

function buildMappedColumnMeta(orderedHeaders, mappedPairs) {
  if (!Array.isArray(orderedHeaders) || !orderedHeaders.length) return [];

  const seenColumns = new Set();
  const result = [];

  orderedHeaders.forEach((header) => {
    const columnName = mappedPairs?.[header];
    const label = normaliseLabel(header);

    if (!columnName || !label) return;
    if (HIDDEN_COLUMNS.has(columnName) || seenColumns.has(columnName)) return;

    seenColumns.add(columnName);
    result.push({
      columnName,
      label,
      displayOrder: result.length,
    });
  });

  return result;
}

async function upsertMappedColumnMeta(mappedColumnMeta) {
  if (!mappedColumnMeta?.length) return;

  await ensureClientsColumnMetaTable();

  // Keep labels history but reset order so the latest import defines visible order.
  await pool.query(
    `
      UPDATE ${escapeIdentifier(CLIENTS_COLUMN_META_TABLE)}
      SET display_order = NULL
    `,
  );

  const params = {};
  const valuesSql = mappedColumnMeta
    .map((entry, index) => {
      const columnToken = `column_${index}`;
      const labelToken = `label_${index}`;
      const orderToken = `order_${index}`;

      params[columnToken] = entry.columnName;
      params[labelToken] = entry.label;
      params[orderToken] = entry.displayOrder;

      return `(:${columnToken}, :${labelToken}, :${orderToken})`;
    })
    .join(", ");

  await pool.query(
    `
      INSERT INTO ${escapeIdentifier(CLIENTS_COLUMN_META_TABLE)} (
        column_name,
        label,
        display_order
      )
      VALUES ${valuesSql}
      ON DUPLICATE KEY UPDATE
        label = VALUES(label),
        display_order = VALUES(display_order),
        updated_at = CURRENT_TIMESTAMP
    `,
    params,
  );
}

function normaliseKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toLabel(columnName) {
  return columnName
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, "``")}\``;
}

function parseDriveFileId(fileUrl) {
  const patterns = [/\/file\/d\/([^/]+)/i, /[?&]id=([^&]+)/i, /\/d\/([^/]+)/i];

  for (const pattern of patterns) {
    const match = String(fileUrl).match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function buildDriveDownloadUrls(fileUrl) {
  const url = String(fileUrl || "").trim();
  if (!url) return [];

  const urls = [];
  if (/^https?:\/\//i.test(url)) urls.push(url);

  const isGoogleSheetUrl = /docs\.google\.com\/spreadsheets\//i.test(url);
  if (isGoogleSheetUrl) {
    const fileId = parseDriveFileId(url);
    if (fileId) {
      urls.unshift(
        `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`,
      );
      urls.unshift(
        `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx&gid=0`,
      );
    }
  }

  if (url.includes("drive.google.com")) {
    const fileId = parseDriveFileId(url);
    if (fileId) {
      urls.unshift(`https://drive.google.com/uc?export=download&id=${fileId}`);
      urls.push(`https://drive.google.com/uc?id=${fileId}&export=download`);
    }
  }

  return [...new Set(urls)];
}

async function downloadExcelBuffer(fileUrl) {
  const candidates = buildDriveDownloadUrls(fileUrl);
  if (!candidates.length) {
    throw new Error(
      "URL de archivo inválida. Usa una URL http(s) de Google Drive.",
    );
  }

  let lastStatus = null;
  for (const candidate of candidates) {
    try {
      const response = await axios.get(candidate, {
        responseType: "arraybuffer",
        timeout: 45000,
        maxRedirects: 5,
        validateStatus: () => true,
      });

      lastStatus = response.status;
      if (response.status >= 200 && response.status < 300) {
        return Buffer.from(response.data);
      }
    } catch {
      // Try next candidate URL.
    }
  }

  throw new Error(
    `No se pudo descargar el archivo de Drive (status: ${lastStatus || "N/A"}). Verifica permisos de compartición y URL.`,
  );
}

async function getClientsTableColumns() {
  const [rows] = await pool.query(
    `
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = :tableName
      ORDER BY ORDINAL_POSITION ASC
    `,
    { tableName: CLIENTS_TABLE },
  );

  return rows.map((row) => ({
    name: row.COLUMN_NAME,
    dataType: row.DATA_TYPE,
    nullable: row.IS_NULLABLE === "YES",
    hasDefault: row.COLUMN_DEFAULT !== null,
    autoIncrement: String(row.EXTRA || "")
      .toLowerCase()
      .includes("auto_increment"),
    generated: String(row.EXTRA || "")
      .toLowerCase()
      .includes("generated"),
  }));
}

function tokenise(normalisedValue) {
  return String(normalisedValue || "")
    .split("_")
    .filter(Boolean);
}

function scoreHeaderToColumn(headerNormalised, columnNormalised) {
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

function ensureUniqueHeaders(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = String(header || `column_${index + 1}`);
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}_${count}`;
  });
}

function toSafeColumnName(header, existingNames) {
  const normalised = normaliseKey(header);
  let base = normalised || "campo";

  if (/^[0-9]/.test(base)) {
    base = `col_${base}`;
  }

  if (RESERVED_COLUMN_NAMES.has(base)) {
    base = `col_${base}`;
  }

  base = base.slice(0, 60) || "campo";

  let candidate = base;
  let counter = 2;
  while (existingNames.has(candidate)) {
    candidate = `${base}_${counter}`.slice(0, 62);
    counter += 1;
  }

  existingNames.add(candidate);
  return candidate;
}

async function addDynamicColumnsForHeaders(headers, columnsMeta) {
  const existingNames = new Set(columnsMeta.map((column) => column.name));
  const toCreate = [];

  for (const header of headers) {
    const candidate = toSafeColumnName(header, existingNames);
    if (
      !candidate ||
      (existingNames.has(candidate) &&
        columnsMeta.some((c) => c.name === candidate))
    ) {
      continue;
    }

    if (!columnsMeta.some((c) => c.name === candidate)) {
      toCreate.push({ header, columnName: candidate });
    }
  }

  if (!toCreate.length) return [];

  const clauses = toCreate.map(
    ({ columnName }) => `ADD COLUMN ${escapeIdentifier(columnName)} TEXT NULL`,
  );

  const sql = `ALTER TABLE ${escapeIdentifier(CLIENTS_TABLE)} ${clauses.join(", ")}`;
  await pool.query(sql);

  return toCreate;
}

async function backfillCreatedColumns(createdColumns) {
  if (!createdColumns?.length) return [];

  const rules = {
    nombre_completo: "business_name",
    correo_electronico: "email1",
    correo_secundario: "email2",
    telefono_contacto: "telefono",
    celular_contacto: "celular",
  };

  const reports = [];

  for (const { columnName } of createdColumns) {
    const sourceColumn = rules[columnName];
    if (!sourceColumn) continue;

    const sql = `
      UPDATE ${escapeIdentifier(CLIENTS_TABLE)}
      SET ${escapeIdentifier(columnName)} = ${escapeIdentifier(sourceColumn)}
      WHERE ${escapeIdentifier(columnName)} IS NULL
        AND ${escapeIdentifier(sourceColumn)} IS NOT NULL
    `;

    const [result] = await pool.query(sql);
    reports.push({
      columnName,
      sourceColumn,
      affectedRows: result.affectedRows || 0,
    });
  }

  return reports;
}

function getHeaderToColumnMap(headers, availableColumns, options = {}) {
  const orderedHeaders =
    Array.isArray(options.orderedHeaders) && options.orderedHeaders.length ?
      options.orderedHeaders
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

  for (const header of orderedHeaders) {
    const targetColumn = tryResolveAlias(header);
    if (targetColumn && !usedColumns.has(targetColumn)) {
      mapped[header] = targetColumn;
      usedColumns.add(targetColumn);
    }
  }

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

function toNullableValue(value) {
  if (value === null || value === undefined) return null;
  const asString = String(value).trim();
  return asString === "" ? null : asString;
}

function getRequiredColumns(columns) {
  return columns
    .filter((column) => !INSERT_EXCLUDED_COLUMNS.has(column.name))
    .filter((column) => !column.autoIncrement)
    .filter((column) => !column.generated)
    .filter((column) => !column.nullable)
    .filter((column) => !column.hasDefault)
    .map((column) => column.name);
}

function firstNonEmptyRowValue(row) {
  const values = Object.values(row || {});
  for (const value of values) {
    const text = toNullableValue(value);
    if (text !== null) return text;
  }
  return null;
}

function buildRequiredFallbackValue(columnName, row, rowNumber) {
  if (columnName === "business_name") {
    const candidate =
      toNullableValue(row.business_name) || firstNonEmptyRowValue(row);
    if (candidate) return candidate;
    return `CLIENTE_AUTO_${rowNumber}`;
  }

  return "N/A";
}

async function insertRowsInBatches(rows, columnNames) {
  if (!rows.length || !columnNames.length) return 0;

  const BATCH_SIZE = 200;
  let inserted = 0;

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    const placeholders = [];
    const params = {};

    batch.forEach((row, rowIndex) => {
      const rowTokens = columnNames.map((columnName) => {
        const token = `${columnName}_${rowIndex}`;
        params[token] = row[columnName] ?? null;
        return `:${token}`;
      });

      placeholders.push(`(${rowTokens.join(",")})`);
    });

    const sql = `
      INSERT INTO ${escapeIdentifier(CLIENTS_TABLE)} (${columnNames
        .map(escapeIdentifier)
        .join(",")})
      VALUES ${placeholders.join(",")}
    `;

    const [result] = await pool.query(sql, params);
    inserted += result.affectedRows || 0;
  }

  return inserted;
}

export async function listClientsDynamicAction() {
  const columnsMeta = await getClientsTableColumns();
  const visibleColumns = columnsMeta.filter(
    (column) => !HIDDEN_COLUMNS.has(column.name),
  );

  if (!visibleColumns.length) {
    return { columns: [], rows: [] };
  }

  const orderBy =
    visibleColumns.some((column) => column.name === "business_name") ?
      ` ORDER BY ${escapeIdentifier("business_name")} ASC`
    : "";

  const [rows] = await pool.query(
    `
      SELECT ${visibleColumns.map((column) => escapeIdentifier(column.name)).join(",")}
      FROM ${escapeIdentifier(CLIENTS_TABLE)}${orderBy}
    `,
  );

  const columnMetaByName = await getStoredColumnMeta(
    visibleColumns.map((column) => column.name),
  );

  const columns = visibleColumns
    .map((column, baseOrder) => {
      const saved = columnMetaByName.get(column.name);
      const hasStoredOrder = Number.isInteger(saved?.displayOrder);

      return {
        name: column.name,
        label: saved?.label || toLabel(column.name),
        type: column.dataType,
        nullable: column.nullable,
        _baseOrder: baseOrder,
        _storedOrder: hasStoredOrder ? saved.displayOrder : null,
      };
    })
    .sort((left, right) => {
      const leftHasOrder = Number.isInteger(left._storedOrder);
      const rightHasOrder = Number.isInteger(right._storedOrder);

      if (leftHasOrder && rightHasOrder) {
        return left._storedOrder - right._storedOrder;
      }
      if (leftHasOrder) return -1;
      if (rightHasOrder) return 1;
      return left._baseOrder - right._baseOrder;
    });

  const viewColumns = columns
    .filter((column) => Number.isInteger(column._storedOrder))
    .map((column) => column.name);

  return {
    columns: columns.map(({ _baseOrder, _storedOrder, ...column }) => column),
    rows,
    viewColumns,
  };
}

export async function updateClientDynamicAction({ id, input }) {
  if (!id) throw new Error("Debes indicar el id del cliente.");
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Debes enviar un objeto con los campos a actualizar.");
  }

  const columnsMeta = await getClientsTableColumns();
  const allowedColumns = columnsMeta.filter(
    (column) =>
      !HIDDEN_COLUMNS.has(column.name) &&
      !UPDATE_EXCLUDED_COLUMNS.has(column.name),
  );

  const allowedNames = new Set(allowedColumns.map((column) => column.name));
  const updates = [];
  const params = { id };

  for (const [key, value] of Object.entries(input)) {
    if (!allowedNames.has(key)) continue;
    updates.push(`${escapeIdentifier(key)} = :${key}`);
    params[key] = toNullableValue(value);
  }

  if (!updates.length) {
    throw new Error("No hay campos válidos para actualizar.");
  }

  await pool.query(
    `
      UPDATE ${escapeIdentifier(CLIENTS_TABLE)}
      SET ${updates.join(", ")}
      WHERE ${escapeIdentifier("id")} = :id
    `,
    params,
  );

  const visibleColumns = columnsMeta.filter(
    (column) => !HIDDEN_COLUMNS.has(column.name),
  );

  const [rows] = await pool.query(
    `
      SELECT ${visibleColumns.map((column) => escapeIdentifier(column.name)).join(",")}
      FROM ${escapeIdentifier(CLIENTS_TABLE)}
      WHERE ${escapeIdentifier("id")} = :id
      LIMIT 1
    `,
    { id },
  );

  if (!rows.length) {
    throw new Error("Cliente no encontrado.");
  }

  return rows[0];
}

export async function importClientsFromDriveAction({
  fileUrl,
  createdByUserId,
}) {
  if (!fileUrl)
    throw new Error("Debes proporcionar la URL del archivo de Drive.");
  if (!createdByUserId) throw new Error("Usuario no autenticado.");

  const fileBuffer = await downloadExcelBuffer(fileUrl);
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

  const rawRows = matrix
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

  if (!rawRows.length) {
    throw new Error(
      "El archivo no contiene filas de datos debajo del encabezado.",
    );
  }

  let columnsMeta = await getClientsTableColumns();
  let insertableColumns = columnsMeta
    .filter((column) => !INSERT_EXCLUDED_COLUMNS.has(column.name))
    .filter((column) => !column.autoIncrement)
    .filter((column) => !column.generated);

  const allHeaders = [...headers];
  let { mapped, unmatched, mappingMode } = getHeaderToColumnMap(
    allHeaders,
    insertableColumns,
    { orderedHeaders: allHeaders },
  );
  let createdColumns = [];
  let backfillReports = [];

  if (unmatched.length) {
    createdColumns = await addDynamicColumnsForHeaders(unmatched, columnsMeta);
    if (createdColumns.length) {
      backfillReports = await backfillCreatedColumns(createdColumns);

      columnsMeta = await getClientsTableColumns();
      insertableColumns = columnsMeta
        .filter((column) => !INSERT_EXCLUDED_COLUMNS.has(column.name))
        .filter((column) => !column.autoIncrement)
        .filter((column) => !column.generated);

      const remapped = getHeaderToColumnMap(allHeaders, insertableColumns, {
        orderedHeaders: allHeaders,
      });
      mapped = remapped.mapped;
      unmatched = remapped.unmatched;
      // Keep strongest source of mapping mode.
      if (remapped.mappingMode === "position" || mappingMode === "position") {
        mappingMode = "position";
      } else if (remapped.mappingMode === "fuzzy" || mappingMode === "fuzzy") {
        mappingMode = "fuzzy";
      } else {
        mappingMode = remapped.mappingMode || mappingMode;
      }
    }
  }

  const mappedColumns = [...new Set(Object.values(mapped))];

  if (!mappedColumns.length) {
    throw new Error(
      "No se pudo mapear ninguna columna del Excel a la tabla clients. Revisa que la tabla tenga columnas insertables.",
    );
  }

  const requiredColumns = getRequiredColumns(columnsMeta).filter(
    (column) => column !== "created_by_user_id",
  );

  const missingRequiredInHeaders = requiredColumns.filter(
    (column) => !mappedColumns.includes(column),
  );

  const preparedRows = [];
  const errors = [];

  rawRows.forEach((row, index) => {
    const mappedRow = {};

    Object.entries(mapped).forEach(([header, columnName]) => {
      const value = toNullableValue(row[header]);
      if (value !== null) mappedRow[columnName] = value;
    });

    if (columnsMeta.some((column) => column.name === "created_by_user_id")) {
      mappedRow.created_by_user_id = createdByUserId;
    }

    const rowNumber = index + 2;
    for (const requiredColumn of requiredColumns) {
      const current = toNullableValue(mappedRow[requiredColumn]);
      if (current !== null) continue;
      mappedRow[requiredColumn] = buildRequiredFallbackValue(
        requiredColumn,
        mappedRow,
        rowNumber,
      );
    }

    if (Object.keys(mappedRow).length <= 1) {
      return;
    }

    preparedRows.push(mappedRow);
  });

  if (!preparedRows.length) {
    throw new Error(
      "No hubo filas válidas para importar. Revisa columnas obligatorias y celdas vacías.",
    );
  }

  const dynamicInsertColumns = [
    ...new Set(preparedRows.flatMap((row) => Object.keys(row))),
  ];

  const importedCount = await insertRowsInBatches(
    preparedRows,
    dynamicInsertColumns,
  );

  const mappedColumnMeta = buildMappedColumnMeta(allHeaders, mapped);
  await upsertMappedColumnMeta(mappedColumnMeta);

  const mappedHeadersByColumn =
    mappedColumnMeta.length ?
      mappedColumnMeta.reduce((acc, entry) => {
        acc[entry.columnName] = entry.label;
        return acc;
      }, {})
    : Object.entries(mapped).reduce((acc, [header, columnName]) => {
        if (!acc[columnName]) acc[columnName] = header;
        return acc;
      }, {});

  const preferredViewColumns =
    mappedColumnMeta.length ?
      mappedColumnMeta.map((entry) => entry.columnName)
    : Object.keys(mappedHeadersByColumn);

  return {
    importedCount,
    skippedCount: errors.length,
    totalRows: rawRows.length,
    mappingMode,
    requiredColumnsAutoFilled: missingRequiredInHeaders,
    mappedColumns,
    mappedHeadersByColumn,
    preferredViewColumns,
    mappedPairs: mapped,
    createdColumns,
    backfillReports,
    ignoredHeaders: unmatched,
    errors: errors.slice(0, 100),
  };
}

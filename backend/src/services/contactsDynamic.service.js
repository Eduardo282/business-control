import axios from "axios";
import * as XLSX from "xlsx";
import { pool } from "../config/db.js";

const CONTACTS_TABLE = "client_contacts";
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
  "client_id",
  "portal_password_hash",
  "has_portal_access",
  "is_active",
]);
const SYSTEM_MANAGED_COLUMNS = new Set([
  "client_id",
  "has_portal_access",
  "is_active",
  "portal_password_hash",
]);
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

async function ensureClientExists(clientId) {
  const [rows] = await pool.query(
    `
      SELECT id
      FROM ${escapeIdentifier("clients")}
      WHERE ${escapeIdentifier("id")} = :clientId
      LIMIT 1
    `,
    { clientId },
  );

  if (!rows.length) {
    throw new Error("Cliente no encontrado.");
  }
}

async function getContactsTableColumns() {
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
    { tableName: CONTACTS_TABLE },
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

  const sql = `ALTER TABLE ${escapeIdentifier(CONTACTS_TABLE)} ${clauses.join(", ")}`;
  await pool.query(sql);

  return toCreate;
}

async function backfillCreatedColumns(createdColumns) {
  if (!createdColumns?.length) return [];

  const rules = {
    nombre_completo: "full_name",
    correo_electronico: "email",
    telefono_contacto: "phone",
    puesto_contacto: "position_title",
  };

  const reports = [];

  for (const { columnName } of createdColumns) {
    const sourceColumn = rules[columnName];
    if (!sourceColumn) continue;

    const sql = `
      UPDATE ${escapeIdentifier(CONTACTS_TABLE)}
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
    nombre: "full_name",
    nombre_completo: "full_name",
    contacto: "full_name",
    correo: "email",
    correo_electronico: "email",
    email: "email",
    telefono: "phone",
    telefono_contacto: "phone",
    tel: "phone",
    celular: "phone",
    movil: "phone",
    puesto: "position_title",
    cargo: "position_title",
    posicion: "position_title",
    posicion_contacto: "position_title",
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
  if (columnName === "full_name") {
    const candidate =
      toNullableValue(row.full_name) || firstNonEmptyRowValue(row);
    if (candidate) return candidate;
    return `CONTACTO_AUTO_${rowNumber}`;
  }

  if (columnName === "client_id") {
    return row.client_id;
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
      INSERT INTO ${escapeIdentifier(CONTACTS_TABLE)} (${columnNames
        .map(escapeIdentifier)
        .join(",")})
      VALUES ${placeholders.join(",")}
    `;

    const [result] = await pool.query(sql, params);
    inserted += result.affectedRows || 0;
  }

  return inserted;
}

export async function listContactsDynamicByClientAction({ clientId }) {
  if (!clientId) {
    throw new Error("Debes indicar el id del cliente.");
  }

  const columnsMeta = await getContactsTableColumns();
  const visibleColumns = columnsMeta.filter(
    (column) => !HIDDEN_COLUMNS.has(column.name),
  );

  if (!visibleColumns.length) {
    return { columns: [], rows: [] };
  }

  const orderBy =
    visibleColumns.some((column) => column.name === "full_name") ?
      ` ORDER BY ${escapeIdentifier("full_name")} ASC`
    : "";

  const [rows] = await pool.query(
    `
      SELECT ${visibleColumns.map((column) => escapeIdentifier(column.name)).join(",")}
      FROM ${escapeIdentifier(CONTACTS_TABLE)}
      WHERE ${escapeIdentifier("client_id")} = :clientId${orderBy}
    `,
    { clientId },
  );

  const columns = visibleColumns.map((column) => ({
    name: column.name,
    label: toLabel(column.name),
    type: column.dataType,
    nullable: column.nullable,
  }));

  return { columns, rows };
}

export async function updateContactDynamicAction({ id, input }) {
  if (!id) throw new Error("Debes indicar el id del contacto.");
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Debes enviar un objeto con los campos a actualizar.");
  }

  const columnsMeta = await getContactsTableColumns();
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
      UPDATE ${escapeIdentifier(CONTACTS_TABLE)}
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
      FROM ${escapeIdentifier(CONTACTS_TABLE)}
      WHERE ${escapeIdentifier("id")} = :id
      LIMIT 1
    `,
    { id },
  );

  if (!rows.length) {
    throw new Error("Contacto no encontrado.");
  }

  return rows[0];
}

export async function importContactsFromDriveAction({ fileUrl, clientId }) {
  if (!fileUrl)
    throw new Error("Debes proporcionar la URL del archivo de Drive.");
  if (!clientId) throw new Error("Debes indicar el cliente destino.");

  await ensureClientExists(clientId);

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

  let columnsMeta = await getContactsTableColumns();
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

      columnsMeta = await getContactsTableColumns();
      insertableColumns = columnsMeta
        .filter((column) => !INSERT_EXCLUDED_COLUMNS.has(column.name))
        .filter((column) => !column.autoIncrement)
        .filter((column) => !column.generated);

      const remapped = getHeaderToColumnMap(allHeaders, insertableColumns, {
        orderedHeaders: allHeaders,
      });
      mapped = remapped.mapped;
      unmatched = remapped.unmatched;
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
      "No se pudo mapear ninguna columna del Excel a la tabla de contactos. Revisa que la tabla tenga columnas insertables.",
    );
  }

  const requiredColumns = getRequiredColumns(columnsMeta);
  const missingRequiredInHeaders = requiredColumns.filter(
    (column) => !mappedColumns.includes(column) && column !== "client_id",
  );

  const preparedRows = [];
  const errors = [];

  rawRows.forEach((row, index) => {
    const mappedRow = {};

    Object.entries(mapped).forEach(([header, columnName]) => {
      const value = toNullableValue(row[header]);
      if (value !== null) mappedRow[columnName] = value;
    });

    mappedRow.client_id = clientId;

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

  const mappedHeadersByColumn = Object.entries(mapped).reduce(
    (acc, [header, columnName]) => {
      if (!acc[columnName]) acc[columnName] = header;
      return acc;
    },
    {},
  );

  return {
    importedCount,
    skippedCount: errors.length,
    totalRows: rawRows.length,
    mappingMode,
    requiredColumnsAutoFilled: missingRequiredInHeaders,
    mappedColumns,
    mappedHeadersByColumn,
    mappedPairs: mapped,
    createdColumns,
    backfillReports,
    ignoredHeaders: unmatched,
    errors: errors.slice(0, 100),
  };
}

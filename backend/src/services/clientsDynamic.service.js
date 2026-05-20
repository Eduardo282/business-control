import { downloadExcelBuffer } from "./excelDownloader.service.js";
import { parseExcelBuffer } from "./excelParser.service.js";
import { getHeaderToColumnMap } from "./columnMapper.service.js";
import {
  escapeIdentifier,
  getClientsTableColumns,
  addDynamicColumnsForHeaders,
  backfillCreatedColumns,
  getStoredColumnMeta,
  upsertMappedColumnMeta,
  insertClientsDynamic,
  listClientsDynamic,
  updateClientDynamic,
  findClientDynamicById,
} from "../repositories/client.repository.js";

const CLIENTS_TABLE = "clients";
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

function normaliseLabel(value) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

function toLabel(columnName) {
  return columnName
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toNullableValue(value) {
  if (value === null || value === undefined) return null;
  const asString = String(value).trim();
  return asString === "" ? null : asString;
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

// =============================================================================
// ACCIONES EXPORTADAS
// =============================================================================

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

  const visibleColumnNames = visibleColumns.map((column) => column.name);
  const rows = await listClientsDynamic(visibleColumnNames, orderBy);

  const columnMetaByName = await getStoredColumnMeta(visibleColumnNames);

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

  const allowedNames = allowedColumns.map((column) => column.name);
  await updateClientDynamic(id, input, allowedNames);

  const visibleColumns = columnsMeta.filter(
    (column) => !HIDDEN_COLUMNS.has(column.name),
  );
  const visibleColumnNames = visibleColumns.map((column) => column.name);

  const client = await findClientDynamicById(id, visibleColumnNames);
  if (!client) {
    throw new Error("Cliente no encontrado.");
  }

  return client;
}

export async function importClientsFromDriveAction({
  fileUrl,
  createdByUserId,
}) {
  if (!fileUrl)
    throw new Error("Debes proporcionar la URL del archivo de Drive.");
  if (!createdByUserId) throw new Error("Usuario no autenticado.");

  const fileBuffer = await downloadExcelBuffer(fileUrl);
  const { headers, rows: rawRows } = parseExcelBuffer(fileBuffer);

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
    const clauses = unmatched.map(
      (header) => {
        const existingNames = new Set(columnsMeta.map((column) => column.name));
        const columnName = header
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        return `ADD COLUMN ${escapeIdentifier(columnName)} TEXT NULL`;
      }
    );
    await addDynamicColumnsForHeaders(clauses, columnsMeta);

    // Keep track of what we created
    createdColumns = unmatched.map((header) => {
      const columnName = header
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      return { header, columnName };
    });

    if (createdColumns.length) {
      const rules = {
        razon_social: "business_name",
        rfc: "tax_id",
        correo_empresa: "email",
        direccion: "address",
      };

      for (const { columnName } of createdColumns) {
        const sourceColumn = rules[columnName];
        if (sourceColumn) {
          const rep = await backfillCreatedColumns(columnName, sourceColumn);
          backfillReports.push(rep);
        }
      }

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

  const importedCount = await insertClientsDynamic(
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

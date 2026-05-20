/**
 * SchemaMigrator — Responsabilidad Única: alterar la estructura de la tabla clients en MySQL.
 * Maneja ALTER TABLE, backfill de datos y consulta de metadatos de esquema.
 * No sabe nada de Excel, descargas ni mapeo de columnas.
 */
import { pool } from "../config/db.js";

const CLIENTS_TABLE = "clients";
const RESERVED_COLUMN_NAMES = new Set([
  "select", "from", "where", "group", "order", "by", "table", "column",
]);

/**
 * Escapa un identificador SQL con backticks.
 * @param {string} identifier
 * @returns {string}
 */
export function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, "``")}\``;
}

/**
 * Normaliza un texto a un identificador snake_case sin acentos.
 * @param {string} value
 * @returns {string}
 */
function normaliseKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Genera un nombre de columna seguro y único para SQL.
 * @param {string} header — Nombre original del header
 * @param {Set<string>} existingNames — Set mutable de nombres ya existentes
 * @returns {string}
 */
export function toSafeColumnName(header, existingNames) {
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

/**
 * Consulta los metadatos de columnas de la tabla clients en MySQL.
 * @returns {Promise<object[]>} Array de columnas con { name, dataType, nullable, hasDefault, autoIncrement, generated }
 */
export async function getClientsTableColumns() {
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

/**
 * Agrega columnas dinámicas TEXT NULL a la tabla clients para headers sin match.
 * @param {string[]} headers — Headers del Excel que no matchearon
 * @param {object[]} columnsMeta — Metadatos actuales de la tabla
 * @returns {Promise<object[]>} Columnas creadas [{ header, columnName }]
 */
export async function addDynamicColumnsForHeaders(headers, columnsMeta) {
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

/**
 * Rellena columnas recién creadas copiando datos de columnas existentes según reglas predefinidas.
 * @param {object[]} createdColumns — [{ columnName, header }]
 * @returns {Promise<object[]>} Reportes de backfill [{ columnName, sourceColumn, affectedRows }]
 */
export async function backfillCreatedColumns(createdColumns) {
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

/**
 * ContactRepository — Puerto de datos para la entidad ClientContact y ContactProduct.
 * Centraliza las consultas, inserciones y actualizaciones de contactos y licencias/pólizas en MySQL.
 */
import { pool } from "../config/db.js";

const VISIBLE_CONTACT_PRODUCT_CONDITION = `
  (
    cp.license_key IS NULL
    OR NOT (
      cp.license_key REGEXP '^[A-Z0-9]{6}-[0-9]{4}(-[0-9]+)?$'
      AND EXISTS (
        SELECT 1
        FROM quotes q
        JOIN quote_items qi ON qi.quote_id = q.id
        WHERE q.status = 'ACCEPTED'
          AND q.client_id = cp.client_id
          AND q.contact_id = cp.contact_id
          AND qi.product_id = cp.product_id
          AND ABS(TIMESTAMPDIFF(SECOND, q.created_at, cp.created_at)) <= 10
      )
    )
  )
`;

/**
 * Busca un contacto por su ID.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findContactById(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT id, client_id, full_name, email, phone, position_title, has_portal_access, portal_password_hash, is_active, created_at, updated_at FROM client_contacts WHERE id = ?",
    [id],
  );
  return rows?.[0] || null;
}

/**
 * Lista contactos asociados a un cliente.
 * @param {number|string} clientId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listContactsByClient(clientId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT id, client_id, full_name, email, phone, position_title, has_portal_access, is_active, created_at, updated_at
     FROM client_contacts
     WHERE client_id = ?
     ORDER BY is_active DESC, full_name ASC`,
    [clientId],
  );
  return rows;
}

/**
 * Inserta un nuevo contacto de cliente.
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<number>} ID del contacto insertado
 */
export async function createContact(data, queryRunner = pool) {
  const {
    client_id,
    full_name,
    email,
    phone,
    position_title,
    has_portal_access,
    portal_password_hash,
  } = data;

  const [result] = await queryRunner.query(
    `INSERT INTO client_contacts (client_id, full_name, email, phone, position_title, has_portal_access, portal_password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      full_name,
      email || null,
      phone || null,
      position_title || null,
      has_portal_access || 0,
      portal_password_hash || null,
    ],
  );

  return result.insertId;
}

/**
 * Actualiza los datos de un contacto.
 * @param {number|string} id
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateContact(id, data, queryRunner = pool) {
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  if (setClauses.length === 0) return;

  params.push(id);

  await queryRunner.query(
    `UPDATE client_contacts SET ${setClauses.join(", ")} WHERE id = ?`,
    params,
  );
}

/**
 * Elimina un contacto de cliente.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<number>} Número de filas afectadas
 */
export async function deleteContact(id, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "DELETE FROM client_contacts WHERE id = ?",
    [id],
  );
  return result.affectedRows || 0;
}

/**
 * Inserta un producto asignado al contacto (Póliza o Licencia de servicio).
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<number>} ID de la relación insertada
 */
export async function insertContactProduct(data, queryRunner = pool) {
  const {
    client_id,
    contact_id,
    product_id,
    license_key,
    start_date,
    expiration_date,
    status,
  } = data;

  const [result] = await queryRunner.query(
    `INSERT INTO contact_products (client_id, contact_id, product_id, license_key, start_date, expiration_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      contact_id,
      product_id,
      license_key || null,
      start_date || null,
      expiration_date || null,
      status || "ACTIVE",
    ],
  );

  return result.insertId;
}

/**
 * Lista los productos asignados a un contacto.
 * @param {number|string} contactId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listContactProducts(contactId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT cp.id, cp.client_id, cp.contact_id, cp.product_id, cp.license_key, cp.start_date, cp.expiration_date, cp.status,
            p.name as product_name, p.category as product_category, p.description as product_description, p.current_price, p.is_active, p.product_type
     FROM contact_products cp
     JOIN products p ON cp.product_id = p.id
     WHERE cp.contact_id = ?
       AND ${VISIBLE_CONTACT_PRODUCT_CONDITION}
     ORDER BY cp.created_at DESC`,
    [contactId],
  );
  return rows;
}

/**
 * Elimina la asignación de un producto a un contacto.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<number>} Número de filas afectadas
 */
export async function deleteContactProduct(id, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "DELETE FROM contact_products WHERE id = ?",
    [id],
  );
  return result.affectedRows || 0;
}

/**
 * Desactiva un contacto del cliente (Soft Delete).
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<boolean>}
 */
export async function softDeleteContact(id, queryRunner = pool) {
  const [res] = await queryRunner.query(
    "UPDATE client_contacts SET is_active = 0, has_portal_access = 0 WHERE id = ?",
    [id],
  );
  return res.affectedRows > 0;
}

/**
 * Inserta múltiples contactos de forma masiva y retorna sus datos junto con el ID generado.
 * @param {object[]} contacts
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function bulkCreateContacts(contacts, queryRunner = pool) {
  if (!contacts.length) return [];

  const results = [];
  const BATCH = 100;

  for (let i = 0; i < contacts.length; i += BATCH) {
    const batch = contacts.slice(i, i + BATCH);

    const placeholders = [];
    const params = {};

    batch.forEach((c, idx) => {
      placeholders.push(
        `(:cid_${idx}, :fn_${idx}, :em_${idx}, :ph_${idx}, :pt_${idx})`,
      );
      params[`cid_${idx}`] = c.client_id;
      params[`fn_${idx}`] = c.full_name;
      params[`em_${idx}`] = c.email || null;
      params[`ph_${idx}`] = c.phone || null;
      params[`pt_${idx}`] = c.position_title || null;
    });

    const sql = `INSERT INTO client_contacts (client_id, full_name, email, phone, position_title) VALUES ${placeholders.join(", ")}`;

    const [result] = await queryRunner.query(sql, params);

    const firstId = result.insertId;
    batch.forEach((c, idx) => {
      results.push({
        id: firstId + idx,
        client_id: c.client_id,
        full_name: c.full_name,
        email: c.email || null,
        phone: c.phone || null,
        position_title: c.position_title || null,
      });
    });
  }

  return results;
}

/**
 * Busca contactos por email que tengan habilitado el acceso al portal.
 * @param {string} email
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function findContactsByEmail(email, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT * FROM client_contacts WHERE email = ? AND has_portal_access = 1",
    [email],
  );
  return rows;
}

function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, "``")}\``;
}

/**
 * Obtiene metadatos de las columnas de la tabla client_contacts.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getContactsTableColumns(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'client_contacts'
      ORDER BY ORDINAL_POSITION ASC
    `
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
 * Agrega columnas dinámicas a la tabla client_contacts.
 * @param {string[]} clauses
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function addDynamicColumnsForHeaders(clauses, queryRunner = pool) {
  if (!clauses.length) return;
  const sql = `ALTER TABLE ${escapeIdentifier("client_contacts")} ${clauses.join(", ")}`;
  await queryRunner.query(sql);
}

/**
 * Rellena valores en una columna creada dinámicamente usando una columna de origen.
 * @param {string} columnName
 * @param {string} sourceColumn
 * @param {object} [queryRunner]
 * @returns {Promise<object>}
 */
export async function backfillCreatedColumns(columnName, sourceColumn, queryRunner = pool) {
  const sql = `
    UPDATE ${escapeIdentifier("client_contacts")}
    SET ${escapeIdentifier(columnName)} = ${escapeIdentifier(sourceColumn)}
    WHERE ${escapeIdentifier(columnName)} IS NULL
      AND ${escapeIdentifier(sourceColumn)} IS NOT NULL
  `;
  const [result] = await queryRunner.query(sql);
  return {
    columnName,
    sourceColumn,
    affectedRows: result.affectedRows || 0,
  };
}

/**
 * Inserta múltiples filas de contactos de forma dinámica en batches.
 * @param {object[]} rows
 * @param {string[]} columnNames
 * @param {object} [queryRunner]
 * @returns {Promise<number>} Cantidad de filas insertadas
 */
export async function insertContactsDynamic(rows, columnNames, queryRunner = pool) {
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
      INSERT INTO ${escapeIdentifier("client_contacts")} (${columnNames
        .map(escapeIdentifier)
        .join(",")})
      VALUES ${placeholders.join(",")}
    `;

    const [result] = await queryRunner.query(sql, params);
    inserted += result.affectedRows || 0;
  }

  return inserted;
}

/**
 * Obtiene contactos de un cliente con las columnas solicitadas dinámicamente.
 * @param {string|number} clientId
 * @param {string[]} visibleColumnNames
 * @param {string} [orderBySql]
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listContactsDynamic(clientId, visibleColumnNames, orderBySql = "", queryRunner = pool) {
  if (!visibleColumnNames.length) return [];
  
  const sql = `
    SELECT ${visibleColumnNames.map(escapeIdentifier).join(",")}
    FROM ${escapeIdentifier("client_contacts")}
    WHERE ${escapeIdentifier("client_id")} = :clientId${orderBySql}
  `;
  const [rows] = await queryRunner.query(sql, { clientId });
  return rows;
}

/**
 * Actualiza un contacto de forma dinámica.
 * @param {string|number} id
 * @param {object} input
 * @param {string[]} allowedNames
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateContactDynamic(id, input, allowedNames, queryRunner = pool) {
  const updates = [];
  const params = { id };

  for (const [key, value] of Object.entries(input)) {
    if (!allowedNames.includes(key)) continue;
    updates.push(`${escapeIdentifier(key)} = :${key}`);
    params[key] = value === null || value === undefined || String(value).trim() === "" ? null : String(value).trim();
  }

  if (!updates.length) {
    throw new Error("No hay campos válidos para actualizar.");
  }

  await queryRunner.query(
    `
      UPDATE ${escapeIdentifier("client_contacts")}
      SET ${updates.join(", ")}
      WHERE ${escapeIdentifier("id")} = :id
    `,
    params,
  );
}

/**
 * Busca un contacto por ID y retorna solo las columnas especificadas.
 * @param {string|number} id
 * @param {string[]} visibleColumnNames
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findContactDynamicById(id, visibleColumnNames, queryRunner = pool) {
  if (!visibleColumnNames.length) return null;
  const [rows] = await queryRunner.query(
    `
      SELECT ${visibleColumnNames.map(escapeIdentifier).join(",")}
      FROM ${escapeIdentifier("client_contacts")}
      WHERE ${escapeIdentifier("id")} = :id
      LIMIT 1
    `,
    { id }
  );
  return rows?.[0] || null;
}

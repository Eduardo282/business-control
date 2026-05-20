/**
 * ClientRepository — Puerto de datos para la entidad Client.
 * Centraliza las consultas, inserciones y actualizaciones de clientes en MySQL.
 */
import { pool } from "../config/db.js";

/**
 * Busca un cliente por su ID.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findClientById(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad, created_at, updated_at FROM clients WHERE id = ?",
    [id],
  );
  return rows?.[0] || null;
}

/**
 * Lista todos los clientes ordenados por razón social.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listClients(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad
     FROM clients
     ORDER BY business_name ASC`,
  );
  return rows;
}

/**
 * Inserta un nuevo cliente.
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<number>} ID del cliente insertado
 */
export async function createClient(data, queryRunner = pool) {
  const {
    business_name,
    rfc,
    email1,
    email2,
    celular,
    telefono,
    codigo_postal,
    ciudad,
    created_by_user_id,
  } = data;

  const [result] = await queryRunner.query(
    `INSERT INTO clients (business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad, created_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      business_name,
      rfc || null,
      email1 || null,
      email2 || null,
      celular || null,
      telefono || null,
      codigo_postal || null,
      ciudad || null,
      created_by_user_id || null,
    ],
  );

  return result.insertId;
}

/**
 * Actualiza los datos de un cliente.
 * @param {number|string} id
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateClient(id, data, queryRunner = pool) {
  const setClauses = [];
  const params = [];

  for (const [key, value] of Object.entries(data)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }

  if (setClauses.length === 0) return;

  params.push(id);

  await queryRunner.query(
    `UPDATE clients SET ${setClauses.join(", ")} WHERE id = ?`,
    params,
  );
}

/**
 * Elimina un cliente.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<number>} Número de filas afectadas
 */
export async function deleteClient(id, queryRunner = pool) {
  const [result] = await queryRunner.query(
    "DELETE FROM clients WHERE id = ?",
    [id],
  );
  return result.affectedRows || 0;
}

/**
 * Busca clientes por coincidencia de nombre o RFC.
 * @param {string} q
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function searchClients(q, queryRunner = pool) {
  const queryStr = `%${q.trim()}%`;
  const [rows] = await queryRunner.query(
    `SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad
     FROM clients
     WHERE business_name LIKE ? OR rfc LIKE ? OR email1 LIKE ?
     ORDER BY business_name ASC`,
    [queryStr, queryStr, queryStr],
  );
  return rows;
}

/**
 * Elimina un cliente y todos sus datos relacionados (contactos e historial de precios).
 * @param {number|string} id
 * @param {object} queryRunner
 * @returns {Promise<boolean>}
 */
export async function deleteClientCascade(id, queryRunner) {
  // 1. Eliminar contactos asociados (FK sin cascade)
  await queryRunner.query("DELETE FROM client_contacts WHERE client_id = ?", [id]);

  // 2. Eliminar historial de precios de los productos del cliente para evitar error de FK
  const [products] = await queryRunner.query(
    "SELECT id FROM products WHERE client_id = ?",
    [id],
  );

  if (products.length > 0) {
    const productIds = products.map((p) => p.id);
    await queryRunner.query(
      "DELETE FROM product_price_history WHERE product_id IN (?)",
      [productIds],
    );
  }

  // 3. Eliminar cliente
  const [res] = await queryRunner.query("DELETE FROM clients WHERE id = ?", [id]);
  return res.affectedRows > 0;
}

/**
 * Inserta múltiples clientes de forma masiva y retorna sus datos junto con el ID generado.
 * @param {string|number} createdByUserId
 * @param {object[]} clients
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function bulkCreateClients(createdByUserId, clients, queryRunner = pool) {
  if (!clients.length) return [];

  const results = [];
  const BATCH = 100;

  for (let i = 0; i < clients.length; i += BATCH) {
    const batch = clients.slice(i, i + BATCH);

    const placeholders = [];
    const params = {};

    batch.forEach((c, idx) => {
      placeholders.push(
        `(:uid_${idx}, :bn_${idx}, :rfc_${idx}, :e1_${idx}, :e2_${idx}, :cel_${idx}, :tel_${idx}, :cp_${idx}, :cd_${idx})`,
      );
      params[`uid_${idx}`] = createdByUserId;
      params[`bn_${idx}`] = c.business_name;
      params[`rfc_${idx}`] = c.rfc || null;
      params[`e1_${idx}`] = c.email1 || null;
      params[`e2_${idx}`] = c.email2 || null;
      params[`cel_${idx}`] = c.celular || null;
      params[`tel_${idx}`] = c.telefono || null;
      params[`cp_${idx}`] = c.codigo_postal || null;
      params[`cd_${idx}`] = c.ciudad || null;
    });

    const sql = `INSERT INTO clients (created_by_user_id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad) VALUES ${placeholders.join(", ")}`;

    const [result] = await queryRunner.query(sql, params);

    const firstId = result.insertId;
    batch.forEach((c, idx) => {
      results.push({
        id: firstId + idx,
        business_name: c.business_name,
        rfc: c.rfc || null,
        email1: c.email1 || null,
        email2: c.email2 || null,
        celular: c.celular || null,
        telefono: c.telefono || null,
        codigo_postal: c.codigo_postal || null,
        ciudad: c.ciudad || null,
      });
    });
  }

  return results;
}

/**
 * Inserta un registro en client_products.
 * @param {object} data
 * @param {object} [queryRunner]
 * @returns {Promise<number>} ID insertado
 */
export async function createClientProduct(data, queryRunner = pool) {
  const { client_id, product_id, license_key, start_date, expiration_date } = data;
  const [result] = await queryRunner.query(
    `INSERT INTO client_products (client_id, product_id, license_key, start_date, expiration_date)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, product_id, license_key || null, start_date || null, expiration_date || null],
  );
  return result.insertId;
}

/**
 * Elimina un registro de client_products.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function deleteClientProduct(id, queryRunner = pool) {
  await queryRunner.query("DELETE FROM client_products WHERE id = ?", [id]);
}

/**
 * Obtiene los productos (polizas/servicios) asignados indirectamente a través de los contactos de un cliente.
 * @param {number|string} clientId
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listClientProducts(clientId, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT cp.id, cp.contact_id, cp.license_key, cp.start_date, cp.expiration_date, cp.status,
            p.id as product_id, p.name as product_name, p.category as product_category, p.description as product_description 
     FROM contact_products cp
     JOIN client_contacts cc ON cp.contact_id = cc.id
     JOIN products p ON cp.product_id = p.id
     WHERE cc.client_id = ?`,
    [clientId],
  );
  return rows;
}

export function escapeIdentifier(identifier) {
  return `\`${String(identifier).replace(/`/g, "``")}\``;
}

/**
 * Obtiene metadatos de las columnas de la tabla clients.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function getClientsTableColumns(queryRunner = pool) {
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
        AND TABLE_NAME = 'clients'
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
 * Agrega columnas dinámicas a la tabla clients.
 * @param {string[]} clauses
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function addDynamicColumnsForHeaders(clauses, queryRunner = pool) {
  if (!clauses.length) return;
  const sql = `ALTER TABLE ${escapeIdentifier("clients")} ${clauses.join(", ")}`;
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
    UPDATE ${escapeIdentifier("clients")}
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
 * Obtiene metadatos de las columnas guardadas de clients_column_meta.
 * @param {string[]} columnNames
 * @param {object} [queryRunner]
 * @returns {Promise<Map<string, object>>}
 */
export async function getStoredColumnMeta(columnNames, queryRunner = pool) {
  if (!Array.isArray(columnNames) || !columnNames.length) {
    return new Map();
  }

  const params = {};
  const tokens = columnNames.map((columnName, index) => {
    const token = `column_${index}`;
    params[token] = columnName;
    return `:${token}`;
  });

  const [rows] = await queryRunner.query(
    `
      SELECT column_name, label, display_order
      FROM ${escapeIdentifier("clients_column_meta")}
      WHERE column_name IN (${tokens.join(",")})
    `,
    params,
  );

  const mapped = rows.map((row) => {
    const asNumber = Number(row.display_order);
    return [
      row.column_name,
      {
        label: row.label ? String(row.label).trim() : null,
        displayOrder: Number.isInteger(asNumber) ? asNumber : null,
      },
    ];
  });

  return new Map(mapped);
}

/**
 * Inserta o actualiza la configuración de metadatos de columnas en clients_column_meta.
 * @param {object[]} mappedColumnMeta
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function upsertMappedColumnMeta(mappedColumnMeta, queryRunner = pool) {
  if (!mappedColumnMeta?.length) return;

  await queryRunner.query(
    `
      UPDATE ${escapeIdentifier("clients_column_meta")}
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

  await queryRunner.query(
    `
      INSERT INTO ${escapeIdentifier("clients_column_meta")} (
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

/**
 * Inserta múltiples filas de clientes de forma dinámica en batches.
 * @param {object[]} rows
 * @param {string[]} columnNames
 * @param {object} [queryRunner]
 * @returns {Promise<number>} Cantidad de filas insertadas
 */
export async function insertClientsDynamic(rows, columnNames, queryRunner = pool) {
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
      INSERT INTO ${escapeIdentifier("clients")} (${columnNames
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
 * Obtiene clientes con las columnas solicitadas dinámicamente.
 * @param {string[]} visibleColumnNames
 * @param {string} [orderBySql]
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listClientsDynamic(visibleColumnNames, orderBySql = "", queryRunner = pool) {
  if (!visibleColumnNames.length) return [];
  
  const sql = `
    SELECT ${visibleColumnNames.map(escapeIdentifier).join(",")}
    FROM ${escapeIdentifier("clients")}${orderBySql}
  `;
  const [rows] = await queryRunner.query(sql);
  return rows;
}

/**
 * Actualiza un cliente de forma dinámica.
 * @param {string|number} id
 * @param {object} input
 * @param {string[]} allowedNames
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateClientDynamic(id, input, allowedNames, queryRunner = pool) {
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
      UPDATE ${escapeIdentifier("clients")}
      SET ${updates.join(", ")}
      WHERE ${escapeIdentifier("id")} = :id
    `,
    params,
  );
}

/**
 * Busca un cliente por ID y retorna solo las columnas especificadas.
 * @param {string|number} id
 * @param {string[]} visibleColumnNames
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findClientDynamicById(id, visibleColumnNames, queryRunner = pool) {
  if (!visibleColumnNames.length) return null;
  const [rows] = await queryRunner.query(
    `
      SELECT ${visibleColumnNames.map(escapeIdentifier).join(",")}
      FROM ${escapeIdentifier("clients")}
      WHERE ${escapeIdentifier("id")} = :id
      LIMIT 1
    `,
    { id }
  );
  return rows?.[0] || null;
}


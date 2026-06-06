/**
 * ProductRepository — Puerto de datos para la entidad Product.
 * Centraliza TODAS las consultas SQL de productos, categorías e historial de precios.
 *
 * Beneficio DIP: las acciones de negocio dependen de esta abstracción,
 * no del motor de base de datos concreto.
 */
import { pool } from "../config/db.js";
import { normalizePagination } from "./pagination.js";

// ─── Productos ──────────────────────────────────────────────────────────────

const PRODUCT_COLUMNS =
  "id, folio, client_id, name, category, product_type, current_price, users_count, description, update_version, created_at, updated_at";

const PRODUCT_UPDATE_HISTORY_COLUMNS =
  "id, product_id, update_version, change_type, summary, changed_at";

export const PRODUCT_TYPE_VALUES = ["PRODUCT", "CONTPAQI", "SERVICE", "POLICY"];

export function normalizeCatalogProductType(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  if (normalized === "CONTPAQI" || normalized === "CONTPAQI_PRODUCT") return "CONTPAQI";
  if (PRODUCT_TYPE_VALUES.includes(normalized)) return normalized;
  return "PRODUCT";
}

/**
 * Busca un producto por su ID con historial de precios.
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
export async function findProductById(id) {
  const [rows] = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = :id`,
    { id },
  );
  if (!rows.length) return null;

  const [hist] = await pool.query(
    "SELECT id, product_id, price, changed_at FROM product_price_history WHERE product_id = :id ORDER BY changed_at DESC",
    { id },
  );
  const [updateHistory] = await pool.query(
    `SELECT ${PRODUCT_UPDATE_HISTORY_COLUMNS}
     FROM product_update_history
     WHERE product_id = :id
     ORDER BY changed_at DESC, id DESC`,
    { id },
  );
  return { ...rows[0], price_history: hist, update_history: updateHistory };
}

/**
 * Busca un producto por ID sin historial (versión ligera para resolvers).
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<object|null>}
 */
export async function findProductByIdLean(id, queryRunner = pool) {
  const [rows] = await queryRunner.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ?`,
    [id],
  );
  return rows?.[0] || null;
}

/**
 * Lista todos los productos, opcionalmente filtrados por client_id.
 * @param {object} [options]
 * @param {number|string} [options.client_id]
 * @param {number} [options.limit]
 * @param {number} [options.offset]
 * @returns {Promise<object[]>}
 */
export async function listProducts({ client_id, limit, offset } = {}) {
  const page = normalizePagination({ limit, offset });
  let query = `SELECT ${PRODUCT_COLUMNS} FROM products`;
  const params = {};

  if (client_id) {
    query += " WHERE client_id IS NULL OR client_id = :client_id";
    params.client_id = client_id;
  }

  query += " ORDER BY name ASC LIMIT :limit OFFSET :offset";
  params.limit = page.limit;
  params.offset = page.offset;

  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({ ...r, price_history: [], update_history: [] }));
}

/**
 * Busca productos por nombre o categoría.
 * @param {string} q — Término de búsqueda
 * @param {number|string} [client_id]
 * @returns {Promise<object[]>}
 */
export async function searchProducts(q, client_id) {
  let query = `SELECT ${PRODUCT_COLUMNS} FROM products WHERE (folio LIKE :q OR name LIKE :q OR category LIKE :q)`;
  const params = { q: `%${q}%` };

  if (client_id) {
    query += " AND (client_id IS NULL OR client_id = :client_id)";
    params.client_id = client_id;
  }

  const [rows] = await pool.query(query, params);
  return rows.map((r) => ({ ...r, price_history: [], update_history: [] }));
}

/**
 * Inserta un nuevo producto.
 * @param {object} data — Campos del producto
 * @returns {Promise<number>} ID del producto insertado
 */
export async function insertProduct(data, queryRunner = pool) {
  const { folio, name, description, current_price, category, client_id, product_type, users_count } = data;
  const [result] = await queryRunner.query(
    `INSERT INTO products (folio, name, description, current_price, category, client_id, product_type, users_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      folio || null,
      name,
      description || null,
      current_price,
      category || null,
      client_id || null,
      normalizeCatalogProductType(product_type),
      users_count || 0,
    ],
  );
  return result.insertId;
}

/**
 * Actualiza campos de un producto.
 * @param {number|string} id
 * @param {object} fields — Campos a actualizar
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function updateProduct(id, fields, queryRunner = pool, options = {}) {
  const setClauses = [];
  const params = { id };

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = :${key}`);
    params[key] = value;
  }

  if (options.bumpRevision) {
    setClauses.push("update_version = COALESCE(update_version, 1) + 1");
    setClauses.push("updated_at = CURRENT_TIMESTAMP");
  }

  if (!setClauses.length) return;

  await queryRunner.query(
    `UPDATE products SET ${setClauses.join(", ")} WHERE id = :id`,
    params,
  );
}


/**
 * Elimina un producto y su historial de precios.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function deleteProduct(id, queryRunner = pool) {
  await queryRunner.query("DELETE FROM product_price_history WHERE product_id = ?", [id]);
  await queryRunner.query("DELETE FROM quote_items WHERE product_id = ?", [id]);
  await queryRunner.query("DELETE FROM products WHERE id = ?", [id]);
}


/**
 * Inserta un registro en el historial de precios.
 * @param {object} data — { product_id, price }
 * @returns {Promise<void>}
 */
export async function insertPriceHistory({ product_id, price }, queryRunner = pool) {
  await queryRunner.query(
    "INSERT INTO product_price_history (product_id, price) VALUES (?, ?)",
    [product_id, price],
  );
}

/**
 * Registra un movimiento de actualización del producto.
 * @param {object} data
 * @param {number|string} data.product_id
 * @param {number} data.update_version
 * @param {string} data.change_type
 * @param {string|null} data.summary
 * @param {object} [queryRunner]
 * @returns {Promise<void>}
 */
export async function insertProductUpdateHistory(
  { product_id, update_version, change_type, summary },
  queryRunner = pool,
) {
  const [result] = await queryRunner.query(
    `INSERT INTO product_update_history (product_id, update_version, change_type, summary)
     VALUES (?, ?, ?, ?)`,
    [
      product_id,
      Math.max(1, Number(update_version) || 1),
      change_type || "DETAILS",
      summary || null,
    ],
  );
  return result.insertId;
}

/**
 * Limpia el historial de precios de un producto.
 * @param {number|string} productId
 * @returns {Promise<number>} Filas eliminadas
 */
export async function clearPriceHistory(productId) {
  const [result] = await pool.query(
    "DELETE FROM product_price_history WHERE product_id = ?",
    [productId],
  );
  return result.affectedRows || 0;
}

// ─── Categorías ─────────────────────────────────────────────────────────────

/**
 * Lista todas las categorías únicas.
 * @returns {Promise<string[]>}
 */
export async function listCategories() {
  const [rows] = await pool.query(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC",
  );
  return rows.map((r) => r.category);
}

/**
 * Inserta una categoría (crea un producto placeholder si es necesario o maneja la lógica).
 * @param {string} name
 * @returns {Promise<void>}
 */
export async function insertCategory(name) {
  // Las categorías viven como campo en products. Verificar si ya existe.
  const [existing] = await pool.query(
    "SELECT id FROM products WHERE category = ? LIMIT 1",
    [name],
  );
  if (existing.length) return; // Ya existe

  // No se puede insertar una categoría sin producto; esto es una decisión de diseño.
  // La acción original puede manejar esto directamente.
}

/**
 * Elimina una categoría (pone NULL en los productos que la usen).
 * @param {string} name
 * @returns {Promise<number>} Filas afectadas
 */
export async function deleteCategory(name) {
  const [result] = await pool.query(
    "UPDATE products SET category = NULL WHERE category = ?",
    [name],
  );
  return result.affectedRows || 0;
}

/**
 * Lista todas las categorías de la tabla product_categories.
 * @param {object} [queryRunner]
 * @returns {Promise<object[]>}
 */
export async function listProductCategories(queryRunner = pool) {
  const [rows] = await queryRunner.query(
    "SELECT id, name, product_type FROM product_categories ORDER BY name ASC"
  );
  return rows;
}

/**
 * Inserta una categoría en product_categories.
 * @param {string} name
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function insertProductCategory(name, queryRunner = pool) {
  const safeName = String(name || "").trim();
  await queryRunner.query(
    `INSERT INTO product_categories (name)
     VALUES (:name)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    { name: safeName },
  );
  const [rows] = await queryRunner.query(
    "SELECT id, name, product_type FROM product_categories WHERE name = :name LIMIT 1",
    { name: safeName },
  );
  return rows[0];
}

/**
 * Inserta o actualiza el tipo asignado a una categoría.
 * @param {string} name
 * @param {string} productType
 * @param {object} [queryRunner]
 * @returns {Promise<object>}
 */
export async function upsertProductCategoryType(name, productType, queryRunner = pool) {
  const safeName = String(name || "").trim();
  const safeType = normalizeCatalogProductType(productType);

  await queryRunner.query(
    `INSERT INTO product_categories (name, product_type)
     VALUES (:name, :product_type)
     ON DUPLICATE KEY UPDATE product_type = VALUES(product_type)`,
    { name: safeName, product_type: safeType },
  );

  const [rows] = await queryRunner.query(
    "SELECT id, name, product_type FROM product_categories WHERE name = :name LIMIT 1",
    { name: safeName },
  );

  return rows[0];
}

/**
 * Elimina una categoría de product_categories por su ID.
 * @param {number|string} id
 * @param {object} [queryRunner]
 * @returns {Promise<number>}
 */
export async function deleteProductCategory(id, queryRunner = pool) {
  const [res] = await queryRunner.query(
    "DELETE FROM product_categories WHERE id = :id",
    { id }
  );
  return res.affectedRows || 0;
}

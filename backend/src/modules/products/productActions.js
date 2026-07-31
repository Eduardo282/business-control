import { pool } from "../../config/db.js";
import {
  clearPriceHistory,
  deleteProduct,
  deleteProductCategory,
  findProductById,
  findProductByIdLean,
  insertPriceHistory,
  insertProduct,
  insertProductCategory,
  insertProductUpdateHistory,
  listProductCategories,
  listProducts,
  normalizeCatalogProductType,
  searchProducts,
  updateProduct,
  upsertProductCategoryType,
} from "../../repositories/product.repository.js";

const PRODUCT_FOLIO_PREFIXES = {
  PRODUCT: "PRD",
  CONTPAQI: "PRD",
  SERVICE: "SRV",
  POLICY: "POL",
};

function buildProductFolio(productId, productType) {
  const prefix = PRODUCT_FOLIO_PREFIXES[productType] || PRODUCT_FOLIO_PREFIXES.PRODUCT;
  return `${prefix}-${String(productId).padStart(6, "0")}`;
}

const PRODUCT_FIELD_LABELS = {
  name: "nombre",
  category: "categoría",
  users_count: "usuarios",
  description: "descripción",
};

function buildProductUpdateSummary(fields) {
  const labels = Object.keys(fields)
    .map((key) => PRODUCT_FIELD_LABELS[key] || key)
    .join(", ");

  return labels ? `Datos editados: ${labels}` : "Datos del producto editados";
}

/**
 * Lists products, optionally filtered by client_id.
 * @param {object} [params]
 * @param {string|number} [params.client_id]
 * @returns {Promise<Array<object>>}
 */
export async function listProductsAction({ client_id } = {}) {
  return listProducts({ client_id });
}

/**
 * Searches products by query text and optional client ID.
 * @param {object} [params]
 * @param {string} [params.q]
 * @param {string|number} [params.client_id]
 * @returns {Promise<Array<object>>}
 */
export async function searchProductsAction({ q, client_id } = {}) {
  return searchProducts(q, client_id);
}

/**
 * Fetches product detail by ID.
 * @param {object} params
 * @param {string|number} params.id
 * @returns {Promise<object|null>}
 */
export async function getProductAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  return findProductById(id);
}

/**
 * Creates a product with transactional history & folio allocation.
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createProductAction({
  name,
  category,
  price,
  description,
  users_count,
  client_id,
  product_type,
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const safeType = normalizeCatalogProductType(product_type);
    const safeUsersCount =
      safeType === "SERVICE" || safeType === "POLICY" ? 1 : users_count || 0;

    const productId = await insertProduct(
      {
        name,
        category,
        current_price: price,
        description: description || null,
        users_count: safeUsersCount,
        client_id: client_id || null,
        product_type: safeType,
      },
      conn,
    );

    await upsertProductCategoryType(category, safeType, conn);

    const folio = buildProductFolio(productId, safeType);
    await updateProduct(productId, { folio }, conn);
    await insertPriceHistory({ product_id: productId, price }, conn);
    const updateHistoryId = await insertProductUpdateHistory(
      {
        product_id: productId,
        update_version: 1,
        change_type: "CREATED",
        summary: "Registro inicial del producto",
      },
      conn,
    );

    await conn.commit();
    const now = new Date();
    return {
      id: productId,
      folio,
      name,
      category,
      current_price: price,
      users_count: safeUsersCount,
      description,
      client_id,
      product_type: safeType,
      update_version: 1,
      created_at: now,
      updated_at: now,
      price_history: [],
      update_history: [
        {
          id: updateHistoryId,
          product_id: productId,
          update_version: 1,
          change_type: "CREATED",
          summary: "Registro inicial del producto",
          changed_at: now,
        },
      ],
    };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

/**
 * Updates a product detail with revision tracking.
 * @param {string|number} id
 * @param {object} input
 * @returns {Promise<object>}
 */
export async function updateProductAction(
  id,
  { name, category, description, users_count },
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const current = await findProductByIdLean(id, conn);
    if (!current) throw new Error("Producto no encontrado");

    const fields = {};

    if (name !== undefined && String(current.name ?? "") !== String(name ?? "")) {
      fields.name = name;
    }
    if (category !== undefined && String(current.category ?? "") !== String(category ?? "")) {
      fields.category = category;
    }
    if (
      users_count !== undefined &&
      Number(current.users_count || 0) !== Number(users_count || 0)
    ) {
      fields.users_count = users_count;
    }
    if (
      description !== undefined &&
      String(current.description ?? "") !== String(description ?? "")
    ) {
      fields.description = description;
    }

    if (Object.keys(fields).length > 0) {
      await updateProduct(id, fields, conn, { bumpRevision: true });
      const updated = await findProductByIdLean(id, conn);
      await insertProductUpdateHistory(
        {
          product_id: id,
          update_version: updated.update_version,
          change_type: "DETAILS",
          summary: buildProductUpdateSummary(fields),
        },
        conn,
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  return await findProductById(id);
}

/**
 * Updates current price of a product with price history recording.
 * @param {string|number} id
 * @param {number} price
 * @returns {Promise<object>}
 */
export async function updateProductPriceAction(id, price) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const current = await findProductByIdLean(id, conn);
    if (!current) throw new Error("Producto no encontrado");

    await updateProduct(id, { current_price: price }, conn, { bumpRevision: true });
    await insertPriceHistory({ product_id: id, price }, conn);
    const updated = await findProductByIdLean(id, conn);

    await insertProductUpdateHistory(
      {
        product_id: id,
        update_version: updated.update_version,
        change_type: "PRICE",
        summary: `Actualización de precio a $${Number(price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      },
      conn,
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return await findProductById(id);
}

/**
 * Deletes a product.
 * @param {object} params
 * @param {string|number} params.id
 * @returns {Promise<boolean>}
 */
export async function deleteProductAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? idOrObj.id : idOrObj;
  if (!id) return false;
  const rowsAffected = await deleteProduct(id);
  return rowsAffected > 0;
}

/**
 * Clears product price history.
 * @param {object} params
 * @param {string|number} params.id
 * @returns {Promise<boolean>}
 */
export async function clearProductPriceHistoryAction(idOrObj) {
  const id = typeof idOrObj === "object" && idOrObj !== null ? (idOrObj.id ?? idOrObj.product_id) : idOrObj;
  return clearPriceHistory(id);
}

/**
 * Lists all product categories with metadata.
 */
export async function listCategoriesAction() {
  return await listProductCategories();
}

/**
 * Creates a product category.
 */
export async function createCategoryAction(name) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("El nombre de la categoría no puede estar vacío.");

  return insertProductCategory(safeName);
}

/**
 * Assigns product type to a category.
 */
export async function assignCategoryTypeAction(name, productType) {
  const safeName = String(name || "").trim();
  if (!safeName) throw new Error("El nombre de la categoría no puede estar vacío.");

  return upsertProductCategoryType(safeName, normalizeCatalogProductType(productType));
}

/**
 * Deletes a category by ID.
 */
export async function deleteCategoryAction(id) {
  const affected = await deleteProductCategory(id);
  return affected > 0;
}

import { pool } from "../../../config/db.js";
import {
  insertPriceHistory,
  insertProduct,
  insertProductUpdateHistory,
  normalizeCatalogProductType,
  updateProduct,
  upsertProductCategoryType,
} from "../../../repositories/product.repository.js";

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

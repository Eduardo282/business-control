import { pool } from "../../../config/db.js";
import { findContactById, insertContactProduct } from "../../../repositories/contact.repository.js";
import { findProductByIdLean } from "../../../repositories/product.repository.js";
import {
  insertProductFulfillmentRecord,
  resolveProductFulfillmentTarget,
} from "../../../services/productFulfillmentRegistry.service.js";

const POLICY_ALLOWED_STATUS = new Set(["ACTIVE", "EXPIRED", "CANCELLED"]);

function normalizeStoredStatus(status) {
  const normalized = String(status || "")
    .trim()
    .toUpperCase();
  return POLICY_ALLOWED_STATUS.has(normalized) ? normalized : "ACTIVE";
}

export async function createContactProductAction({
  contact_id,
  product_id,
  license_key,
  start_date,
  expiration_date,
  status,
}) {
  const connection = await pool.getConnection();
  let txStarted = false;

  try {
    await connection.beginTransaction();
    txStarted = true;

    // Obtener client_id del contacto
    const contact = await findContactById(contact_id, connection);
    if (!contact) throw new Error("Contact not found");
    const client_id = contact.client_id;
    const normalizedStatus = normalizeStoredStatus(status);

    const product = await findProductByIdLean(product_id, connection);
    if (!product) {
      throw new Error("Product not found");
    }

    const target = resolveProductFulfillmentTarget(product);

    const contactProductId = await insertContactProduct({
      client_id,
      contact_id,
      product_id,
      license_key,
      start_date,
      expiration_date,
      status: normalizedStatus,
    }, connection);

    await insertProductFulfillmentRecord(connection, target, {
      contact_product_id: contactProductId,
      client_id,
      contact_id,
      product_id,
      folio: license_key,
      start_date,
      expiration_date,
      status: normalizedStatus,
    });

    await connection.commit();

    return {
      id: contactProductId,
      client_id,
      contact_id,
      product_id,
      license_key,
      start_date,
      expiration_date,
      status: normalizedStatus,
    };
  } catch (error) {
    if (txStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

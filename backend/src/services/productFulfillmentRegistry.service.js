import { normalizeProductType } from "../utils/serviceStatus.js";

const PRODUCT_FULFILLMENT_TARGETS = [
  {
    type: "SERVICE",
    tableName: "services",
    foreignKeyPrefix: "services",
    keywords: ["servicio"],
  },
];


export function resolveProductFulfillmentTarget(product = {}) {
  const normalizedType = normalizeProductType(product);
  return (
    PRODUCT_FULFILLMENT_TARGETS.find((target) => target.type === normalizedType) || null
  );
}

export async function insertProductFulfillmentRecord(
  connection,
  target,
  {
    contact_product_id,
    client_id,
    contact_id,
    product_id,
    folio,
    start_date,
    expiration_date,
    status = "ACTIVE",
  },
) {
  if (!target) return;
  if (target.type !== "SERVICE" || target.tableName !== "services") {
    throw new Error("Unsupported product fulfillment target");
  }

  await connection.query(
    `INSERT INTO ${target.tableName} (
      contact_product_id,
      client_id,
      contact_id,
      product_id,
      folio,
      start_date,
      expiration_date,
      status
    ) VALUES (
      :contact_product_id,
      :client_id,
      :contact_id,
      :product_id,
      :folio,
      :start_date,
      :expiration_date,
      :status
    )`,
    {
      contact_product_id,
      client_id,
      contact_id,
      product_id,
      folio,
      start_date,
      expiration_date,
      status,
    },
  );
}

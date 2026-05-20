const PRODUCT_FULFILLMENT_TARGETS = [
  {
    type: "SERVICE",
    tableName: "services",
    foreignKeyPrefix: "services",
    keywords: ["servicio"],
  },
  {
    type: "POLICY",
    tableName: "policies",
    foreignKeyPrefix: "policies",
    keywords: ["poliza"],
  },
];


function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeProductType(productType = "") {
  return String(productType || "")
    .trim()
    .toUpperCase();
}


export function resolveProductFulfillmentTarget(product = {}) {
  const normalizedType = normalizeProductType(product.product_type);
  const typeTarget = PRODUCT_FULFILLMENT_TARGETS.find(
    (target) => target.type === normalizedType,
  );
  if (typeTarget) return typeTarget;

  const searchableText = normalizeText(
    `${product.name || product.product_name || ""} ${product.category || product.product_category || ""}`,
  );

  return (
    PRODUCT_FULFILLMENT_TARGETS.find((target) =>
      target.keywords.some((keyword) => searchableText.includes(keyword)),
    ) || null
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

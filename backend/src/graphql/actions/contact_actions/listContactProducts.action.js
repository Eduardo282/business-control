import { listContactProducts } from "../../../repositories/contact.repository.js";
import {
  determineStatus,
  isServiceOrPolicy,
  normalizeProductType,
} from "../../../utils/policyStatus.js";

export async function listContactProductsAction(contact_id) {
  const rows = await listContactProducts(contact_id);

  return rows
    .filter((row) => isServiceOrPolicy(row))
    .map((row) => ({
      id: row.id,
      contact_id: row.contact_id,
      license_key: row.license_key,
      start_date: new Date(row.start_date).toISOString(),
      expiration_date: new Date(row.expiration_date).toISOString(),
      status: determineStatus(row.status, row.expiration_date),
      product: {
        id: row.product_id,
        folio: row.product_folio,
        name: row.product_name,
        category: row.product_category,
        description: row.product_description,
        current_price: row.current_price,
        is_active: Boolean(row.is_active),
        product_type: normalizeProductType(row),
      },
    }));
}

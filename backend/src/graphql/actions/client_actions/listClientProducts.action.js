import { listClientProducts } from "../../../repositories/client.repository.js";
import { determineStatus } from "../../../utils/policyStatus.js";

export async function listClientProductsAction(client_id) {
  const rows = await listClientProducts(client_id);

  return rows.map((row) => ({
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
    },
  }));
}

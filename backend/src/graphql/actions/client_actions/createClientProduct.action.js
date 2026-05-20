import { createClientProduct } from "../../../repositories/client.repository.js";

export async function createClientProductAction({
  client_id,
  product_id,
  license_key,
  start_date,
  expiration_date,
}) {
  const insertId = await createClientProduct({
    client_id,
    product_id,
    license_key,
    start_date,
    expiration_date,
  });

  return {
    id: insertId,
    client_id,
    product_id,
    license_key,
    start_date,
    expiration_date,
    status: "ACTIVE", // approximation, real status calc in fetch
  };
}

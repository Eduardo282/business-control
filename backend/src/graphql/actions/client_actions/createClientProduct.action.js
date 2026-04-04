import { pool } from "../../../config/db.js";

export async function createClientProductAction({
  client_id,
  product_id,
  license_key,
  start_date,
  expiration_date,
}) {
  const [result] = await pool.query(
    `INSERT INTO client_products (client_id, product_id, license_key, start_date, expiration_date)
     VALUES (:client_id, :product_id, :license_key, :start_date, :expiration_date)`,
    { client_id, product_id, license_key, start_date, expiration_date }
  );

  return {
    id: result.insertId,
    client_id,
    product_id,
    license_key,
    start_date,
    expiration_date,
    status: "ACTIVE", // approximation, real status calc in fetch
  };
}

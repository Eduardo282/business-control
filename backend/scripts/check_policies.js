import "dotenv/config";
import { pool } from "../src/config/db.js";

async function checkRecentPolicies() {
  try {
    const [rows] = await pool.query(`
        SELECT cp.id, cp.contact_id, cp.product_id, cp.client_id, cp.created_at,
               p.name as product_name
        FROM contact_products cp
        JOIN products p ON cp.product_id = p.id
        ORDER BY cp.id DESC
        LIMIT 5
    `);
    console.log("Polizas recientes:", rows);
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
checkRecentPolicies();

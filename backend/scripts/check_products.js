import "dotenv/config";
import { pool } from "../src/config/db.js";

async function checkProducts() {
  console.log("Revisando productos...");
  const [rows] = await pool.query("SELECT id, name, client_id FROM products");
  console.log("Total de productos:", rows.length);
  const global = rows.filter((r) => r.client_id === null);
  const specific = rows.filter((r) => r.client_id !== null);

  console.log("Productos globales (Plantillas):", global.length);
  global.forEach((p) => console.log(` - [${p.id}] ${p.name}`));

  console.log("Productos específicos del cliente:", specific.length);
  specific.forEach((p) =>
    console.log(` - [${p.id}] ${p.name} (Cliente: ${p.client_id})`)
  );

  process.exit(0);
}

checkProducts();

import "dotenv/config";
import { pool } from "../src/config/db.js";

async function addContactRole() {
  console.log("Agregando rol CONTACTO...");
  try {
    await pool.query("INSERT IGNORE INTO roles (name) VALUES ('CONTACTO')");
    console.log("Rol CONTACTO agregado exitosamente.");
    process.exit(0);
  } catch (err) {
    console.error("Error agregando rol:", err);
    process.exit(1);
  }
}

addContactRole();

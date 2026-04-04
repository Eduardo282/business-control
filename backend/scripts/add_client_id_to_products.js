import "dotenv/config";
import { pool } from "../src/config/db.js";

async function migrateProductsClientId() {
  console.log("Migrando products table para soportar aislamiento de clientes...");

  try {
    // 1. Agregar client_id a products
    console.log("Agregando client_id a products table...");
    try {
      await pool.query("ALTER TABLE products ADD COLUMN client_id INT NULL");
      await pool.query(
        "ALTER TABLE products ADD CONSTRAINT fk_products_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE"
      );
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") {
        console.warn(
          "No se pudo agregar la columna o la restricción (podría existir):",
          e.message
        );
      }
    }

    console.log(
      "Migración completa. Los productos ahora se pueden asignar a clientes específicos."
    );
    process.exit(0);
  } catch (error) {
    console.error("Migración fallida:", error);
    process.exit(1);
  }
}

migrateProductsClientId();

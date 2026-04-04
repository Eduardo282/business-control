import "dotenv/config";
import { pool } from "../src/config/db.js";

async function migrateToContactPortal() {
  console.log("Iniciando migración al portal basado en contactos...");

  try {
    // 1. Agregar campos de portal a client_contacts
    console.log("Agregando campos de portal a client_contacts...");
    try {
      await pool.query(
        "ALTER TABLE client_contacts ADD COLUMN has_portal_access TINYINT(1) DEFAULT 0"
      );
      await pool.query(
        "ALTER TABLE client_contacts ADD COLUMN portal_password_hash VARCHAR(255) NULL"
      );
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") throw e;
      console.log("...los campos ya existen.");
    }

    // 2. Eliminar la tabla antigua client_products
    console.log("Eliminando client_products...");
    await pool.query("DROP TABLE IF EXISTS client_products");

    // 3. Crear la nueva tabla contact_products
    console.log("Creando contact_products...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        contact_id INT NOT NULL,
        product_id INT NOT NULL,
        license_key VARCHAR(100) NULL,
        start_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 4. Limpieza de la tabla clients (opcional pero bueno para la consistencia)
    // No se eliminan columnas para evitar la pérdida de datos si el usuario desea revertir,
    // pero semánticamente ahora están obsoletas.

    console.log("Migración completada.");
    process.exit(0);
  } catch (error) {
    console.error("Migración fallida:", error);
    process.exit(1);
  }
}

migrateToContactPortal();

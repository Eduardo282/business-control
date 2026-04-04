import "dotenv/config";
import { pool } from "../src/config/db.js";

async function updateSchema() {
  console.log("Actualizando esquema...");

  try {
    // 1. Agregar portal_password_hash a clients si no existe
    try {
      await pool.query("SELECT portal_password_hash FROM clients LIMIT 1");
      console.log("✓ column portal_password_hash exists in clients");
    } catch (err) {
      if (err.code === "ER_BAD_FIELD_ERROR") {
        console.log("Agregando portal_password_hash a clients...");
        await pool.query(
          "ALTER TABLE clients ADD COLUMN portal_password_hash VARCHAR(255) NULL AFTER has_client_portal_access",
        );
        console.log("✓ Agregado portal_password_hash");
      } else {
        throw err;
      }
    }

    // 2. Crear tabla client_products si no existe
    console.log("Creando tabla client_products si no existe...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        product_id INT NOT NULL,
        license_key VARCHAR(100) NULL,
        start_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);
    console.log("✓ Tablas verificadas/creadas");

    // 3. Crear tablas dedicadas para servicios y polizas si existe contact_products
    const [contactProductsTable] = await pool.query(
      "SHOW TABLES LIKE 'contact_products'",
    );

    if (contactProductsTable.length > 0) {
      console.log("Creando tablas services/policies si no existen...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contact_product_id INT NOT NULL UNIQUE,
          client_id INT NOT NULL,
          contact_id INT NOT NULL,
          product_id INT NOT NULL,
          folio VARCHAR(100) NULL,
          start_date DATE NOT NULL,
          expiration_date DATE NOT NULL,
          status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_services_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
          CONSTRAINT fk_services_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          CONSTRAINT fk_services_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
          CONSTRAINT fk_services_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS policies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contact_product_id INT NOT NULL UNIQUE,
          client_id INT NOT NULL,
          contact_id INT NOT NULL,
          product_id INT NOT NULL,
          folio VARCHAR(100) NULL,
          start_date DATE NOT NULL,
          expiration_date DATE NOT NULL,
          status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_policies_contact_product FOREIGN KEY (contact_product_id) REFERENCES contact_products(id) ON DELETE CASCADE,
          CONSTRAINT fk_policies_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          CONSTRAINT fk_policies_contacts FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
          CONSTRAINT fk_policies_products FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );
      `);

      console.log("Backfill inicial de servicios/polizas...");
      await pool.query(`
        INSERT INTO services (
          contact_product_id,
          client_id,
          contact_id,
          product_id,
          folio,
          start_date,
          expiration_date,
          status
        )
        SELECT
          cp.id,
          cp.client_id,
          cp.contact_id,
          cp.product_id,
          cp.license_key,
          cp.start_date,
          cp.expiration_date,
          cp.status
        FROM contact_products cp
        JOIN products p ON p.id = cp.product_id
        LEFT JOIN services s ON s.contact_product_id = cp.id
        WHERE s.id IS NULL
          AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) = 'servicio personalizado';
      `);

      await pool.query(`
        INSERT INTO policies (
          contact_product_id,
          client_id,
          contact_id,
          product_id,
          folio,
          start_date,
          expiration_date,
          status
        )
        SELECT
          cp.id,
          cp.client_id,
          cp.contact_id,
          cp.product_id,
          cp.license_key,
          cp.start_date,
          cp.expiration_date,
          cp.status
        FROM contact_products cp
        JOIN products p ON p.id = cp.product_id
        LEFT JOIN policies pol ON pol.contact_product_id = cp.id
        WHERE pol.id IS NULL
          AND LOWER(TRIM(REPLACE(REPLACE(REPLACE(p.category, 'á', 'a'), 'Á', 'a'), 'ó', 'o'))) = 'poliza personalizada';
      `);

      console.log("✓ services/policies listas y sincronizadas");
    } else {
      console.log(
        "Tabla contact_products no encontrada. Omitiendo creación de services/policies en update_schema.",
      );
    }

    console.log("Actualización de esquema completada.");
    process.exit(0);
  } catch (error) {
    console.error("Error actualizando esquema:", error);
    process.exit(1);
  }
}

updateSchema();

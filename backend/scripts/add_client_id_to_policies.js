import "dotenv/config";
import { pool } from "../src/config/db.js";

async function addClientIdToContactProducts() {
  const connection = await pool.getConnection();
  try {
    console.log("Agregando columna client_id a contact_products (Policies)...");

    // Checa si la columna existe
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM contact_products LIKE 'client_id'"
    );
    if (columns.length === 0) {
      await connection.query(`
        ALTER TABLE contact_products
        ADD COLUMN client_id INT NOT NULL AFTER id;
      `);

      // Como tenemos datos existentes, necesitamos poblar client_id desde client_contacts
      console.log("Poblando client_id desde contacts...");
      await connection.query(`
        UPDATE contact_products cp
        JOIN client_contacts cc ON cp.contact_id = cc.id
        SET cp.client_id = cc.client_id
      `);

      // Agregar Foreign Key
      await connection.query(`
        ALTER TABLE contact_products
        ADD CONSTRAINT fk_cp_clients FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      `);
      console.log("Columna client_id agregada y poblada.");
    } else {
      console.log("La columna client_id ya existe.");
    }
  } catch (err) {
    console.error("Migración fallida:", err);
  } finally {
    connection.release();
    process.exit();
  }
}

addClientIdToContactProducts();

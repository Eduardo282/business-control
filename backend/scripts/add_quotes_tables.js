import "dotenv/config";
import { pool } from "../src/config/db.js";

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log("Creando tabla de cotizaciones...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        status ENUM('PENDING', 'SENT', 'ACCEPTED', 'REJECTED') DEFAULT 'PENDING',
        notes TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log("Creando tabla de items de cotización...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quote_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quote_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    console.log("Migración completada exitosamente.");
  } catch (err) {
    console.error("Migración fallida:", err);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();

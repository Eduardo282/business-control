import "dotenv/config";
import { pool } from "../src/config/db.js";

async function migrate() {
  try {
    // Check if column already exists
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'quotes' AND COLUMN_NAME = 'folio'
    `);
    if (cols.length > 0) {
      console.log("La columna 'folio' ya existe en 'quotes'. Nada que hacer.");
    } else {
      await pool.query(
        "ALTER TABLE quotes ADD COLUMN folio VARCHAR(30) UNIQUE AFTER id",
      );
      console.log("✓ Columna 'folio' agregada a la tabla 'quotes'.");
    }
  } catch (error) {
    console.error("Error en migración:", error.message);
  } finally {
    process.exit();
  }
}

migrate();

import "dotenv/config";
import { pool } from "../src/config/db.js";

async function addSoftDeleteColumn() {
  const connection = await pool.getConnection();
  try {
    console.log("Añadiendo columna is_deleted_admin a quotes...");
    await connection.query("ALTER TABLE quotes ADD COLUMN is_deleted_admin TINYINT(1) DEFAULT 0;");
    console.log("Columna añadida.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("La columna ya existe.");
    } else {
      console.error(error);
    }
  } finally {
    connection.release();
    process.exit();
  }
}
addSoftDeleteColumn();
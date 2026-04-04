import "dotenv/config";
import { pool } from "../src/config/db.js";

const run = async () => {
  try {
    // Eliminar portal_password_hash primero para evitar problemas si los hay, luego has_client_portal_access
    await pool.query(
      "ALTER TABLE clients DROP COLUMN portal_password_hash, DROP COLUMN has_client_portal_access",
    );
    console.log("Columnas eliminadas exitosamente");
  } catch (e) {
    if (e.code === "ER_CANT_DROP_FIELD_OR_KEY") {
      console.log("Las columnas ya fueron eliminadas o no existen");
    } else {
      console.error(e);
    }
  }
  process.exit();
};

run();

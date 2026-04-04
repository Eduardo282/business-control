import "dotenv/config";
import { pool } from "../src/config/db.js";

const run = async () => {
  try {
    await pool.query(
      "ALTER TABLE quotes ADD COLUMN is_sent_to_client_portal BOOLEAN DEFAULT FALSE",
    );
    console.log("Columna agregada exitosamente");
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("La columna ya existe");
    } else {
      console.error(e);
    }
  }
  process.exit();
};

run();

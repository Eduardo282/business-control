import "dotenv/config";
import { pool } from "../src/config/db.js";

const run = async () => {
  try {
    await pool.query(
      "ALTER TABLE quotes ADD COLUMN contact_id INT NULL, ADD CONSTRAINT fk_quotes_contact FOREIGN KEY (contact_id) REFERENCES client_contacts(id) ON DELETE SET NULL",
    );
    console.log("Columna contact_id agregada exitosamente");
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

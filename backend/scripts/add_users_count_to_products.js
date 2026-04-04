import "dotenv/config";
import { pool } from "../src/config/db.js";

async function addUsersCountToProducts() {
  console.log("Agregando users_count a la tabla products...");

  try {
    await pool.query(
      "ALTER TABLE products ADD COLUMN users_count INT DEFAULT 0"
    );
    console.log("Columna users_count agregada exitosamente.");
    process.exit(0);
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME") {
      console.log("La columna users_count ya existe.");
    } else {
      console.error("Error agregando columna:", err);
      process.exit(1);
    }
  }
}

addUsersCountToProducts();

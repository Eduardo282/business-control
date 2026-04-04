import "dotenv/config";
import { pool } from "../src/config/db.js";

async function checkTables() {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    console.log("Tablas:", rows);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

checkTables();

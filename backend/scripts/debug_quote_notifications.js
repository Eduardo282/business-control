import "dotenv/config";
import { pool } from "../src/config/db.js";

async function run() {
  try {
    const [rows] = await pool.query(
      "SELECT id, status, notification_read FROM quotes WHERE status = 'REQUESTED'",
    );
    console.log("Quotes with REQUESTED status:", rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();

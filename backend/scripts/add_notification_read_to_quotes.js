import "dotenv/config";
import { pool } from "../src/config/db.js";

async function run() {
  console.log("Checking quotes table for notification_read column...");
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query("SELECT notification_read FROM quotes LIMIT 1");
      console.log("Column 'notification_read' already exists.");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Column missing. Adding 'notification_read'...");
        // Default 0 (false)
        await conn.query(
          "ALTER TABLE quotes ADD COLUMN notification_read BOOLEAN DEFAULT FALSE",
        );
        console.log("Column added successfully.");
      } else {
        throw e;
      }
    }
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();

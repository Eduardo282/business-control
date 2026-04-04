import "dotenv/config";
import { pool } from "../src/config/db.js";

async function run() {
  console.log("Checking products table for expires_at column...");
  try {
    const conn = await pool.getConnection();
    try {
      await conn.query("SELECT expires_at FROM products LIMIT 1");
      console.log("Column 'expires_at' already exists.");
    } catch (e) {
      if (e.code === "ER_BAD_FIELD_ERROR") {
        console.log("Column missing. Adding 'expires_at'...");
        await conn.query(
          "ALTER TABLE products ADD COLUMN expires_at DATETIME NULL",
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

import "dotenv/config";
import { pool } from "../src/config/db.js";

const run = async () => {
  try {
    const conn = await pool.getConnection();

    // 1. Make user_id nullable in quotes
    console.log("Modifying quotes table: user_id nullable...");
    try {
      await conn.query("ALTER TABLE quotes MODIFY user_id INT NULL");
      console.log("user_id is now nullable.");
    } catch (e) {
      console.log(
        "Error modifying user_id (might already be nullable or FK issue):",
        e.message,
      );
    }

    // 2. Modify status ENUM to include 'REQUESTED'
    console.log("Modifying quotes table: Adding 'REQUESTED' status...");
    try {
      // Need to read current enum or just replace it. Current: 'PENDING', 'SENT', 'ACCEPTED', 'REJECTED'
      await conn.query(
        "ALTER TABLE quotes MODIFY COLUMN status ENUM('PENDING', 'SENT', 'ACCEPTED', 'REJECTED', 'REQUESTED') DEFAULT 'PENDING'",
      );
      console.log("Status enum updated.");
    } catch (e) {
      console.log("Error updating status enum:", e.message);
    }

    conn.release();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

run();

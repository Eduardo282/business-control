import "dotenv/config";
import { pool } from "../src/config/db.js";

async function run() {
  try {
    const [rows] = await pool.query(
      "SELECT id, status, notification_read, contact_id, client_id FROM quotes WHERE status = 'REQUESTED' AND (notification_read IS NULL OR notification_read = 0) ORDER BY created_at DESC",
    );
    console.log("Quotes matching query:", rows);

    if (rows.length > 0) {
      const first = rows[0];
      if (first.contact_id) {
        const [contacts] = await pool.query(
          "SELECT * FROM client_contacts WHERE id = ?",
          [first.contact_id],
        );
        console.log("Contact details:", contacts);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();

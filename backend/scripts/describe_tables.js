import "dotenv/config";
import { pool } from "../src/config/db.js";

async function describeTables() {
  try {
    const [p] = await pool.query("DESCRIBE products");
    console.log(
      "PRODUCTS:",
      p.map((c) => c.Field)
    );

    const [q] = await pool.query("DESCRIBE quotes");
    console.log(
      "QUOTES:",
      q.map((c) => c.Field)
    );

    const [cp] = await pool.query("DESCRIBE contact_products");
    console.log(
      "CONTACT_PRODUCTS:",
      cp.map((c) => c.Field)
    );
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
}

describeTables();

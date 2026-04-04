import "dotenv/config";
import { pool } from "../src/config/db.js";

async function updateAdminName() {
  const connection = await pool.getConnection();
  try {
    console.log("Actualizando nombre del administrador...");

    const email = "admin@businesscontrol.com";
    const newName = "Marco Antonio Sánchez Álvarez";

    const [result] = await connection.query(
      "UPDATE users SET full_name = ? WHERE email = ?",
      [newName, email],
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Nombre actualizado correctamente a: ${newName}`);
    } else {
      console.log("⚠️ No se encontró el usuario con email:", email);
    }
  } catch (err) {
    console.error("❌ Error actualizando nombre:", err);
  } finally {
    connection.release();
    process.exit();
  }
}

updateAdminName();

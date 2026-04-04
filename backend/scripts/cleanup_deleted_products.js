import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asumimos que .env está en la raíz de backend (un nivel arriba de scripts)
dotenv.config({ path: path.join(__dirname, "../.env") });

// Importación dinámica para que se carguen las variables de entorno primero
const { pool } = await import("../src/config/db.js");

async function cleanup() {
  console.log("Iniciando limpieza de productos eliminados (soft deleted)...");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Eliminar historial de precios de productos inactivos
    const [historyRes] = await conn.query(`
      DELETE FROM product_price_history 
      WHERE product_id IN (SELECT id FROM products WHERE is_active = 0)
    `);
    console.log(`Historial eliminado: ${historyRes.affectedRows} registros.`);

    // 2. Eliminar productos inactivos
    // Nota: quote_items tiene ON DELETE CASCADE, así que se limpiarán solos si existen
    const [prodRes] = await conn.query(`
      DELETE FROM products 
      WHERE is_active = 0
    `);
    console.log(`Productos eliminados: ${prodRes.affectedRows} registros.`);

    await conn.commit();
    console.log("Limpieza completada exitosamente.");
  } catch (error) {
    await conn.rollback();
    console.error("Error durante la limpieza:", error);
  } finally {
    conn.release();
    process.exit();
  }
}

cleanup();

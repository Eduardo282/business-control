import { pool } from "../../../config/db.js";

export async function deleteClientAction(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Eliminar contactos asociados (FK sin cascade)
    await conn.query("DELETE FROM client_contacts WHERE client_id = :id", {
      id,
    });

    // 1.5 Eliminar historial de precios de los productos del cliente para evitar error de FK
    // Primero obtenemos los IDs de los productos
    const [products] = await conn.query(
      "SELECT id FROM products WHERE client_id = :id",
      { id },
    );

    if (products.length > 0) {
      const productIds = products.map((p) => p.id);
      // Borramos el historial
      await conn.query(
        "DELETE FROM product_price_history WHERE product_id IN (?)",
        [productIds],
      );
    }

    // 2. Eliminar cliente (Polizas se eliminan por ON DELETE CASCADE del DB)
    const [res] = await conn.query("DELETE FROM clients WHERE id = :id", {
      id,
    });

    await conn.commit();
    return res.affectedRows > 0;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

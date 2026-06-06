import { pool } from "../../../config/db.js";
import {
  findProductById,
  findProductByIdLean,
  insertPriceHistory,
  insertProductUpdateHistory,
  updateProduct,
} from "../../../repositories/product.repository.js";

export async function updateProductPriceAction(id, newPrice) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const current = await findProductByIdLean(id, conn);
    if (!current) throw new Error("Producto no encontrado");

    await updateProduct(id, { current_price: newPrice }, conn, {
      bumpRevision: true,
    });

    await insertPriceHistory({ product_id: id, price: newPrice }, conn);
    const updated = await findProductByIdLean(id, conn);
    await insertProductUpdateHistory(
      {
        product_id: id,
        update_version: updated.update_version,
        change_type: "PRICE",
        summary: `Precio actualizado a $${Number(newPrice || 0).toFixed(2)}`,
      },
      conn,
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return await findProductById(id);
}

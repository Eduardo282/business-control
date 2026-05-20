import { pool } from "../../../config/db.js";
import { deleteProduct } from "../../../repositories/product.repository.js";

export async function deleteProductAction(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await deleteProduct(id, conn);

    await conn.commit();
    return true;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

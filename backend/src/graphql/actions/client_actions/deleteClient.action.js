import { pool } from "../../../config/db.js";
import { deleteClientCascade } from "../../../repositories/client.repository.js";

export async function deleteClientAction(id) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const success = await deleteClientCascade(id, conn);

    await conn.commit();
    return success;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

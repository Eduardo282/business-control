import { pool } from "../../../config/db.js";

export async function createRoleAction({ name }) {
  const roleName = name?.trim().toUpperCase();
  if (!roleName) throw new Error("Nombre de rol requerido");

  try {
    const [result] = await pool.query(
      `INSERT INTO roles (name) VALUES (:name)`,
      { name: roleName },
    );

    return {
      id: result.insertId,
      name: roleName,
    };
  } catch (e) {
    if (String(e?.code) === "ER_DUP_ENTRY") throw new Error("El rol ya existe");
    throw e;
  }
}

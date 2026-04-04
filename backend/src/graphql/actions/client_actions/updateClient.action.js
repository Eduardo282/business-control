import { pool } from "../../../config/db.js";

export async function updateClientAction(
  id,
  {
    business_name,
    rfc,
    email1,
    email2,
    celular,
    telefono,
    codigo_postal,
    ciudad,
  },
) {
  const updates = [];
  const params = { id };

  if (business_name !== undefined) {
    updates.push("business_name = :business_name");
    params.business_name = business_name;
  }
  if (rfc !== undefined) {
    updates.push("rfc = :rfc");
    params.rfc = rfc;
  }
  if (email1 !== undefined) {
    updates.push("email1 = :email1");
    params.email1 = email1;
  }
  if (email2 !== undefined) {
    updates.push("email2 = :email2");
    params.email2 = email2;
  }
  if (celular !== undefined) {
    updates.push("celular = :celular");
    params.celular = celular;
  }
  if (telefono !== undefined) {
    updates.push("telefono = :telefono");
    params.telefono = telefono;
  }
  if (codigo_postal !== undefined) {
    updates.push("codigo_postal = :codigo_postal");
    params.codigo_postal = codigo_postal;
  }
  if (ciudad !== undefined) {
    updates.push("ciudad = :ciudad");
    params.ciudad = ciudad;
  }

  if (updates.length > 0) {
    await pool.query(
      `UPDATE clients SET ${updates.join(", ")} WHERE id = :id`,
      params,
    );
  }

  // Obtener cliente actualizado
  const [rows] = await pool.query(
    "SELECT id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad FROM clients WHERE id = :id",
    {
      id,
    },
  );
  return rows[0];
}

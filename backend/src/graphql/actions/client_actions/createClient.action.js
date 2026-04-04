import { pool } from "../../../config/db.js";

export async function createClientAction({
  created_by_user_id,
  business_name,
  rfc,
  email1,
  email2,
  celular,
  telefono,
  codigo_postal,
  ciudad,
}) {
  const [result] = await pool.query(
    `INSERT INTO clients (created_by_user_id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad)
     VALUES (:created_by_user_id, :business_name, :rfc, :email1, :email2, :celular, :telefono, :codigo_postal, :ciudad)`,
    {
      created_by_user_id,
      business_name,
      rfc: rfc || null,
      email1: email1 || null,
      email2: email2 || null,
      celular: celular || null,
      telefono: telefono || null,
      codigo_postal: codigo_postal || null,
      ciudad: ciudad || null,
    },
  );

  return {
    id: result.insertId,
    business_name,
    rfc: rfc || null,
    email1: email1 || null,
    email2: email2 || null,
    celular: celular || null,
    telefono: telefono || null,
    codigo_postal: codigo_postal || null,
    ciudad: ciudad || null,
  };
}

import { pool } from "../../../config/db.js";

/**
 * Inserta múltiples clientes de forma eficiente.
 * @param {string} created_by_user_id
 * @param {Array<object>} clients - Array de objetos con los campos del cliente
 * @returns {Array<object>} clientes creados con su id
 */
export async function bulkCreateClientsAction(created_by_user_id, clients) {
  if (!clients.length) return [];

  const results = [];
  // Batch de 100 para evitar queries demasiado grandes
  const BATCH = 100;

  for (let i = 0; i < clients.length; i += BATCH) {
    const batch = clients.slice(i, i + BATCH);

    const placeholders = [];
    const params = {};

    batch.forEach((c, idx) => {
      placeholders.push(
        `(:uid_${idx}, :bn_${idx}, :rfc_${idx}, :e1_${idx}, :e2_${idx}, :cel_${idx}, :tel_${idx}, :cp_${idx}, :cd_${idx})`,
      );
      params[`uid_${idx}`] = created_by_user_id;
      params[`bn_${idx}`] = c.business_name;
      params[`rfc_${idx}`] = c.rfc || null;
      params[`e1_${idx}`] = c.email1 || null;
      params[`e2_${idx}`] = c.email2 || null;
      params[`cel_${idx}`] = c.celular || null;
      params[`tel_${idx}`] = c.telefono || null;
      params[`cp_${idx}`] = c.codigo_postal || null;
      params[`cd_${idx}`] = c.ciudad || null;
    });

    const sql = `INSERT INTO clients (created_by_user_id, business_name, rfc, email1, email2, celular, telefono, codigo_postal, ciudad) VALUES ${placeholders.join(", ")}`;

    const [result] = await pool.query(sql, params);

    // MySQL retorna firstInsertId, y cada fila consecutiva tiene id+1
    const firstId = result.insertId;
    batch.forEach((c, idx) => {
      results.push({
        id: firstId + idx,
        business_name: c.business_name,
        rfc: c.rfc || null,
        email1: c.email1 || null,
        email2: c.email2 || null,
        celular: c.celular || null,
        telefono: c.telefono || null,
        codigo_postal: c.codigo_postal || null,
        ciudad: c.ciudad || null,
      });
    });
  }

  return results;
}

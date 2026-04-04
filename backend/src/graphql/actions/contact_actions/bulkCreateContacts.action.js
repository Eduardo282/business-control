import { pool } from "../../../config/db.js";

/**
 * Inserta múltiples contactos de forma eficiente.
 * @param {Array<object>} contacts - Array con { client_id, full_name, email, phone, position_title }
 * @returns {Array<object>} contactos creados con su id
 */
export async function bulkCreateContactsAction(contacts) {
  if (!contacts.length) return [];

  const results = [];
  const BATCH = 100;

  for (let i = 0; i < contacts.length; i += BATCH) {
    const batch = contacts.slice(i, i + BATCH);

    const placeholders = [];
    const params = {};

    batch.forEach((c, idx) => {
      placeholders.push(
        `(:cid_${idx}, :fn_${idx}, :em_${idx}, :ph_${idx}, :pt_${idx})`,
      );
      params[`cid_${idx}`] = c.client_id;
      params[`fn_${idx}`] = c.full_name;
      params[`em_${idx}`] = c.email || null;
      params[`ph_${idx}`] = c.phone || null;
      params[`pt_${idx}`] = c.position_title || null;
    });

    const sql = `INSERT INTO client_contacts (client_id, full_name, email, phone, position_title) VALUES ${placeholders.join(", ")}`;

    const [result] = await pool.query(sql, params);

    const firstId = result.insertId;
    batch.forEach((c, idx) => {
      results.push({
        id: firstId + idx,
        client_id: c.client_id,
        full_name: c.full_name,
        email: c.email || null,
        phone: c.phone || null,
        position_title: c.position_title || null,
      });
    });
  }

  return results;
}
